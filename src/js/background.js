/* global Utils */

var Background = {
    app_name: 'my_reddit_companion',
    logged_out_interval_delay: 1000 * 60 * 1, // when logged out check every 1 minute
    logged_in_interval_delay: 1000 * 60 * 10, // when logged in check every 10 minutes
    garbage_collection_delay: 1000 * 60 * 5, // check every 5 minutes
    garbage_collection_check: 1000 * 60 * 60, // delete when last_updated is more than 60 minutes
    init: function () {
        Background.resetLoggedInHash();
        Background.resetUrlSlugData();

        Background.redditLoginCheck();
        Background.garbageCollectionInterval();
    },
    resetUrlSlugData: function () {
        Background.urls_data = {};
        Background.urls_redirected = {};
        Background.slugs_data = {};
    },
    setUrlsData: function (data) {
        if (!data.is_self) {
            data.last_updated = Date.now();

            var url = Utils.normalizeUrl(data.url);

            Utils.myConsoleLog('info', `Set data for url '${url}' slug '${data.slug}'`, data);

            Background.urls_data[url] = data;
            Background.slugs_data[data.slug] = data;
        }
    },
    getUrlData: function (url, check_redirect = true) {
        url = Utils.normalizeUrl(url);

        var url_data = Background.urls_data[url];
        if (Utils.varIsUndefined(url_data) && check_redirect) {
            var original_url = Background.urls_redirected[url];

            if (!Utils.varIsUndefined(original_url)) {
                url_data = Background.getUrlData(original_url, false);

                if (!Utils.varIsUndefined(url_data)) {
                    Utils.myConsoleLog('info', `Found url data with orignal url '${original_url}', redirected url  '${url}'`);
                } else {
                    Utils.myConsoleLog('error', `No url data found with orignal url '${original_url}', redirected url  '${url}'`);
                }
            }
        }

        return url_data;
    },
    getSlugData: function (slug) {
        return Background.slugs_data[slug];
    },
    deleteUrlsData: function () {
        var url_data;
        for (var url in Background.urls_data) {
            url_data = Background.urls_data[url];

            if (Date.now() - url_data.last_updated > Background.garbage_collection_check) {
                Utils.myConsoleLog('info', `Deleted url_data for url '${url}' with slug '${url_data.slug}'`);

                delete Background.urls_data[Utils.normalizeUrl(url_data.url)];
                delete Background.slugs_data[url_data.slug];
            }
        }
    },
    mapUrlRedirectToOriginal: function (url_redirected, url_original) {
        var url_object = new URL(url_original);
        if (url_object.origin === Utils.redditUrl('out')) {
            // extract original url from parsed reddit out url parameter
            var url_extracted = Utils.parseUrlParameters(url_object.search).url;

            if (Utils.varIsUndefined(url_extracted) || url_extracted === '') {
                Utils.myConsoleLog('error', `Could not extract url from '${url_object.origin}'`);
            } else {
                url_original = url_extracted;
            }
        }

        if (url_redirected !== url_original) {
            Utils.myConsoleLog('info', `Mapped redirected url '${url_redirected}' to original url '${url_original}'`);

            Background.urls_redirected[Utils.normalizeUrl(url_redirected)] = Utils.normalizeUrl(url_original);
        }
    },
    deleteUrlsRedirected: function () {
        var original_url;
        for (var url_redirected in Background.urls_redirected) {
            original_url = Background.urls_redirected[url_redirected];

            // delete urls_redirected when original_url is not an index in urls_data anymore
            if (Utils.varIsUndefined(Background.urls_data[original_url])) {
                Utils.myConsoleLog('info', `Deleted original url '${original_url}' redirected url '${url_redirected}'`);

                delete Background.urls_redirected[url_redirected];
            }
        }
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
                Utils.myConsoleLog('info', `Received API response from action '${action}'`, response);

                if (Utils.varIsFunction(callback_success)) {
                    callback_success(response);
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                Utils.myConsoleLog('error', `Received API error from action '${action}'`, xhr, ajaxOptions, thrownError);

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
    },
    garbageCollectionCheck: function () {
        Utils.myConsoleLog('info', 'Garbage collection check');

        Background.deleteUrlsData();
        Background.deleteUrlsRedirected();
    },
    garbageCollectionInterval: function () {
        window.setInterval(Background.garbageCollectionCheck, Background.garbage_collection_delay);
    }
};

var BarTab = {
    init: function () {
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

            case 'content_bar_spam':
            case 'content_bar_remove':
                action = 'remove';
                if (request_action === 'content_bar_spam') {
                    data.executed = 'spammed';

                } else {
                    data.executed = 'removed';
                    data.spam = false;
                }

                if (valid_data) {
                    url_data.is_spammed = true;
                }
                break;

            case 'content_bar_approve':
                action = 'approve';

                if (valid_data) {
                    url_data.is_spammed = false;
                }
                break;

            case 'content_bar_close':
                url_data.bar_closed = true;
                break;

            case 'content_bar_minimize':
                url_data.bar_minimized = true;
                break;
            case 'content_bar_maximize':
                url_data.bar_minimized = false;
                break;
        }

        if (valid_data) {
            Background.setUrlsData(url_data);
        }

        if (action) {
            Background.redditApiCall(action, data);
        }
    }
};

// check for url redirects that might mess up the data matching
Utils.getBrowserOrChromeVar().webRequest.onBeforeRedirect.addListener(function (response) {
    Background.mapUrlRedirectToOriginal(response.redirectUrl, response.url);
}, {
    urls: ["<all_urls>"]
});

// on storage change send a message to all contact script tabs
Utils.getBrowserOrChromeVar().storage.onChanged.addListener(function () {
    Utils.myTabQuery({}, function (tabs) {
        for (var tab of tabs) {
            Utils.getBrowserOrChromeVar().tabs.sendMessage(
                    tab.id, {
                        action: 'background_options_changed'
                    }
            );
        }
    });
});

// set browser action on click listener
Utils.getBrowserOrChromeVar().browserAction.onClicked.addListener(function (tab) {
    Utils.getBrowserOrChromeVar().tabs.create({
        url: Utils.redditSubmitUrl(tab.url, tab.title),
        openerTabId: tab.id,
        index: tab.index + 1
    });
});

// listen for contact scripts messages
Utils.getBrowserOrChromeVar().runtime.onMessage.addListener(function (request, sender, sendResponse) {
    Utils.myConsoleLog('info', 'Incoming background request', request, 'from sender', sender);

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
                var data = Background.getUrlData(request.data.url);
                if (!Utils.varIsUndefined(data)) {
                    // set old values before overriding
                    request.data.bar_closed = data.bar_closed;
                    request.data.bar_minimized = data.bar_minimized;
                }

                Background.setUrlsData(request.data);
                break;

            case 'content_overlay_init':
                Background.parentTabIsReddit(tab, function () {
                    var data = Background.getUrlData(tab.url);
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

Utils.myConsoleLog('info', `Background running with context '${Utils.getBrowserOrChrome()}'`);

Background.init();
BarTab.init();