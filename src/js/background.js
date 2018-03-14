/* global browser, Utils */

var Background = {
    getLoggedInHash: function (callback) {
        var gettingItem = browser.storage.local.get('logged_in_hash');

        gettingItem.then(function (storage_item) {
            if (typeof callback === 'function') {
                callback(storage_item.logged_in_hash);
            }
        });
    },
    isLoggedIn: function (logged_in_hash) {
        console.log('Info: Logged in hash', logged_in_hash);

        return typeof logged_in_hash !== 'undefined' && logged_in_hash !== '';
    }
};

var RedditTab = {
    urls_data: {},
    slugs_data: {},
    setUrlData: function (url, data) {
        if (!data.is_self) {
            RedditTab.urls_data[url] = data;
            RedditTab.slugs_data[data.slug] = data;
        }
    },
    getUrlData: function (url) {
        return RedditTab.urls_data[url];
    },
    getSlugData: function (slug) {
        return RedditTab.slugs_data[slug];
    }
};

var OverlayTab = {
    tabs_data: {},
    setOverlayTab: function (tab_id, port) {
        if (typeof OverlayTab.tabs_data[tab_id] === 'undefined') {
            console.log('Info: Overlay tab_id ' + tab_id + ' added with port', port);

            OverlayTab.tabs_data[tab_id] = port;
            port.onDisconnect.addListener(function () {
                OverlayTab.removeOverlayTab(tab_id);
            });
        }
    },
    getOverlayTab: function (tab_id) {
        return OverlayTab.tabs_data[tab_id];
    },
    removeOverlayTab: function (tab_id) {
        console.log('Info: Overlay tab removed', tab_id);

        delete OverlayTab.tabs_data[tab_id];
    }
};

var BarTab = {
    bars_closed: {},
    addBarPort: function (port) {
        port.onMessage.addListener(function (request) {
            console.log('Info: Incoming bar message request', request);

            BarTab.handleBarAction(request.action, request.data);
        });
    },
    handleBarAction: function (request_action, request_data) {
        var action;
        var data = {
            id: request_data.slug
        };

        switch (request_action) {
            case 'bar_like':
            case 'bar_dislike':
                action = 'vote';
                data.dir = request_data.likes === true ? 1 : request_data.dislikes === true ? -1 : 0;
                break;

            case 'bar_save':
            case 'bar_unsave':
                action = request_action.replace('bar_', '');
                break;

            case 'bar_close':
                BarTab.setBarClosed(request_data.slug);
                break;
        }

        if (action) {
            BarTab.reditApiCall(action, data);
        }
    },
    setBarClosed: function (slug) {
        BarTab.bars_closed[slug] = true;
    },
    getBarClosed: function (slug) {
        return BarTab.bars_closed[slug];
    },
    reditApiCall: function (action, data) {
        Background.getLoggedInHash(function (logged_in_hash) {
            if (Background.isLoggedIn(logged_in_hash)) {
                data.uh = logged_in_hash;
                data.app = 'reddit_bar';

                console.log('Info: Sending API action ' + action + ' with data', data);

                $.ajax({
                    type: 'POST',
                    url: 'https://www.reddit.com/api/' + action,
                    data: data,
                    success: function (response) {
                        console.log('response', response);
                    }
                });
            }
        });
    }
};

browser.runtime.onMessage.addListener(function (request) {
    console.log('Info: Incoming background message request', request);

    if (request.action === 'backgroundThingData') {
        RedditTab.setUrlData(request.data.url, request.data);
    }
});

browser.runtime.onConnect.addListener(function (port) {
    console.log('Info: Incoming background connect port', port);

    var tab;
    var tab_id = Utils.getTabIdFromPort(port);
    console.log('Info: tab_id', tab_id);

    if (port.name === 'page_overlay') {
        // set a small timeout for the tab url to change from about:blank
        window.setTimeout(function () {
            // query all tabs until you find the one with the same id as the sender
            browser.tabs.query({currentWindow: true}).then(function (tabs) {
                for (var tab_index in tabs) {
                    if (tab_id === tabs[tab_index].id) {
                        tab = tabs[tab_index];
                    }
                }

                if (typeof tab !== 'undefined') {
                    var data = RedditTab.getUrlData(tab.url);
                    if (data) {
                        OverlayTab.setOverlayTab(tab_id, port);

                        if (!BarTab.getBarClosed(data.slug)) {
                            var tab_data = OverlayTab.getOverlayTab(tab.id);
                            if (tab_data) {
                                console.log('Info: Sending action overlayRedditBar with data', data);

                                tab_data.postMessage({
                                    action: 'overlayRedditBar',
                                    data: data
                                });
                            }
                        } else {
                            console.log('Info: Ignoring bar on this page because it was closed', data);
                        }
                    }
                }
            });
        }, 10);
    } else {
        OverlayTab.setOverlayTab(tab_id, port);
        tab = Utils.getTabFromPort(port);

        if (typeof tab !== 'undefined') {
            var data = RedditTab.getSlugData(port.name);
            if (data) {
                Background.getLoggedInHash(function (logged_in_hash) {
                    console.log('Info: Sending action overlayRedditBarData with data', data);

                    port.postMessage({
                        action: 'overlayRedditBarData',
                        data: data,
                        logged_in: Background.isLoggedIn(logged_in_hash)
                    });
                });
            }
        }

        BarTab.addBarPort(port);
    }
});

console.log('Info: Background running');