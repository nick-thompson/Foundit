
// Dependencies
var express = require("express")
  , http = require("http")
  , jsdom = require("jsdom")
  , stoplist = require("./stoplist").stoplist
  , stemmer = require("./stemmer").stemmer
  , app = express();

// Configuration
app.configure(function () {
  app.use(express.bodyParser());
});

// Indexing functions
var getWordlist = function (window) {
  var words = [];
  if (!window || !window.document.body)
    return words;
  (function walk (root) {
    var i = root.childNodes.length;
    while (i--) {
      var child = root.childNodes[i];
      if (child.nodeType == 3) {
        var w = child.data.split(/\s+/g)
          , j = w.length;
        while (j--) {
          if (!/\W+/.test(w[j]) && stoplist.indexOf(w[j]) == -1)
            words.push(stemmer(w[j].toLowerCase()));
        }
      } else if (child.nodeType == 1)
        walk(child);
    }
  })(window.document.body);
  return words;
};

var updateIndex = function (index, bid, words) {
  words.forEach(function (word) {
    if (!index.hasOwnProperty(word)) {
      index[word] = {
        df: 0,
        postings: {}
      };
    }
    if (!index[word]["postings"].hasOwnProperty(bid)) {
      index[word].df++;
      index[word]["postings"][bid] = {
        tf: 0
      };
    }
    index[word]["postings"][bid].tf++;
  });
};

var getWeight = function (tf, df, N) {
  var tfw = 1 + (Math.log(tf) / Math.log(10));
  var idf = Math.log(N/df) / Math.log(10);
  return tfw * idf;
};

var buildWeightIndex = function (index, N) {
  for (var word in index) {
    var postings = index[word]["postings"];
    for (var doc in postings) {
      var weight = getWeight(postings[doc].tf, index[word].df, N);
      postings[doc] = weight;
    }
    delete index[word]["df"];
  }
  return index;
};

// Routes
app.post("/go", function (req, res) {
  var bookmarks = JSON.parse(req.body.bookmarks)
    , left = bookmarks.length
    , index = {};

  bookmarks.forEach(function (bookmark) {

    if (/(\.pdf|\.jpg|\.png|\.gif|\.bmp)$/.test(bookmark.url)) {
      // Need to process these resources with a different method. Not
      // sure what yet... for images, probably just parse the url and
      // title of the bookmark to build the word list.
      left--;
      return false;
    }

    jsdom.env({
      html: bookmark.url,
      done: function (errors, window) {
        if (errors) {
          console.log(errors);
          left--;
        } else {
          updateIndex(index, bookmark.bid, getWordlist(window));
          if (--left === 0) {
            res.json({
              count: bookmarks.length,
              index: buildWeightIndex(index, bookmarks.length)
            });
          }
        }
      }
    });

  });

});

// Listen
http.createServer(app).listen(3000, function () {
  console.log("Express server listening on port 3000");
});
