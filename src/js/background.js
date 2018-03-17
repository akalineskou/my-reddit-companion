/* global Utils */

var Background = {
    app_name: 'my_reddit_companion',
    logged_out_interval_delay: 1000 * 60 * 1, // when logged out check every 1 minute
    logged_in_interval_delay: 1000 * 60 * 10, // when logged in check every 10 minutes
    init: function () {
        Background.resetLoggedInHash();
        Background.resetUrlSlugData();
        Background.resetRedirectUrls();

        Background.redditLoginCheck();
    },
    resetUrlSlugData: function () {
        Background.urls_data = {};
        Background.slugs_data = {};
    },
    setUrlData: function (data) {
        if (!data.is_self) {
            Background.urls_data[Utils.normalizeUrl(data.url)] = data;
            Background.slugs_data[data.slug] = data;
        }
    },
    getUrlData: function (url) {
        return Background.urls_data[Utils.normalizeUrl(url)];
    },
    getSlugData: function (slug) {
        return Background.slugs_data[slug];
    },
    setRedirectUrls: function (url_original, url_redirected) {
        Utils.myConsoleLog('info', `Detected redirect from '${url_original}' to '${url_redirected}'`);

        Background.url_original = url_original;
        Background.url_redirected = url_redirected;
    },
    resetRedirectUrls: function () {
        Background.url_original = null;
        Background.url_redirected = null;
    },
    setLoggedInHash: function (logged_in_hash) {
        Background.logged_in_hash = logged_in_hash;
    },
    getLoggedInHash: function () {
        return Background.logged_in_hash;
    },
    resetLoggedInHash: function () {
        Background.setLoggedInHash('');
    },
    isLoggedIn: function () {
        return !Utils.varIsUndefined(Background.getLoggedInHash()) && Background.getLoggedInHash() !== '';
    },
    redditLoginCheck: function () {
        Background.resetLoggedInHash();

        if (!Utils.varIsUndefined(Background.login_check_interval)) {
            window.clearInterval(Background.login_check_interval);
        }

        Background.redditApiRequest('me.json', {}, 'GET', function (response) {
            if (response && response.data) {
                Background.setLoggedInHash(response.data.modhash);
            }

            Background.loginCheckInterval(Background.isLoggedIn());
        }, function () {
            Background.loginCheckInterval();
        });
    },
    loginCheckInterval: function (logged_in = false) {
        var delay = logged_in ? Background.logged_in_interval_delay : Background.logged_out_interval_delay;

        Background.login_check_interval = window.setInterval(Background.redditLoginCheck, delay);
    },
    redditApiCall: function (action, data) {
        if (Background.isLoggedIn()) {
            data.uh = Background.getLoggedInHash();

            Background.redditApiRequest(action, data);
        }
    },
    redditApiRequest: function (action, data, method = 'POST', callback_success, callback_error) {
        data.app = Background.app_name;

        Utils.myConsoleLog('info', `Sending API action '${action}' with data`, data);

        $.ajax({
            url: `${Utils.redditUrl()}/api/${action}`,
            type: method,
            dataType: 'json',
            data: data,
            success: function (response) {
                if (Utils.varIsFunction(callback_success)) {
                    callback_success(response);
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (Utils.varIsFunction(callback_error)) {
                    callback_error();
                }
            }
        });
    },
    parentTabIsReddit: function (tab, callback) {
        var opener_tab_id = tab.openerTabId;

        if (!Utils.varIsUndefined(opener_tab_id)) {
            Utils.myTabGet(opener_tab_id, function (parent_tab) {
                if (Utils.testRedditUrl(parent_tab.url) && Utils.varIsFunction(callback)) {
                    callback();
                }
            });
        } else {
            // when opened in new tab
            if (Utils.varIsFunction(callback)) {
                callback();
            }
        }
    }
};

var BarTab = {
    init: function () {
    },
    getBarClosed: function (slug) {
        return BarTab.bars_closed[slug];
    },
    handleBarAction: function (request_action, request_data) {
        var action;
        var data = {
            id: request_data.slug
        };

        var url_data = Background.getUrlData(request_data.url);
        var valid_data = !Utils.varIsUndefined(url_data);

        switch (request_action) {
            case 'content_bar_like':
            case 'content_bar_dislike':
                action = 'vote';
                data.dir = request_data.likes === true ? 1 : request_data.dislikes === true ? -1 : 0;

                if (valid_data) {
                    url_data.likes = request_data.likes;
                    url_data.dislikes = request_data.dislikes;

                    url_data.score += data.dir;
                }
                break;

            case 'content_bar_save':
            case 'content_bar_unsave':
                action = request_action.replace('content_bar_', '');

                if (valid_data) {
                    url_data.saved = action === 'save';
                }
                break;

            case 'content_bar_close':
                url_data.bar_closed = true;
                break;
        }

        if (valid_data) {
            Background.setUrlData(url_data);
        }

        if (action) {
            Background.redditApiCall(action, data);
        }
    }
};

Background.init();
BarTab.init();

// check for url redirects that might mess up the data matching
Utils.getBrowserOrChromeVar().webRequest.onBeforeRedirect.addListener(function (response) {
    if (Utils.testRedditUrl(response.originUrl) && response.type === 'main_frame') {
        Background.setRedirectUrls(response.url, response.redirectUrl);
    }
}, {
    urls: ["<all_urls>"]
});

// listen for contact scripts messages
Utils.getBrowserOrChromeVar().runtime.onMessage.addListener(function (request, sender, sendResponse) {
    Utils.myConsoleLog('info', 'Incoming background request', request, 'sender', sender);

    var tab = sender.tab;

    var valid_tab_url = !Utils.testRedditUrl(tab.url);
    if (request.action === 'content_reddit_clicked') {
        // for this action the tab should be reddit
        valid_tab_url = !valid_tab_url;
    }

    if (valid_tab_url) {
        var $return = false;

        switch (request.action) {
            case 'content_reddit_clicked':
                Background.setUrlData(request.data);
                break;

            case 'content_overlay_init':
                Background.parentTabIsReddit(tab, function () {
                    var tab_url = tab.url;
                    if (tab_url === Background.url_redirected) {
                        tab_url = Background.url_original;
                    }

                    Background.resetRedirectUrls();

                    var data = Background.getUrlData(tab_url);
                    if (!data) {
                        // as a last resort check if url is in title
                        data = Background.getUrlData(tab.title);
                    }

                    if (data) {
                        if (Utils.varIsUndefined(data.bar_closed) || !data.bar_closed) {
                            sendResponse({
                                slug: data.slug
                            });
                        } else {
                            Utils.myConsoleLog('info', 'Ignoring bar on this page because it was closed', data);
                        }
                    }
                });

                $return = true;
                break;

            case 'content_bar_init':
                var data = Background.getSlugData(request.slug);
                if (data) {
                    sendResponse({
                        data: data,
                        logged_in: Background.isLoggedIn()
                    });
                }
                break;

            case 'content_bar_action':
                BarTab.handleBarAction(request.subaction, request.data);
                break;

            default:
                Utils.myConsoleLog('error', `Invalid request action ${request.action}`);
                break;
        }

        if ($return) {
            // return true since sendResponse could be called asynchronously
            return true;
        }
    }
});

Utils.myConsoleLog('info', `Background running, context '${Utils.getBrowserOrChrome()}'`);