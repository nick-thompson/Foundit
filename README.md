# Foundit
A Google Chrome extension for better bookmark management.

## Overview
Foundit offers Chrome users a quicker and more intuitive way to reach their
bookmarks. It scrapes your bookmarks, and maintains an up-to-date inverted 
index on your local system. Typing "foundit" into the omnibox enables you to 
search your bookmarks based on their content, not just by title or url. Now
you can bookmark more frequently and worry less about organizing your collection.

## Installation
You can install Foundit directly from the Chrome Web Store:
https://chrome.google.com/webstore/detail/foundit/kckobojmajgneicjgbpcccionajfobbo

If you'd like to install a development version, read below.

## Contributing
I started Foundit as a solution to organizing a large collection of bookmarks,
and I'm hopeful that opening up the project to other developers will help me
build a more comprehensive and effective solution to that problem. If you have
ideas for making Foundit better, I welcome your help!

To get started, you'll want to fork this repo and pull the code. Then, to install
the development version of the extension, follow step 4 on Google's "Getting Started"
tutorial here: https://developer.chrome.com/extensions/getstarted.html#load.
The extension code is located in the ext/ folder.

The server code is used to scrape the bookmarks. It is hosted with Nodejitsu
at foundit.jit.su. You can run it locally with "node server.js", assuming
you have Node.js installed, and you can connect the extension to your local
server by changing the ajax call (ext/background.js:28) to point to localhost.
