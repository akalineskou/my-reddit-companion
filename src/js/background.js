/* global Utils */

var Background = {
    app_name: 'my_reddit_companion',
    init: function () {
        Background.resetLoggedInHash();
        Background.resetUrlSlugData();
        Background.resetRedirectUrls();

        Background.redditLoginCheck();
        Background.loginCheckInterval();
    },
    resetUrlSlugData: function () {
        Background.urls_data = {};
        Background.slugs_data = {};
    },
    setUrlData: function (url, data) {
        if (!data.is_self) {
            Background.urls_data[url] = data;
            Background.slugs_data[data.slug] = data;
        }
    },
    getUrlData: function (url) {
        return Background.urls_data[url];
    },
    getSlugData: function (slug) {
        return Background.slugs_data[slug];
    },
    setRedirectUrls: function (url_original, url_redirected) {
        console.log(`Info: Detected redirect from '${url_original}' to '${url_redirected}'`);

        Background.url_original = url_original;
        Background.url_redirected = url_redirected;
    },
    resetRedirectUrls: function () {
        Background.url_original = null;
        Background.url_redirected = null;
    },
    resetLoggedInHash: function () {
        Background.logged_in_hash = '';
    },
    isLoggedIn: function () {
        return !Utils.varIsUndefined(Background.logged_in_hash) && Background.logged_in_hash !== '';
    },
    redditLoginCheck: function () {
        Background.resetLoggedInHash();

        Background.redditApiRequest('me.json', {}, 'GET', function (response) {
            if (response && response.data) {
                Background.logged_in_hash = response.data.modhash;
            }
        });
    },
    loginCheckInterval: function () {
        window.setInterval(Background.redditLoginCheck, 1000 * 60);
    },
    redditApiCall: function (action, data) {
        if (Background.isLoggedIn()) {
            data.uh = Background.logged_in_hash;

            Background.redditApiRequest(action, data);
        }
    },
    redditApiRequest: function (action, data, method = 'POST', callback) {
        data.app = Background.app_name;

        console.log(`Info: Sending API action '${action}' with data`, data);

        $.ajax({
            url: `https://www.reddit.com/api/${action}`,
            type: method,
            dataType: 'json',
            data: data,
            success: function (response) {
                if (Utils.varIsFunction(callback)) {
                    callback(response);
                }
            }
        });
    },
    tabIsReddit: function (tab) {
        return Utils.testRedditUrl(tab.url);
    },
    parentTabIsReddit: function (tab, callback) {
        var opener_tab_id = tab.openerTabId;

        if (!Utils.varIsUndefined(opener_tab_id)) {
            Utils.myTabGet(opener_tab_id, function (parent_tab) {
                if (Background.tabIsReddit(parent_tab) && Utils.varIsFunction(callback)) {
                    callback();
                }
            });
        }
    }
};

var BarTab = {
    init: function () {
        BarTab.resetBarClosed();
    },
    resetBarClosed: function () {
        BarTab.bars_closed = {};
    },
    setBarClosed: function (slug) {
        BarTab.bars_closed[slug] = true;
    },
    getBarClosed: function (slug) {
        return BarTab.bars_closed[slug];
    },
    handleBarAction: function (request_action, request_data) {
        var action;
        var data = {
            id: request_data.slug
        };

        switch (request_action) {
            case 'content_bar_like':
            case 'content_bar_dislike':
                action = 'vote';
                data.dir = request_data.likes === true ? 1 : request_data.dislikes === true ? -1 : 0;
                break;

            case 'content_bar_save':
            case 'content_bar_unsave':
                action = request_action.replace('content_bar_', '');
                break;

            case 'content_bar_close':
                BarTab.setBarClosed(request_data.slug);
                break;
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
    console.log('Info: Incoming background request', request, 'sender', sender);

    var tab = sender.tab;

    var valid_tab = !Background.tabIsReddit(tab);
    if (request.action === 'content_reddit_clicked') {
        // for this action the tab should be reddit
        valid_tab = !valid_tab;
    }

    if (valid_tab) {
        var $return = false;

        switch (request.action) {
            case 'content_reddit_clicked':
                Background.setUrlData(Utils.normalizeUrl(request.data.url), request.data);
                break;

            case 'content_overlay_init':
                Background.parentTabIsReddit(tab, function () {
                    var tab_url = tab.url;
                    if (tab_url === Background.url_redirected) {
                        tab_url = Background.url_original;
                    }

                    Background.resetRedirectUrls();

                    var data = Background.getUrlData(Utils.normalizeUrl(tab_url));
                    if (!data) {
                        // as a last resort check if url is in title
                        data = Background.getUrlData(Utils.normalizeUrl(tab.title));
                    }

                    if (data) {
                        if (!BarTab.getBarClosed(data.slug)) {
                            sendResponse({
                                slug: data.slug
                            });
                        } else {
                            console.log('Info: Ignoring bar on this page because it was closed', data);
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
                console.log(`Error: Invalid request action ${request.action}`);
                break;
        }

        if ($return) {
            // return true since sendResponse could be called asynchronously
            return true;
        }
    }
});

console.log(`Info: Background running, context '${Utils.getBrowserOrChrome()}'`);