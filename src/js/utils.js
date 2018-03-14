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
    varIsUndefined: function (variable) {
        return typeof variable === 'undefined';
    },
    myRuntimeSendMessage: function (data, callback) {
        console.log('Info: Sending background message with data', data, 'callback', callback);

        if (Utils.varIsUndefined(callback)) {
            callback = function () {};
        }

        if (Utils.getBrowserOrChrome() === 'browser') {
            Utils.getBrowserOrChromeVar().runtime.sendMessage(data).then(callback);
        } else {
            Utils.getBrowserOrChromeVar().runtime.sendMessage(data, callback);
        }
    }
};