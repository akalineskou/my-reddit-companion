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
    redditUrl: function () {
        return 'https://www.reddit.com';
    },
    myConsoleLog: function (type, ...arguments) {
        if (Debug.console_logging || type === 'debug') {
            console.log(type.toUpperCase(), ...arguments);
        }
    },
    elementIsAnchorTag: function ($element) {
        return 'A' === $element.prop('tagName');
    }
};