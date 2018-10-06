/* global Utils, Options, myjQuery */

var Background = {
    unread_messages_delay: Utils.minutesToMs(2), // check every 2 minutes
    garbage_collection_delay: Utils.minutesToMs(5), // check every 5 minutes
    garbage_collection_check: Utils.minutesToMs(60), // delete when last_updated is more than 60 minutes,
    session_trackers_tab_id: {},
    init: function () {
        Background.initOptions();
        Background.resetUrlsData();

        Background.garbageCollectionInterval();
    },
    resetUrlsData: function () {
        Background.urls_data = {};
        Background.urls_redirected = {};
        Background.urls_tab = {};
        Background.slugs_data = {};
        Background.reddit_tabs = {};
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
            var original_url = Background.getOriginalUrlFromRedirected(url);

            if (!Utils.varIsUndefined(original_url)) {
                url_data = Background.getUrlData(original_url, false);

                if (!Utils.varIsUndefined(url_data)) {
                    Utils.myConsoleLog('info', `Found url data with orignal url '${original_url}', redirected url  '${url}'`);
                } else {
                    Utils.myConsoleLog('error', `No url data found with orignal url '${original_url}', redirected url  '${url}'`);
                }
            }
        }

        if (!Utils.varIsUndefined(url_data)) {
            url_data.last_updated = Date.now();
        }

        return url_data;
    },
    urlDataBarClosed: function (data) {
        var bar_closed = true;

        if (!Utils.varIsUndefined(data)) {
            bar_closed = !Utils.varIsUndefined(data.bar_closed) && data.bar_closed;

            if (bar_closed) {
                Utils.myConsoleLog('info', 'Ignoring bar on this page because it was closed', data);
            }
        }

        return bar_closed;
    },
    getSlugData: function (slug) {
        return Background.slugs_data[slug];
    },
    deleteUrlsData: function () {
        var url_data;
        for (var url in Background.urls_data) {
            url_data = Background.urls_data[url];

            if (url_data.bar_closed || (Date.now() - url_data.last_updated > Background.garbage_collection_check)) {
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

        if (Utils.normalizeUrl(url_redirected) !== Utils.normalizeUrl(url_original)) {
            Utils.myConsoleLog('info', `Mapped redirected url '${url_redirected}' to original url '${url_original}'`);

            var url_original_data = {
                url: Utils.normalizeUrl(url_original),
                last_updated: Date.now()
            };
            Background.urls_redirected[Utils.normalizeUrl(url_redirected)] = url_original_data;
        }
    },
    getOriginalUrlFromRedirected: function (url) {
        var original_url;

        // init url data
        var original_url_data = {
            url: url
        };

        var i = 0;
        do {
            original_url_data = Background.urls_redirected[original_url_data.url];

            if (!Utils.varIsUndefined(original_url_data)) {
                original_url = original_url_data.url;

                original_url_data.last_updated = Date.now();
            }

            Utils.myConsoleLog('info', `Ran 'getOriginalUrlFromRedirected' original_url_data`, original_url_data);

            i++;
        } while (!Utils.varIsUndefined(original_url_data) && i < 10);

        if (i === 10) {
            Utils.myConsoleLog('error', `'getOriginalUrlFromRedirected' ran more than 10 times for url '${url}'`);
        }

        return original_url;
    },
    deleteUrlsRedirected: function () {
        var original_url_data;
        for (var url_redirected in Background.urls_redirected) {
            original_url_data = Background.urls_redirected[url_redirected];

            if (Date.now() - original_url_data.last_updated > Background.garbage_collection_check) {
                Utils.myConsoleLog('info', `Deleted original url '${original_url_data.url}' redirected url '${url_redirected}'`);

                delete Background.urls_redirected[url_redirected];
            }
        }
    },
    setUrlTab: function (tab_id, url) {
        if (tab_id > 0) {
            var tab_url_data;

            if (Utils.varIsUndefined(Background.urls_tab[tab_id])) {
                tab_url_data = {
                    url: url,
                    last_updated: Date.now()
                };

                Background.urls_tab[tab_id] = tab_url_data;
            } else {
                tab_url_data = Background.urls_tab[tab_id];
                tab_url_data.last_updated = Date.now();
            }
        }
    },
    getUrlTab: function (tab_id) {
        var url;

        var tab_url_data = Background.urls_tab[tab_id];
        if (!Utils.varIsUndefined(tab_url_data)) {
            url = tab_url_data.url;

            tab_url_data.last_updated = Date.now();
        }

        return url;
    },
    deleteUrlsTab: function () {
        var tab_url_data;
        for (var tab_id in Background.urls_tab) {
            tab_url_data = Background.urls_tab[tab_id];

            if (Date.now() - tab_url_data.last_updated > Background.garbage_collection_check) {
                Utils.myConsoleLog('info', `Deleted tab url '${tab_url_data.url}' tab id '${tab_id}'`);

                delete Background.urls_tab[tab_id];
            }
        }
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
            // when opened in same reddit tab
            if (Utils.varIsFunction(callback) && Background.reddit_tabs[tab.id]) {
                callback();
            }
        }
    },
    garbageCollectionCheck: function () {
        Utils.myConsoleLog('info', 'Garbage collection check');

        Background.deleteUrlsData();
        Background.deleteUrlsRedirected();
        Background.deleteUrlsTab();
        Background.deleteUnreadMessagesData();
    },
    garbageCollectionInterval: function () {
        window.setInterval(Background.garbageCollectionCheck, Background.garbage_collection_delay);
    },
    initOptions: function (callback) {
        Options.getOptions(function (options) {
            Background.options = options;

            Background.initMessageNotifications();

            if (Utils.varIsFunction(callback)) {
                callback();
            }
        });
    },
    initMessageNotifications: function (force_clear = false) {
        if (Background.options.disable_unread_messages || force_clear) {
            window.clearInterval(Background.unread_messages_interval);

            delete Background.unread_messages_interval;
        }

        Background.unreadMessagesCheckInterval();
    },
    unreadMessagesCheckInterval: function () {
        if (!Background.options.disable_unread_messages && Utils.varIsUndefined(Background.unread_messages_interval)) {
            Background.unreadMessagesCheck();

            Background.unread_messages_interval = window.setInterval(Background.unreadMessagesCheck, Background.unread_messages_delay);
        }
    },
    unreadMessagesCheck: function () {
        for (var logged_in_hash of Object.keys(Background.session_trackers_tab_id)) {
            Utils.myTabsSendMessage(Background.session_trackers_tab_id[logged_in_hash], {
                action: 'background_messages_check'
            });
        }
    }
};

var BarTab = {
    init: function () {
    },
    handleBarAction: function (request_action, request_data) {
        var action;
        var data = {};
        data.id = request_data.slug;
        data.tab_id = request_data.tab_id;

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

            case 'content_bar_maximized_direction':
                url_data.bar_maximized_direction = !url_data.bar_maximized_direction;
                break;

            case 'content_bar_last_updated':
                // do nothing extra
                break;
        }

        if (valid_data) {
            Background.setUrlsData(url_data);
        }

        if (action && data.tab_id > 0) {
            Utils.myTabsSendMessage(
                    data.tab_id, {
                        action: 'background_action_received',
                        subaction: action,
                        data: data
                    }
            );
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
    Background.initOptions();

    Utils.myTabQuery({}, function (tabs) {
        for (var tab of tabs) {
            Utils.myTabsSendMessage(
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

// check for tabs url changes
Utils.getBrowserOrChromeVar().tabs.onUpdated.addListener(function (tab_id, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        Utils.myConsoleLog('info', `Detected tab id ${tab_id} info change`, changeInfo);

        Background.reddit_tabs[tab_id] = Utils.testRedditUrl(tab.url);

        // check for tab id data
        var tab_url = Background.getUrlTab(tab_id);
        if (!Utils.varIsUndefined(tab_url)) {
            var data = Background.getUrlData(tab_url);
            if (!Background.urlDataBarClosed(data)) {
                Utils.myTabsSendMessage(
                        tab_id, {
                            action: `background_content_overlay_${!Utils.varIsUndefined(changeInfo.url) && !Background.options.persist_bar ? 'remove' : 'init'}`,
                            slug: data.slug
                        }
                );
            }
        }
    }
});

// set notification on click listener
Utils.getBrowserOrChromeVar().notifications.onClicked.addListener(function () {
    Utils.myNotificationClear();
});

// listen for contact scripts messages
Utils.getBrowserOrChromeVar().runtime.onMessage.addListener(function (request, sender, sendResponse) {
    Utils.myConsoleLog('info', 'Incoming background request', request, 'from sender', sender);

    var tab = sender.tab;
    var tab_id = tab.id;

    var valid_tab_url = request.action === 'background_content_reddit_clicked' || request.action === 'background_content_message_init' ? Utils.testRedditUrl(tab.url) : true;
    if (valid_tab_url) {
        var $return = false;

        switch (request.action) {
            case 'background_content_reddit_clicked':
                request.data.tab_id = tab_id;

                var data = Background.getUrlData(request.data.url);
                if (!Utils.varIsUndefined(data)) {
                    // set old values before overriding
                    request.data.bar_closed = data.bar_closed;
                    request.data.bar_minimized = data.bar_minimized;
                    request.data.bar_maximized_direction = data.bar_maximized_direction;
                }

                Background.setUrlsData(request.data);
                break;

            case 'background_content_message_init':
                Background.session_trackers_tab_id[request.data.session_tracker] = tab_id;
                break;

            case 'background_content_message_notify':
                Utils.myNotificationCreate(request.data.title, request.data.message);
                break;

            case 'background_content_overlay_init':
                var backgroundContentOverlayInit = function(tab) {
                    Background.setUrlTab(tab_id, tab.url);

                    var data = Background.getUrlData(tab.url);
                    if (!Background.urlDataBarClosed(data)) {
                        sendResponse({
                            slug: data.slug
                        });
                    }
                }

                if (!Background.options.enable_tabs_not_opened_by_user_interaction) {
                    Background.parentTabIsReddit(tab, function () {
                        backgroundContentOverlayInit(tab)
                    });
                } else {
                    backgroundContentOverlayInit(tab)
                }

                $return = true;
                break;

            case 'background_content_bar_init':
                var data = Background.getSlugData(request.slug);
                if (!Utils.varIsUndefined(data) && tab.url.indexOf(data.permalink) === -1) {
                    // send response if data is valid and tab url is not reddit permalink
                    sendResponse({
                        data: data
                    });
                }
                break;

            case 'background_content_bar_action':
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