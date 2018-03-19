/* global Utils */

var Options = {
    option_prefix: 'option_',
    default_options: {
        fluid_container: true,
        transparent_background: true,
        hide_labels: false,
        hide_reddit: false,
        hide_score: false,
        hide_subreddit: false,
        hide_comments: false,
        hide_save: false
    },
    init: function () {
        Options.restoreOptions();

        $('#predefined_settings').on('change', function () {
            var $this = $(this);
            var selected_value = $this.val();

            Options.getOptions(function (options) {
                switch (selected_value) {
                    case 'full':
                        options.hide_labels = false;
                        options.hide_reddit = false;
                        options.hide_score = false;
                        options.hide_subreddit = false;
                        options.hide_comments = false;
                        options.hide_save = false;
                        break;

                    case 'compact':
                        options.hide_labels = true;
                        options.hide_reddit = false;
                        options.hide_score = false;
                        options.hide_subreddit = false;
                        options.hide_comments = false;
                        options.hide_save = false;
                        break;

                    case 'useful':
                        options.hide_labels = false;
                        options.hide_reddit = true;
                        options.hide_score = true;
                        options.hide_subreddit = true;
                        options.hide_comments = false;
                        options.hide_save = false;
                        break;

                    case 'minimal':
                        options.hide_labels = true;
                        options.hide_reddit = true;
                        options.hide_score = true;
                        options.hide_subreddit = true;
                        options.hide_comments = true;
                        options.hide_save = true;
                        break;
                }

                delete options.fluid_container;
                delete options.transparent_background;

                Options.setOptions(options);

                window.setTimeout(function () {
                    // small timeout for the user to understand that the change worked (instead of instantly changing it)
                    $this.prop('selectedIndex', 0);
                }, 50);
            });
        });

        $('#options_form').on('submit', function (event) {
            event.preventDefault();

            Options.saveOptions();
        });

        $('#options_form').on('reset', function (event) {
            event.preventDefault();

            Options.restoreOptions();
        });
    },
    getOptions: function (callback) {
        var options = $.extend(Options.default_options);

        Utils.myStorageGet(Object.keys(options), function (stored_options) {
            for (var option in options) {
                if (!Utils.varIsUndefined(stored_options[option])) {
                    options[option] = stored_options[option];
                }
            }

            if (Utils.varIsFunction(callback)) {
                callback(options);
            }
        });
    },
    restoreOptions: function () {
        Options.getOptions(function (options) {
            Options.setOptions(options);
        });
    },
    setOptions: function (options) {
        for (var option in options) {
            Options.setOptionCheckedProp(option, options[option]);
        }
    },
    setOptionCheckedProp: function (key, value) {
        $(`#${Options.option_prefix}${key}`).prop('checked', value);
    },
    saveOptions: function () {
        var data = {};
        $(`[id^=${Options.option_prefix}]`).each(function () {
            data[$(this).prop('id').replace(Options.option_prefix, '')] = $(this).is(':checked');
        });

        Utils.myConsoleLog('info', 'Saving data to local storage', data);

        Utils.getBrowserOrChromeVar().storage.local.set(data);
    }
};

$(document).ready(function () {
    Options.init();
});