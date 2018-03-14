/* global browser */

var IframeBar = {
    iframe_id: 'reddit_bar',
    stylesheet_id: 'reddit_bar_stylesheet',
    init: function (slug) {
        console.log('Info: Initialized bar iframe with slug', slug);

        $('head').append($('<link>', {
            id: IframeBar.stylesheet_id,
            href: browser.extension.getURL('css/page_overlay.css'),
            type: 'text/css',
            rel: 'stylesheet'
        }));

        $('body').append($('<iframe>', {
            id: IframeBar.iframe_id,
            scrolling: 'no',
            frameborder: 'no',
            src: browser.extension.getURL('html/bar.html#' + encodeURIComponent(slug))
        }));
    },
    removeBar: function () {
        $('#' + IframeBar.iframe_id).remove();
        $('#' + IframeBar.stylesheet_id).remove();
    }
};

var port = browser.runtime.connect({
    name: 'page_overlay'
});

port.onMessage.addListener(function (request) {
    console.log('Info: Incoming port message request', request);

    if (request.action === 'overlayRedditBar') {
        $(window).ready(function () {
            IframeBar.init(request.data.slug);
        });
    }
});

// Remove any open bars when the extension gets unloaded.
port.onDisconnect.addListener(function () {
    IframeBar.removeBar();
});

$(window).ready(function () {
    // check for messages from iframe
    $(window).on('message', function (event) {
        event = event.originalEvent;
        console.log('Info: Message received from bar iframe', event);

        if (event.origin === browser.extension.getURL('').slice(0, -1)) {
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

console.log('Info: Page overlay running');