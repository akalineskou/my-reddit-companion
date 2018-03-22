/* global Utils, Options, myjQuery */

myjQuery(document).ready(function () {
    BarElements.init();

    Utils.myRuntimeSendMessage({
        action: 'background_content_bar_init',
        slug: window.location.hash.substr(1) || ''
    }, function (response) {
        if (!Utils.varIsUndefined(response)) {
            Utils.myConsoleLog('info', "'background_content_bar_init' response", response);

            Bar.initData(response.data, response.logged_in);
            Bar.initBar(function () {
                Bar.initEvents();

                window.setTimeout(function () {
                    Utils.postMessageToTopWindow({
                        action: 'content_bar_init',
                        bar_minimized: Bar.bar_minimized,
                        height: BarElements.getBarHeight(),
                        width: BarElements.getBarWidth()
                    });
                }, 50);
            });
        }
    });
});

var Bar = {
    initData: function (data, logged_in) {
        Bar.data = data;
        Bar.logged_in = logged_in;
    },
    initEvents: function () {
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

        BarElements.$spam.click(function () {
            Bar.actionSpam();
        });
        BarElements.$remove.click(function () {
            Bar.actionRemove();
        });
        BarElements.$approve.click(function () {
            Bar.actionApprove();
        });

        BarElements.$minimize.click(function () {
            Bar.actionMinimize();
        });
        BarElements.$maximize.click(function () {
            Bar.actionMaximize();
        });

        if (!Bar.bar_minimized) {
            myjQuery(window).resize(function () {
                Utils.postMessageToTopWindow({
                    action: 'content_bar_resize',
                    height: BarElements.getBarHeight()
                });
            });
        }
    },
    initBar: function (callback) {
        Options.getOptions(function (options) {
            Bar.options = options;
            Bar.bar_minimized = !Utils.varIsUndefined(Bar.data.bar_minimized) ? Bar.data.bar_minimized : Bar.options.start_minimized;

            Bar.setBarData();

            if (Utils.varIsFunction(callback)) {
                callback();
            }
        });
    },
    setBarData: function () {
        var permalink = `${Utils.redditUrl()}${Bar.data.permalink}`;

        BarElements.toggleBodyClasses();
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

        BarElements.setSpamData();
        BarElements.setRemoveData();
        BarElements.setApproveData();

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
        Bar.actionPostMessage('content_bar_close');

        Utils.postMessageToTopWindow({
            action: 'content_bar_close'
        });
    },
    actionSpam: function () {
        Bar.data.is_spammed = !Bar.data.is_spammed;
        Bar.data.to_approve = null;

        Bar.actionPostMessage('content_bar_spam');
        Bar.setBarData();
    },
    actionRemove: function () {
        Bar.data.is_spammed = !Bar.data.is_spammed;
        Bar.data.to_approve = null;

        Bar.actionPostMessage('content_bar_remove');
        Bar.setBarData();
    },
    actionApprove: function () {
        if (Bar.data.to_approve === null) {
            Bar.data.is_spammed = !Bar.data.is_spammed;
        }
        Bar.data.to_approve = null;

        Bar.actionPostMessage('content_bar_approve');
        Bar.setBarData();
    },
    actionMinimize: function () {
        Bar.actionPostMessage('content_bar_minimize');

        Utils.postMessageToTopWindow({
            action: 'content_bar_reinit'
        });
    },
    actionMaximize: function () {
        Bar.actionPostMessage('content_bar_maximize');

        Utils.postMessageToTopWindow({
            action: 'content_bar_reinit'
        });
    },
    actionPostMessage: function (action) {
        Utils.myRuntimeSendMessage({
            action: 'background_content_bar_action',
            subaction: action,
            data: Bar.data
        });
    }
};

var BarElements = {
    init: function () {
        BarElements.$content_bar = myjQuery('#content_bar');
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

        BarElements.$spam = BarElements.$content_bar.find('.content_spam');
        BarElements.$remove = BarElements.$content_bar.find('.content_remove');
        BarElements.$approve = BarElements.$content_bar.find('.content_approve');

        BarElements.$close = BarElements.$content_bar.find('.content_close');
        BarElements.$minimize = BarElements.$content_bar.find('.content_minimize');

        BarElements.$maximize_bar = myjQuery('#maximize_bar');
        BarElements.$maximize = BarElements.$maximize_bar.find('.content_maximize');
    },
    getContentBarHeight: function () {
        return BarElements.$content_bar.height();
    },
    getMaximizeBarHeight: function () {
        return BarElements.$maximize_bar.height();
    },
    getBarHeight: function () {
        return !Bar.bar_minimized ? BarElements.getContentBarHeight() : BarElements.getMaximizeBarHeight();
    },
    getBarWidth: function () {
        return !Bar.bar_minimized ? '' : BarElements.$maximize.closest('div').width();
    },
    toggleBodyClasses: function () {
        myjQuery('body').toggleClass('light_theme', !Bar.options.dark_theme);
        myjQuery('body').toggleClass('dark_theme', Bar.options.dark_theme);
        myjQuery('body').toggleClass('transparent_background', Bar.options.transparent_background || Bar.bar_minimized);
        myjQuery('body').toggleClass('box_shadow_bottom', !Bar.options.disable_shadow && !Bar.options.bar_location_bottom);
        myjQuery('body').toggleClass('box_shadow_top', !Bar.options.disable_shadow && Bar.options.bar_location_bottom);
        myjQuery('body').toggleClass('box_shadow_initial', Bar.options.disable_shadow || Bar.bar_minimized);
    },
    showContentBar: function () {
        BarElements.$content_bar.removeClass('display_none');
        BarElements.$maximize_bar.addClass('display_none');
    },
    showMaximizeBar: function () {
        BarElements.$content_bar.addClass('display_none');
        BarElements.$maximize_bar.removeClass('display_none');
    },
    toggleBarClasses: function () {
        BarElements.$content_bar.toggleClass('container', !Bar.options.fluid_container);
        BarElements.$content_bar.toggleClass('container-fluid', Bar.options.fluid_container);
        BarElements.$content_bar.find('.row').toggleClass('big_buttons', Bar.options.big_buttons);

        if (!Bar.bar_minimized) {
            BarElements.showContentBar();
        } else {
            BarElements.showMaximizeBar();
        }
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
        BarElements.$score.toggleClass('btn-sm', !Bar.options.big_buttons);
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
        BarElements.$subreddit.toggleClass('btn-sm', !Bar.options.big_buttons);
    },
    setLoginData: function () {
        BarElements.$login.closest('div').toggleClass('display_none', Bar.logged_in);
        BarElements.$login.find('span').toggleClass('display_none', Bar.options.hide_labels);

        BarElements.$login.prop('href', `${Utils.redditUrl()}/login`);
        BarElements.$login.toggleClass('btn-sm', !Bar.options.big_buttons);
    },
    setUpvoteData: function (likes) {
        BarElements.$upvote.closest('div').toggleClass('display_none', !Bar.logged_in);
        BarElements.$upvote.find('span').toggleClass('display_none', Bar.options.hide_labels);

        BarElements.$upvote.toggleClass('active', likes || false);
        BarElements.$upvote.toggleClass('btn-sm', !Bar.options.big_buttons);
    },
    setDownvoteData: function (dislikes) {
        BarElements.$downvote.closest('div').toggleClass('display_none', !Bar.logged_in);
        BarElements.$downvote.find('span').toggleClass('display_none', Bar.options.hide_labels);

        BarElements.$downvote.toggleClass('active', dislikes || false);
        BarElements.$downvote.toggleClass('btn-sm', !Bar.options.big_buttons);
    },
    setCommentsData: function (num_comments, href) {
        BarElements.$comments.closest('div').toggleClass('display_none', Bar.options.hide_comments);

        BarElements.$comments.find('span').text(num_comments);
        BarElements.$comments.prop('href', href);
        BarElements.$comments.toggleClass('btn-sm', !Bar.options.big_buttons);
    },
    setSaveData: function (saved) {
        BarElements.$save.closest('div').toggleClass('display_none', Bar.options.hide_save || !Bar.logged_in);
        BarElements.$save.find('span').toggleClass('display_none', Bar.options.hide_labels);

        BarElements.$save.toggleClass('active', saved);
        BarElements.$save.toggleClass('btn-sm', !Bar.options.big_buttons);
    },
    setSpamData: function () {
        BarElements.$spam.closest('div').toggleClass('display_none', !Bar.logged_in || !Bar.data.is_mod || Bar.data.is_spammed || Bar.options.hide_mod_icons);
        BarElements.$spam.find('span').toggleClass('display_none', Bar.options.hide_labels);

        BarElements.$spam.toggleClass('btn-sm', !Bar.options.big_buttons);
    },
    setRemoveData: function () {
        BarElements.$remove.closest('div').toggleClass('display_none', !Bar.logged_in || !Bar.data.is_mod || Bar.data.is_spammed || Bar.options.hide_mod_icons);
        BarElements.$remove.find('span').toggleClass('display_none', Bar.options.hide_labels);

        BarElements.$remove.toggleClass('btn-sm', !Bar.options.big_buttons);
    },
    setApproveData: function () {
        BarElements.$approve.closest('div').toggleClass('display_none', !Bar.logged_in || !Bar.data.is_mod || (!Bar.data.is_spammed && Bar.data.to_approve === null) || Bar.options.hide_mod_icons);
        BarElements.$approve.find('span').toggleClass('display_none', Bar.options.hide_labels);

        BarElements.$approve.toggleClass('btn-sm', !Bar.options.big_buttons);
    },
    setCloseData: function () {
        BarElements.$close.toggleClass('btn-sm', !Bar.options.big_buttons);
    },
    setMinimizeData: function () {
        BarElements.$minimize.toggleClass('btn-sm', !Bar.options.big_buttons);

        if (Bar.options.bar_location_bottom) {
            BarElements.$minimize.html(BarElements.$minimize.data('minimize_down'));
        } else {
            BarElements.$minimize.html(BarElements.$minimize.data('minimize_up'));
        }
    },
    setMaximizeData: function () {
        BarElements.$maximize.closest('div').toggleClass('light_theme', !Bar.options.dark_theme && !Bar.options.transparent_background);
        BarElements.$maximize.closest('div').toggleClass('dark_theme', Bar.options.dark_theme && !Bar.options.transparent_background);
        BarElements.$maximize.closest('div').toggleClass('content_maximize_transparent_fix', !Bar.options.transparent_background);

        BarElements.$maximize.toggleClass('btn-sm', !Bar.options.big_buttons);
    },
    setLinksParent: function () {
        BarElements.$content_bar.find('a').each(function () {
            myjQuery(this).attr('target', '_top');
        });
    }
};