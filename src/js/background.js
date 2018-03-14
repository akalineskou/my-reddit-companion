/* global Utils */

var RedditTab = {
    logged_in_hash: '',
    isLoggedIn: function () {
        return !Utils.varIsUndefined(RedditTab.logged_in_hash) && RedditTab.logged_in_hash !== '';
    },
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

var BarTab = {
    bars_closed: {},
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
            BarTab.redditApiCall(action, data);
        }
    },
    setBarClosed: function (slug) {
        BarTab.bars_closed[slug] = true;
    },
    getBarClosed: function (slug) {
        return BarTab.bars_closed[slug];
    },
    redditApiCall: function (action, data) {
        if (RedditTab.isLoggedIn()) {
            data.uh = RedditTab.logged_in_hash;
            data.app = 'my_reddit_companion';

            console.log(`Info: Sending API action '${action}' with data`, data);

            $.ajax({
                type: 'POST',
                url: `https://www.reddit.com/api/${action}`,
                data: data,
                success: function (response) {
                }
            });
        }
    }
};

Utils.getBrowserOrChromeVar().runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('Info: Incoming background request', request, 'sender', sender);

    switch (request.action) {
        case 'reddit_content_logged_in_hash':
            RedditTab.logged_in_hash = request.logged_in_hash;
            break;

        case 'reddit_content_data':
            RedditTab.setUrlData(Utils.normalizeUrl(request.data.url), request.data);
            break;

        case 'page_overlay_init':
            var tab = sender.tab;

            var data = RedditTab.getUrlData(Utils.normalizeUrl(tab.url));
            if (!data) {
                data = RedditTab.getUrlData(Utils.normalizeUrl(tab.title));
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
            break;

        case 'bar_init':
            var data = RedditTab.getSlugData(request.slug);
            if (data) {
                sendResponse({
                    data: data,
                    logged_in: RedditTab.isLoggedIn()
                });
            }
            break;

        case 'bar_action':
            BarTab.handleBarAction(request.subaction, request.data);
            break;

        default:
            console.log(`Error: Invalid request action ${request.action}`);
            break;
    }
});

console.log(`Info: Background running, context '${Utils.getBrowserOrChrome()}'`);