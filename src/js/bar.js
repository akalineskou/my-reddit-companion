/* global browser, Utils */

var port = browser.runtime.connect({
    name: window.location.hash.substr(1)
});

port.onMessage.addListener(function (request) {
    console.log('Info: Incoming bar message request', request);

    switch (request.action) {
        case 'overlayRedditBarData':
            Bar.init(request.data, request.logged_in);
            break
    }
});

var Bar = {
    initiated: false,
    data: null,
    logged_in: false,
    init: function (data, logged_in) {
        if (Bar.initiated || data._fake) {
            return;
        }

        Bar.data = data;
        Bar.logged_in = logged_in;

        $('#upvote').click(function () {
            Bar.actionUpvote();
        });

        $('#downvote').click(function () {
            Bar.actionDownvote();
        });

        $('#save').click(function () {
            Bar.actionSave();
        });

        $('#login').click(function () {
            window.open('https://www.reddit.com/login');
        });

        $('#close').click(function () {
            Bar.actionClose();
        });

        Bar.initiated = true;

        Bar.setBarData();
    },
    setBarData: function () {
        $('#title').text(Bar.data.title);

        if (Bar.logged_in) {
            $('#bar').removeClass('logged-out').addClass('logged-in');
        } else {
            $('#bar').removeClass('logged-in').addClass('logged-out');
        }

        if (Bar.data.permalink) {
            $('#title').attr('href', 'https://www.reddit.com' + Bar.data.permalink);
        }

        if (Bar.data.likes === true) {
            $('#bar').removeClass('disliked').addClass('liked');
        } else if (Bar.data.dislikes === true) {
            $('#bar').removeClass('liked').addClass('disliked');
        } else {
            $('#bar').removeClass('liked disliked');
        }

        if (Bar.data.saved) {
            $('#bar').addClass('saved');
        } else {
            $('#bar').removeClass('saved');
        }

        $('#score').text(Bar.data.score);

        if (Bar.data.subreddit) {
            $('#subreddit')
                    .text(Bar.data.subreddit)
                    .attr('href', 'https://www.reddit.com/' + Bar.data.subreddit);
        } else {
            $('#bar').removeClass('subreddit');
        }

        $('#comments').attr('href', 'https://www.reddit.com' + Bar.data.permalink);
        $('#comments span').text(Bar.data.num_comments);
    },
    actionUpvote: function (post_message = true) {
        if (!Bar.data.likes) {
            Bar.data.score++;
        } else {
            Bar.data.score--;
        }
        Bar.data.likes = !Bar.data.likes;

        if (post_message) {
            if (Bar.data.dislikes) {
                Bar.actionDownvote(false);
            }

            Bar.actionPostMessage('bar_like');
            Bar.setBarData();
        }
    },
    actionDownvote: function (post_message = true) {
        if (!Bar.data.dislikes) {
            Bar.data.score--;
        } else {
            Bar.data.score++;
        }
        Bar.data.dislikes = !Bar.data.dislikes;

        if (post_message) {
            if (Bar.data.likes) {
                Bar.actionUpvote(false);
            }

            Bar.actionPostMessage('bar_dislike');
            Bar.setBarData();
        }
    },
    actionSave: function () {
        var action;
        if (!Bar.data.saved) {
            action = 'bar_save';
        } else {
            action = 'bar_unsave';
        }

        Bar.data.saved = !Bar.data.saved;

        Bar.actionPostMessage(action);
        Bar.setBarData();
    },
    actionClose: function () {
        var request = Bar.actionPostMessage('bar_close');
        Utils.postMessageToTopWindow(request);
    },
    actionPostMessage: function (action) {
        var request = {
            action: action,
            data: Bar.data
        };

        port.postMessage(request);

        return request;
    }
};