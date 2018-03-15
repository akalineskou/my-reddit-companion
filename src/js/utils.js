/* global chrome, browser */

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
        console.log('Info: Sending background message with data', data, 'callback', callback);

        if (Utils.getBrowserOrChrome() === 'browser') {
            Utils.getBrowserOrChromeVar().runtime.sendMessage(data).then(callback, function (error) {
                console.log(`Error: myRuntimeSendMessage: ${error}`);
            });
        } else {
            Utils.getBrowserOrChromeVar().runtime.sendMessage(data, callback);
        }
    },
    myTabGet: function (tab_id, callback) {
        if (Utils.getBrowserOrChrome() === 'browser') {
            Utils.getBrowserOrChromeVar().tabs.get(tab_id).then(callback, function (error) {
                console.log(`Error: myTabGet: ${error}`);
            });
        } else {
            Utils.getBrowserOrChromeVar().tabs.get(tab_id, callback);
        }
    },
    testRedditUrl: function (url) {
        return /^https?:\/\/([\w-]+\.)?reddit\.com/i.test(url);
    }
};