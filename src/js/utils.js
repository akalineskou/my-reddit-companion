/* global chrome, browser */

var Utils = {
    getTabFromPort: function (port) {
        return port.sender.tab;
    },
    getTabIdFromPort: function (port) {
        return Utils.getTabFromPort(port).id;
    },
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
        return url.replace(/^https?/i, '');
    }
};