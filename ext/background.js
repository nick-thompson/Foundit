(function ($, stemmer) {

  // Recursively walks Chrome's bookmark tree, collecting necessary
  // information for the indexing process.
  var walkBookmarkTree = function (nodes) {
    var bookmarks = [];
    (function walk (nodes) {
      nodes.forEach(function (node) {
        if (node.children && node.children.length)
          walk(node.children);
        else if (!node.children)
          bookmarks.push({
            title: node.title,
            url: node.url,
            bid: node.id
          });
      });
    })(nodes);
    return bookmarks;
  };

  // Index bookmarks via server call
  var init = function () {
    chrome.bookmarks.getTree(function (nodes) {
      console.log("Indexing bookmarks...");
      var bookmarks = walkBookmarkTree(nodes);
      $.ajax({
        url: "http://foundit.jit.su/go",
        type: "post",
        data: {
          bookmarks: JSON.stringify(bookmarks)
        },
        success: function (data) {
          console.log("done!");
          localStorage.clear();
          localStorage["Foundit"] = JSON.stringify(data);
          window.Foundit = data;
        },
        error: function (xhr, msg, exception) {
          console.log("Server error: " + msg);
          console.log(exception);
        }
      });
    });
  };

  // Underscore.js extend function. Modified slightly, for merging
  // postings from the index.
  var extend = function (obj, sources) {
    sources.forEach(function (source) {
      for (var prop in source) {
        if (obj.hasOwnProperty(prop))
          obj[prop] += source[prop];
        else
          obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Queries the local inverted index given a search string
  var search = function (text, callback) {
    // Don't want to start before the index is ready
    if (!window.Foundit)
      return false;
    var words = text.split(/\s+/g)
      , index = window.Foundit.index
      , postings = [];
    // Retrieve postings
    words.forEach(function (word) {
      var w = stemmer(word);
      if (index.hasOwnProperty(w))
        postings.push(index[w].postings);
    });
    // Will we be able to make suggestions?
    if (postings.length == 0) {
      callback([{ 
        content: "http://www.youtube.com/watch?v=INscMGmhmX4",
        description: "No suggestions available."
      }]);
      return false;
    } 
    // Aggregate document relevance weights
    var docs = (function () {
      var tmp = extend({}, postings)
        , ret = [];
      for (var doc in tmp)
        ret.push([doc, tmp[doc]]);
      return ret;
    })();
    // Sort results, higher weights first
    docs.sort(function (a, b) {
      return b[1] - a[1];
    });
    // Suggest results
    var suggestions = docs.slice(0, 5).map(function (doc) { 
      return doc[0];
    });
    chrome.bookmarks.get(suggestions, function (bookmarks) {
      var results = bookmarks.map(function (bookmark) {
        return {
          content: bookmark.url,
          description: bookmark.title.replace(/[^a-zA-Z 0-9]+/g, "")
        };
      });
      callback(results);
    });
  };

  // Chrome interfacing
  chrome.bookmarks.onCreated.addListener(init);
  chrome.bookmarks.onRemoved.addListener(init);
  chrome.bookmarks.onChanged.addListener(init);
  chrome.omnibox.onInputChanged.addListener(search);
  chrome.omnibox.onInputEntered.addListener(function (text) {
    chrome.tabs.update({
      url: text
    });
  });

  // Initialize on load
  if (!localStorage.getItem("Foundit"))
    init();
  else
    window.Foundit = JSON.parse(localStorage["Foundit"]);

})(jQuery, stemmer);
