/* global Utils */

var IframeBar = {
    iframe_id: 'reddit_bar',
    stylesheet_id: 'reddit_bar_stylesheet',
    init: function (slug) {
        console.log(`Info: Initializing bar iframe with slug '${slug}'`);

        $('head').append($('<link>', {
            id: IframeBar.stylesheet_id,
            href: Utils.getBrowserOrChromeVar().extension.getURL('css/page_overlay.css'),
            type: 'text/css',
            rel: 'stylesheet'
        }));

        $('body').append($('<iframe>', {
            id: IframeBar.iframe_id,
            scrolling: 'no',
            frameborder: 'no',
            src: Utils.getBrowserOrChromeVar().extension.getURL('html/bar.html#' + encodeURIComponent(slug))
        }));
    },
    removeBar: function () {
        $('#' + IframeBar.iframe_id).remove();
        $('#' + IframeBar.stylesheet_id).remove();
    }
};

$(window).ready(function () {
    Utils.myRuntimeSendMessage({
        action: 'page_overlay_init'
    }, function (response) {
        if (!Utils.varIsUndefined(response)) {
            console.log("Info: 'page_overlay_init' response", response);

            IframeBar.init(response.data.slug);
        }
    });

    // check for messages from iframe
    $(window).on('message', function (event) {
        event = event.originalEvent;
        console.log('Info: Message received from bar iframe', event);

        if (event.origin === Utils.getBrowserOrChromeVar().extension.getURL('').slice(0, -1)) {
            try {
                var request = JSON.parse(event.data);
                console.log('Info: With request', request);

                if (request.action === 'bar_close') {
                    IframeBar.removeBar();
                }
            } catch (e) {
            }
        }
    });
});