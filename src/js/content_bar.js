/* global Utils, Options */

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
        height: BarElements.getContentBarHeight()
    });

    $(window).on('message', function (event) {
        event = event.originalEvent;
        Utils.myConsoleLog('info', 'Message received from content_overlay parent', event);

        var data = event.data;
        if (!Utils.varIsUndefined(data)) {
            switch (data.action) {
                case 'content_overlay_show_maximize':
                    $('body').addClass('minimized_bar');

                    BarElements.$content_bar.addClass('display_none');
                    BarElements.$maximize_bar.removeClass('display_none');

                    Utils.postMessageToTopWindow({
                        action: 'content_bar_show_maximize'
                    });
                    break;

                case 'content_overlay_show_minimize':
                    $('body').removeClass('minimized_bar');

                    BarElements.$content_bar.removeClass('display_none');
                    BarElements.$maximize_bar.addClass('display_none');

                    $(window).resize(Bar.windowResize);

                    Utils.postMessageToTopWindow({
                        action: 'content_bar_show_minimize'
                    });
                    break;
            }
        }
    });
});

var Bar = {
    init: function (data, logged_in) {
        Options.getOptions(function (options) {
            Bar.data = data;
            Bar.options = options;
            Bar.logged_in = logged_in;

            Bar.options.small_buttons = true;

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
            BarElements.$minimize.click(function () {
                Bar.actionMinimize();
            });
            BarElements.$maximize.click(function () {
                Bar.actionMaximize();
            });

            Bar.setBarData();
        });
    },
    setBarData: function () {
        var permalink = `${Utils.redditUrl()}${Bar.data.permalink}`;

        $('body').toggleClass('transparent_bar', Bar.options.transparent_background);

        BarElements.toggleBarClasses();
        BarElements.setLogoData();
        BarElements.setLogoLabelData();
        BarElements.setScoreData(Bar.data.score, Bar.data.likes, Bar.data.dislikes);
        BarElements.setTitleData(Bar.data.title, permalink);
        BarElements.setSubredditData(Bar.data.subreddit);
        BarElements.setLoginData();
        BarElements.setUpvoteData(Bar.data.likes);
        BarElements.setDownvoteData(Bar.data.dislikes);
        BarElements.setCommentsData(Bar.data.num_comments, permalink);
        BarElements.setSaveData(Bar.data.saved);
        BarElements.setCloseData();
        BarElements.setMinimizeData();
        BarElements.setMaximizeData();

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
            height: BarElements.getContentBarHeight()
        });

        Bar.actionPostMessage('content_bar_close');
    },
    actionMinimize: function () {
        $(window).off('resize');

        Utils.postMessageToTopWindow({
            action: 'content_bar_minimize'
        });

        Bar.actionPostMessage('content_bar_minimize');
    },
    actionMaximize: function () {
        Utils.postMessageToTopWindow({
            action: 'content_bar_maximize'
        });
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
            height: BarElements.getContentBarHeight()
        });
    }
};

var BarElements = {
    init: function () {
        BarElements.$content_bar = $('#content_bar');
        BarElements.$logo = BarElements.$content_bar.find('.content_logo');
        BarElements.$logo_label = BarElements.$content_bar.find('.content_logo_label');
        BarElements.$score = BarElements.$content_bar.find('.content_score');
        BarElements.$title = BarElements.$content_bar.find('.content_title');
        BarElements.$subreddit = BarElements.$content_bar.find('.content_subreddit');
        BarElements.$upvote = BarElements.$content_bar.find('.content_upvote');
        BarElements.$downvote = BarElements.$content_bar.find('.content_downvote');
        BarElements.$comments = BarElements.$content_bar.find('.content_comments');
        BarElements.$save = BarElements.$content_bar.find('.content_save');
        BarElements.$login = BarElements.$content_bar.find('.content_login');
        BarElements.$close = BarElements.$content_bar.find('.content_close');
        BarElements.$minimize = BarElements.$content_bar.find('.content_minimize');

        BarElements.$maximize_bar = $('#maximize_bar');
        BarElements.$maximize = BarElements.$maximize_bar.find('.content_maximize');
    },
    getContentBarHeight: function () {
        return BarElements.$content_bar.height();
    },
    getMaximizeBarHeight: function () {
        return BarElements.$maximize_bar.height();
    },
    toggleBarClasses: function () {
        BarElements.$content_bar.toggleClass('container', !Bar.options.fluid_container);
        BarElements.$content_bar.toggleClass('container-fluid', Bar.options.fluid_container);
    },
    setLogoData: function () {
        BarElements.$logo.prop('title', 'Return to reddit');
        BarElements.$logo.prop('href', Utils.redditUrl());

        BarElements.$logo.find('img').prop('alt', 'Reddit logo');
    },
    setLogoLabelData: function () {
        BarElements.$logo_label.closest('div').toggleClass('display_none', Bar.options.hide_reddit);

        BarElements.$logo_label.text('reddit');
        BarElements.$logo_label.prop('title', 'Return to reddit');
        BarElements.$logo_label.prop('href', Utils.redditUrl());
    },
    setScoreData: function (score, likes, dislikes) {
        BarElements.$score.closest('div').toggleClass('display_none', Bar.options.hide_score);

        BarElements.$score.text(score);
        BarElements.$score.toggleClass('btn-outline-secondary', !likes && !dislikes);
        BarElements.$score.toggleClass('btn-outline-warning', likes || false);
        BarElements.$score.toggleClass('btn-outline-primary', dislikes || false);
        BarElements.$score.toggleClass('btn-sm', Bar.options.small_buttons);
    },
    setTitleData: function (title, href) {
        BarElements.$title.text(title);
        BarElements.$title.prop('title', title);
        BarElements.$title.prop('href', href);
    },
    setSubredditData: function (subreddit) {
        BarElements.$subreddit.closest('div').toggleClass('display_none', Bar.options.hide_subreddit);

        BarElements.$subreddit.text(subreddit);
        BarElements.$subreddit.prop('href', `${Utils.redditUrl()}/${subreddit}`);
        BarElements.$subreddit.toggleClass('btn-sm', Bar.options.small_buttons);
    },
    setLoginData: function () {
        BarElements.$login.closest('div').toggleClass('display_none', Bar.logged_in);
        BarElements.$login.find('span').toggleClass('display_none', Bar.options.hide_labels);

        BarElements.$login.prop('href', `${Utils.redditUrl()}/login`);
        BarElements.$login.toggleClass('btn-sm', Bar.options.small_buttons);
    },
    setUpvoteData: function (likes) {
        BarElements.$upvote.closest('div').toggleClass('display_none', !Bar.logged_in);
        BarElements.$upvote.find('span').toggleClass('display_none', Bar.options.hide_labels);

        BarElements.$upvote.toggleClass('active', likes || false);
        BarElements.$upvote.toggleClass('btn-sm', Bar.options.small_buttons);
    },
    setDownvoteData: function (dislikes) {
        BarElements.$downvote.closest('div').toggleClass('display_none', !Bar.logged_in);
        BarElements.$downvote.find('span').toggleClass('display_none', Bar.options.hide_labels);

        BarElements.$downvote.toggleClass('active', dislikes || false);
        BarElements.$downvote.toggleClass('btn-sm', Bar.options.small_buttons);
    },
    setCommentsData: function (num_comments, href) {
        BarElements.$comments.closest('div').toggleClass('display_none', Bar.options.hide_comments);

        BarElements.$comments.find('span').text(num_comments);
        BarElements.$comments.prop('href', href);
        BarElements.$comments.toggleClass('btn-sm', Bar.options.small_buttons);
    },
    setSaveData: function (saved) {
        BarElements.$save.closest('div').toggleClass('display_none', Bar.options.hide_save || !Bar.logged_in);
        BarElements.$save.find('span').toggleClass('display_none', Bar.options.hide_labels);

        BarElements.$save.toggleClass('active', saved);
        BarElements.$save.toggleClass('btn-sm', Bar.options.small_buttons);
    },
    setCloseData: function () {
        BarElements.$close.toggleClass('btn-sm', Bar.options.small_buttons);
    },
    setMinimizeData: function () {
        BarElements.$minimize.toggleClass('btn-sm', Bar.options.small_buttons);
    },
    setMaximizeData: function () {
        BarElements.$maximize.toggleClass('btn-sm', Bar.options.small_buttons);
        BarElements.$maximize.toggleClass('content_maximize_transparent_fix', !Bar.options.transparent_background);
    },
    setLinksParent: function () {
        BarElements.$content_bar.find('a').each(function () {
            $(this).attr('target', '_top');
        });
    }
};