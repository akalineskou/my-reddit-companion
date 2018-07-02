/* global chrome, browser, Debug, myjQuery */

var Utils = {
    postMessageToTopWindow: function (request) {
        window.top.postMessage(JSON.stringify(request), "*");
    },
    getBrowserOrChrome: function () {
        return typeof browser !== 'undefined' ? 'browser' : 'chrome';
    },
    getBrowserOrChromeVar: function () {
        return Utils.getBrowserOrChrome() === 'browser' ? browser : chrome;
    },
    normalizeUrl: function (url) {
        return url.replace(/^https\:\/\/?/i, '').replace(/\/$/i, '');
    },
    varIsOfType: function (variable, type) {
        return typeof variable === type;
    },
    varIsUndefined: function (variable) {
        return Utils.varIsOfType(variable, 'undefined');
    },
    varIsFunction: function (variable) {
        return Utils.varIsOfType(variable, 'function');
    },
    myRuntimeSendMessage: function (data, callback) {
        Utils.myConsoleLog('info', 'Sending background message with data', data, 'callback', callback);

        if (Utils.getBrowserOrChrome() === 'browser') {
            Utils.getBrowserOrChromeVar().runtime.sendMessage(data).then(callback, function (error) {
                Utils.myConsoleLog('error', `myRuntimeSendMessage: '${error}'`);
            });
        } else {
            Utils.getBrowserOrChromeVar().runtime.sendMessage(data, callback);
        }
    },
    myTabsSendMessage: function (tab_id, data) {
        Utils.myConsoleLog('info', `Sending tab id ${tab_id} message with data`, data);

        Utils.getBrowserOrChromeVar().tabs.sendMessage(tab_id, data);
    },
    myTabGet: function (tab_id, callback) {
        if (Utils.getBrowserOrChrome() === 'browser') {
            Utils.getBrowserOrChromeVar().tabs.get(tab_id).then(callback, function (error) {
                Utils.myConsoleLog('error', `myTabGet: '${error}'`);
            });
        } else {
            Utils.getBrowserOrChromeVar().tabs.get(tab_id, callback);
        }
    },
    myTabQuery: function (query, callback) {
        if (Utils.getBrowserOrChrome() === 'browser') {
            Utils.getBrowserOrChromeVar().tabs.query(query).then(callback, function (error) {
                Utils.myConsoleLog('error', `myTabQuery: '${error}'`);
            });
        } else {
            Utils.getBrowserOrChromeVar().tabs.query(query, callback);
        }
    },
    myStorageGet: function (options, callback) {
        if (Utils.getBrowserOrChrome() === 'browser') {
            Utils.getBrowserOrChromeVar().storage.local.get(options).then(callback, function (error) {
                Utils.myConsoleLog('error', `myStorageGet: '${error}'`);
            });
        } else {
            Utils.getBrowserOrChromeVar().storage.local.get(options, callback);
        }
    },
    testRedditUrl: function (url) {
        return /^https?:\/\/([\w-]+\.)?reddit\.com/i.test(url);
    },
    redditUrl: function (subdomain = 'www') {
        return `https://${subdomain}.reddit.com`;
    },
    redditSubmitUrl: function (url, title) {
        return `${Utils.redditUrl()}/submit?url=${url}&title=${encodeURIComponent(title)}`;
    },
    myConsoleLog: function (type, ...arguments) {
        if (Debug.console_logging || type === 'debug') {
            console.log(`%c${type.toUpperCase()}`, Debug.StyleBytype(type), ...arguments);
        }
    },
    elementIsAnchorTag: function ($element) {
        return 'A' === $element.prop('tagName');
    },
    parseUrlParameters: function (url) {
        var result = {};

        if (url.indexOf('?') === 0) {
            url = url.substr(1);
        }

        url.split("&").forEach(function (part) {
            var item = part.split("=");

            result[item[0]] = decodeURIComponent(item[1]);
        });

        return result;
    },
    myNotificationCreate: function (title, message) {
        if (!Utils.varIsUndefined(title) && !Utils.varIsUndefined(message)) {
            var notification_data = {
                type: 'basic',
                iconUrl: Utils.getBrowserOrChromeVar().extension.getURL('../images/reddit-48.png'),
                title: title,
                message: message
            };

            Utils.myConsoleLog('info', 'Creating notification with data', notification_data);

            Utils.getBrowserOrChromeVar().notifications.create('my-reddit-companion-notification', notification_data);
        } else {
            Utils.myConsoleLog('error', `'myCreateNotification' undefined variables either title '${title}' or message '${message}'`);
        }
    },
    myNotificationClear: function () {
        Utils.myConsoleLog('info', 'myNotificationClear');

        Utils.getBrowserOrChromeVar().notifications.clear('my-reddit-companion-notification');
    },
    uniqueArray: function (array) {
        return [...new Set(array)];
    },
    checkPositionIsLeft: function (maximize_location_left, bar_maximized_direction) {
        return !bar_maximized_direction ? maximize_location_left : !maximize_location_left;
    },
    minutesToMs: function (minutes) {
        return 1000 * 60 * minutes;
    },
    app_name: 'my_reddit_companion',
    redditRequest: function (path, action, data, method = 'POST', callback_success, callback_error) {
        data.app = Utils.app_name;

        Utils.myConsoleLog('info', `Sending '${path}' action '${action}' with data`, data);

        myjQuery.ajax({
            url: `${Utils.redditUrl()}/${path}/${action}`,
            type: method,
            dataType: 'json',
            data: data,
            success: function (response) {
                Utils.myConsoleLog('info', `Received '${path}' response from action '${action}'`, response);

                if (Utils.varIsFunction(callback_success)) {
                    callback_success(response);
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                Utils.myConsoleLog('error', `Received '${path}' error from action '${action}'`, xhr, ajaxOptions, thrownError);

                if (Utils.varIsFunction(callback_error)) {
                    callback_error();
                }
            }
        });
    },
    redditApiRequest: function (action, data, method = 'POST', callback_success, callback_error) {
        Utils.redditRequest('api', action, data, method, callback_success, callback_error);
    },
    redditMessageRequest: function (action, data, method = 'POST', callback_success, callback_error) {
        Utils.redditRequest('message', action, data, method, callback_success, callback_error);
    },
    getCookieValue: function (cookie_name) {
        var getCookieValues = function (cookie) {
            var cookieArray = cookie.split('=');
            return cookieArray[1].trim();
        };

        var getCookieNames = function (cookie) {
            var cookieArray = cookie.split('=');
            return cookieArray[0].trim();
        };

        var cookies = document.cookie.split(';');
        var cookieValue = cookies.map(getCookieValues)[cookies.map(getCookieNames).indexOf(cookie_name)];

        return (cookieValue === undefined) ? '' : cookieValue;
    }
};