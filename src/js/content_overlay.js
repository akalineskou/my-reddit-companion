/* global Utils, Options, myjQuery */

myjQuery(document).ready(function () {
    Options.getOptions(function (options) {
        IframeBar.options = options;

        Utils.myRuntimeSendMessage({
            action: 'background_content_overlay_init'
        }, function (response) {
            if (!Utils.varIsUndefined(response)) {
                Utils.myConsoleLog('info', "'background_content_overlay_init' response", response);

                IframeBar.slug = response.slug;
                IframeBar.init();
            }
        });
    });

    // check for messages from iframe
    myjQuery(window).on('message', function (event) {
        event = event.originalEvent;
        Utils.myConsoleLog('info', 'Message received from content_bar iframe', event);

        if (event.origin === Utils.getBrowserOrChromeVar().extension.getURL('').slice(0, -1)) {
            try {
                var request = JSON.parse(event.data);

                if (!Utils.varIsUndefined(request.height) && request.height !== '') {
                    IframeBar.height = request.height;
                }
                if (!Utils.varIsUndefined(request.width) && request.width !== '') {
                    IframeBar.width = request.width;
                }

                switch (request.action) {
                    case 'content_bar_init':
                        IframeBar.bar_minimized = request.bar_minimized;
                        IframeBar.bar_maximized_direction = request.bar_maximized_direction;

                        IframeBar.setIframeClasses();
                        IframeBar.showBar();
                        break;

                    case 'content_bar_resize':
                        IframeBar.setHeight();
                        break;

                    case 'content_bar_close':
                        IframeBar.closeBar();
                        break;

                    case 'content_bar_reinit':
                        IframeBar.closeBar(true);
                        break;
                }
            } catch (e) {
            }
        }
    });

    Utils.getBrowserOrChromeVar().runtime.onMessage.addListener(function (request, sender, sendResponse) {
        Utils.myConsoleLog('info', 'Incoming content_overlay request', request, 'sender', sender);

        switch (request.action) {
            case 'background_options_changed':
                Options.getOptions(function (options) {
                    IframeBar.options = options;

                    IframeBar.closeBar(true);
                });
                break;

            case 'background_content_overlay_init':
                // set a small delay to allow the DOM content to change
                window.setTimeout(function () {
                    if (!IframeBar.barExists()) {
                        IframeBar.slug = request.slug;
                        IframeBar.init();
                    }
                }, 300);
                break;

            case 'background_content_overlay_remove':
                IframeBar.closeBar();
                break;
        }
    });
});

var IframeBar = {
    iframe_id: 'content_bar_iframe',
    stylesheet_id: 'content_bar_stylesheet',
    slide_animation: 100,
    init: function () {
        Utils.myConsoleLog('info', `Initializing content_bar iframe with slug '${IframeBar.slug}'`);

        if (!myjQuery(`#${IframeBar.stylesheet_id}`).length) {
            myjQuery('head').append(myjQuery('<link>', {
                id: IframeBar.stylesheet_id,
                href: Utils.getBrowserOrChromeVar().extension.getURL('css/content_overlay.css'),
                type: 'text/css',
                rel: 'stylesheet'
            }));
        }

        myjQuery('body').append(myjQuery('<iframe>', {
            id: IframeBar.iframe_id,
            scrolling: 'no',
            frameborder: 'no',
            src: Utils.getBrowserOrChromeVar().extension.getURL(`html/content_bar.html#${encodeURIComponent(IframeBar.slug)}`)
        }));
    },
    showBar: function () {
        myjQuery(`#${IframeBar.iframe_id}`).hide();

        myjQuery(`#${IframeBar.iframe_id}`).css('opacity', 1);
        myjQuery(`#${IframeBar.iframe_id}`).css('height', IframeBar.height);

        if (IframeBar.bar_minimized) {
            myjQuery(`#${IframeBar.iframe_id}`).css('width', IframeBar.width);
            myjQuery(`#${IframeBar.iframe_id}`).width(IframeBar.width);

            var offset_pixels = `4px`;

            if (IframeBar.options.big_buttons) {
                myjQuery(`#${IframeBar.iframe_id}`).css(IframeBar.options.bar_location_bottom ? 'bottom' : 'top', offset_pixels);
            }

            var position = IframeBar.options.maximize_location_left ? 'left' : 'right';
            if (IframeBar.bar_maximized_direction) {
                position = position === 'left' ? 'right' : 'left';
            }
            myjQuery(`#${IframeBar.iframe_id}`).css(position, offset_pixels);
        }

        myjQuery(`#${IframeBar.iframe_id}`).slideDown(IframeBar.slide_animation);
    },
    setHeight: function () {
        myjQuery(`#${IframeBar.iframe_id}`).height(IframeBar.height);
    },
    setIframeClasses: function () {
        myjQuery(`#${IframeBar.iframe_id}`).toggleClass('iframe_top', !IframeBar.options.bar_location_bottom);
        myjQuery(`#${IframeBar.iframe_id}`).toggleClass('iframe_bottom', IframeBar.options.bar_location_bottom);
        myjQuery(`#${IframeBar.iframe_id}`).toggleClass('iframe_left', !IframeBar.bar_minimized);
    },
    hideBar: function (callback) {
        myjQuery(`#${IframeBar.iframe_id}`).slideUp(IframeBar.slide_animation, function () {
            myjQuery(`#${IframeBar.iframe_id}`).css('opacity', 0);

            if (Utils.varIsFunction(callback)) {
                callback();
            }
        });
    },
    barExists: function () {
        return myjQuery(`#${IframeBar.iframe_id}`).length > 0;
    },
    closeBar: function (reinit = false) {
        if (!IframeBar.barExists()) {
            return;
        }

        IframeBar.hideBar(function () {
            myjQuery(`#${IframeBar.iframe_id}`).remove();

            if (reinit) {
                IframeBar.init();
            }
        });
    }
};