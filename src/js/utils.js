/* global chrome, browser, Debug */

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
        return url.replace(/^https\:\/\/?/i, '');
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
    }
};