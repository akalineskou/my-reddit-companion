var Utils = {
    getTabFromPort: function (port) {
        return port.sender.tab;
    },
    getTabIdFromPort: function (port) {
        return Utils.getTabFromPort(port).id;
    },
    postMessageToTopWindow: function (request) {
        window.top.postMessage(JSON.stringify(request), "*");
    }
};