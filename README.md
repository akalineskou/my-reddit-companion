# My Reddit Companion

## Description

**My Reddit Companion** is an extension that integrates Reddit into the browser.  
It has a new slick responsive UI made with Bootstrap 4.  
  
After opening a Reddit link, either by clicking the thumbnail/title or using the keyboard (supports RES keyboard nav), it shows a bar with common info (score, title, subreddit, comments) and actions (login, upvote, downvote, save, moderator spam/remove/approve, close or minimize).  
  
Moderator actions and unread messages notifications are enabled by default.  
It has a lot of options, like to disable the aforementioned options, a dark theme, transparent background, start the bar minimized, bar persists between pages and others (see the settings screenshot for the complete list).  
  
After minimizing the bar, right click the maximize button to move it in the opposite direction (if it blocks anything in the page).  
Supports links with multiple redirects.  
  
Click the browser action to open a new tab to the Reddit submit page with the url and title autocompleted.
  
## Install

The Firefox Add-on can be [found here](https://addons.mozilla.org/en-US/firefox/addon/my-reddit-companion).  
The Chrome Plugin can be [found here](https://chrome.google.com/webstore/detail/my-reddit-companion/ghkmgdhpbkijdnnhodlejkbpehnkoglf).  
The Opera Extension can be [found here](https://addons.opera.com/en/extensions/details/my-reddit-companion).

## Screenshots

[Screenshot](https://raw.githubusercontent.com/alex2005git/my-reddit-companion/master/screenshots/1-full.jpg)  
[Screenshot responsive](https://raw.githubusercontent.com/alex2005git/my-reddit-companion/master/screenshots/2-responsive.jpg)  
[Screenshot settings](https://raw.githubusercontent.com/alex2005git/my-reddit-companion/master/screenshots/3-settings.jpg)  
[Screenshot minimized](https://raw.githubusercontent.com/alex2005git/my-reddit-companion/master/screenshots/4-minimized.jpg)  
  
[Screenshot old](https://raw.githubusercontent.com/alex2005git/my-reddit-companion/master/screenshots/9-old.jpg)  

## History

What began as some changes to the *creesch/reddit-companion* source code to make it work with Firefox, ended up being a complete rewrite, with lots of features, old and new.  
  
Based on https://github.com/creesch/reddit-companion  
Which was based on https://github.com/reddit/reddit-companion  
Which was based on https://github.com/chromakode/shine

## Debug

Load the `manifest.json` file in Firefox (`about:debugging`), or the `src` folder in Chrome/Opera (`chrome://extensions` with developer mode enabled).  
Optionally enable console debugging by changing the value of `console_logging` to `true` in `debug.js`