/* global Utils */

$(document).ready(function () {
    BarElements.init();

    Utils.myRuntimeSendMessage({
        action: 'content_bar_init',
        slug: window.location.hash.substr(1) || ''
    }, function (response) {
        if (!Utils.varIsUndefined(response)) {
            Utils.myConsoleLog('info', "'content_bar_init' response", response);

            Bar.init(response.data, response.logged_in);
        }
    });

    $(window).resize(Bar.windowResize);

    Utils.postMessageToTopWindow({
        action: 'content_bar_init',
        height: BarElements.getBarHeight()
    });
});

var BarElements = {
    init: function () {
        BarElements.$bar = $('#content_bar');

        BarElements.$logo = BarElements.$bar.find('.content_logo');
        BarElements.$logo_label = BarElements.$bar.find('.content_logo_label');
        BarElements.$score = BarElements.$bar.find('.content_score');
        BarElements.$title = BarElements.$bar.find('.content_title');
        BarElements.$subreddit = BarElements.$bar.find('.content_subreddit');
        BarElements.$upvote = BarElements.$bar.find('.content_upvote');
        BarElements.$downvote = BarElements.$bar.find('.content_downvote');
        BarElements.$comments = BarElements.$bar.find('.content_comments');
        BarElements.$save = BarElements.$bar.find('.content_save');
        BarElements.$login = BarElements.$bar.find('.content_login');
        BarElements.$close = BarElements.$bar.find('.content_close');
    },
    getBarHeight: function () {
        return BarElements.$bar.height();
    },
    toggleBarClasses: function (fluid_container) {
        BarElements.$bar.toggleClass('container', !fluid_container);
        BarElements.$bar.toggleClass('container-fluid', fluid_container);
    },
    setLogoData: function () {
        BarElements.$logo.prop('title', 'Return to reddit');
        BarElements.$logo.prop('href', Utils.redditUrl());

        BarElements.$logo.find('img').prop('alt', 'Reddit logo');
    },
    setLogoLabelData: function () {
        BarElements.$logo_label.text('reddit');
        BarElements.$logo_label.prop('title', 'Return to reddit');
        BarElements.$logo_label.prop('href', Utils.redditUrl());
    },
    setScoreData: function (score, likes, dislikes) {
        BarElements.$score.text(score);

        BarElements.$score.toggleClass('btn-outline-secondary', !likes && !dislikes);
        BarElements.$score.toggleClass('btn-outline-warning', likes || false);
        BarElements.$score.toggleClass('btn-outline-primary', dislikes || false);
    },
    setTitleData: function (title, href) {
        BarElements.$title.text(title);
        BarElements.$title.prop('href', href);
    },
    setSubredditData: function (hide_subreddit, subreddit) {
        BarElements.$subreddit.closest('div').toggleClass('display_none', hide_subreddit);

        BarElements.$subreddit.text(subreddit);
        BarElements.$subreddit.prop('href', `${Utils.redditUrl()}/${subreddit}`);
    },
    setLoginData: function (hide_labels) {
        BarElements.$login.closest('div').toggleClass('display_none', Bar.logged_in);
        BarElements.$login.find('span').toggleClass('display_none', hide_labels);

        BarElements.$login.prop('href', `${Utils.redditUrl()}/login`);
    },
    setUpvoteData: function (hide_labels, likes) {
        BarElements.$upvote.closest('div').toggleClass('display_none', !Bar.logged_in);
        BarElements.$upvote.find('span').toggleClass('display_none', hide_labels);

        BarElements.$upvote.toggleClass('active', likes || false);
    },
    setDownvoteData: function (hide_labels, dislikes) {
        BarElements.$downvote.closest('div').toggleClass('display_none', !Bar.logged_in);
        BarElements.$downvote.find('span').toggleClass('display_none', hide_labels);

        BarElements.$downvote.toggleClass('active', dislikes || false);
    },
    setSaveData: function (hide_labels, saved) {
        BarElements.$save.closest('div').toggleClass('display_none', !Bar.logged_in);
        BarElements.$save.find('span').toggleClass('display_none', hide_labels);

        BarElements.$save.toggleClass('active', saved);
    },
    setCommentsData: function (num_comments, href) {
        BarElements.$comments.find('span').text(num_comments);
        BarElements.$comments.prop('href', href);
    },
    setLinksParent: function () {
        BarElements.$bar.find('a').each(function () {
            $(this).attr('target', '_top');
        });
    }
};

var Bar = {
    init: function (data, logged_in) {
        Bar.data = data;
        Bar.logged_in = logged_in;

        BarElements.$upvote.click(function () {
            Bar.actionUpvote();
        });
        BarElements.$downvote.click(function () {
            Bar.actionDownvote();
        });
        BarElements.$save.click(function () {
            Bar.actionSave();
        });
        BarElements.$close.click(function () {
            Bar.actionClose();
        });

        Bar.setBarData();
    },
    setBarData: function () {
        var permalink = `${Utils.redditUrl()}${Bar.data.permalink}`;

        var fluid_container = false;
        var hide_labels = false;
        var hide_subreddit = false;

        BarElements.toggleBarClasses(fluid_container);
        BarElements.setLogoData();
        BarElements.setLogoLabelData();
        BarElements.setScoreData(Bar.data.score, Bar.data.likes, Bar.data.dislikes);
        BarElements.setTitleData(Bar.data.title, permalink);
        BarElements.setSubredditData(hide_subreddit, Bar.data.subreddit);
        BarElements.setLoginData(hide_labels);
        BarElements.setUpvoteData(hide_labels, Bar.data.likes);
        BarElements.setDownvoteData(hide_labels, Bar.data.dislikes);
        BarElements.setSaveData(hide_labels, Bar.data.saved);
        BarElements.setCommentsData(Bar.data.num_comments, permalink);

        BarElements.setLinksParent();
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

            Bar.actionPostMessage('content_bar_like');
        }

        Bar.setBarData();
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

            Bar.actionPostMessage('content_bar_dislike');
        }

        Bar.setBarData();
    },
    actionSave: function () {
        var action;
        if (!Bar.data.saved) {
            action = 'content_bar_save';
        } else {
            action = 'content_bar_unsave';
        }

        Bar.data.saved = !Bar.data.saved;

        Bar.actionPostMessage(action);
        Bar.setBarData();
    },
    actionClose: function () {
        $(window).off('resize');

        Utils.postMessageToTopWindow({
            action: 'content_bar_close',
            height: BarElements.getBarHeight()
        });

        Bar.actionPostMessage('content_bar_close');
    },
    actionPostMessage: function (action) {
        Utils.myRuntimeSendMessage({
            action: 'content_bar_action',
            subaction: action,
            data: Bar.data
        });
    },
    windowResize: function () {
        Utils.postMessageToTopWindow({
            action: 'content_bar_resize',
            height: BarElements.getBarHeight()
        });
    }
};