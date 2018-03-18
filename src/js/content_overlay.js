/* global Utils */

$(window).ready(function () {
    Utils.myRuntimeSendMessage({
        action: 'content_overlay_init'
    }, function (response) {
        if (!Utils.varIsUndefined(response)) {
            Utils.myConsoleLog('info', "'content_overlay_init' response", response);

            IframeBar.init(response.slug);
        }
    });

    // check for messages from iframe
    $(window).on('message', function (event) {
        event = event.originalEvent;
        Utils.myConsoleLog('info', 'Message received from content_bar iframe', event);

        if (event.origin === Utils.getBrowserOrChromeVar().extension.getURL('').slice(0, -1)) {
            try {
                var request = JSON.parse(event.data);
                Utils.myConsoleLog('info', 'With request', request);

                if (!Utils.varIsUndefined(request.height)) {
                    IframeBar.height = request.height;
                }

                switch (request.action) {
                    case 'content_bar_init':
                        IframeBar.showBar();
                        break;

                    case 'content_bar_resize':
                        IframeBar.setHeight();
                        break;

                    case 'content_bar_close':
                        IframeBar.hideBar(function () {
                            $(`#${IframeBar.iframe_id}`).remove();
                            $(`#${IframeBar.stylesheet_id}`).remove();
                        });
                        break;

                    case 'content_bar_minimize':
                        IframeBar.hideBar(function () {
                            $(`#${IframeBar.iframe_id}`).get(0).contentWindow.postMessage({
                                action: 'content_overlay_show_maximize'
                            }, "*");
                        });
                        break;

                    case 'content_bar_show_maximize':
                        IframeBar.showBar();
                        break;

                    case 'content_bar_maximize':
                        IframeBar.hideBar(function () {
                            $(`#${IframeBar.iframe_id}`).get(0).contentWindow.postMessage({
                                action: 'content_overlay_show_minimize'
                            }, "*");
                        });
                        break;

                    case 'content_bar_show_minimize':
                        IframeBar.showBar();
                        break;
                }
            } catch (e) {
            }
        }
    });
});

var IframeBar = {
    iframe_id: 'content_bar_iframe',
    stylesheet_id: 'content_bar_stylesheet',
    slide_animation: 100,
    init: function (slug) {
        Utils.myConsoleLog('info', `Initializing content_bar iframe with slug '${slug}'`);

        $('head').append($('<link>', {
            id: IframeBar.stylesheet_id,
            href: Utils.getBrowserOrChromeVar().extension.getURL('css/content_overlay.css'),
            type: 'text/css',
            rel: 'stylesheet'
        }));

        $('body').append($('<iframe>', {
            id: IframeBar.iframe_id,
            scrolling: 'no',
            frameborder: 'no',
            src: Utils.getBrowserOrChromeVar().extension.getURL(`html/content_bar.html#${encodeURIComponent(slug)}`)
        }));
    },
    showBar: function () {
        $(`#${IframeBar.iframe_id}`).hide();

        $(`#${IframeBar.iframe_id}`).css('opacity', 1);
        $(`#${IframeBar.iframe_id}`).height(IframeBar.height);

        $(`#${IframeBar.iframe_id}`).slideDown(IframeBar.slide_animation);
    },
    setHeight: function () {
        $(`#${IframeBar.iframe_id}`).height(IframeBar.height);
    },
    hideBar: function (callback) {
        $(`#${IframeBar.iframe_id}`).slideUp(IframeBar.slide_animation, function () {
            $(`#${IframeBar.iframe_id}`).css('opacity', 0);

            if (Utils.varIsFunction(callback)) {
                callback();
            }
        });
    }
};