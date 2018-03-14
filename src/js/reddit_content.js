/* global Utils */

var Reddit = {
    init: function () {
        $(document).ready(function () {
            Reddit.initEventListeners();
        });

        Reddit.requestLoginCheck();
    },
    initEventListeners: function () {
        $(document).on('mousedown', 'a.title', Reddit.redditTitleClicked);

        console.log('Info: Reddit content running');
    },
    redditTitleClicked: function (event) {
        var $target_element = $(event.target);

        // check element is a link and has title class
        if ('A' !== $target_element.prop("tagName") || !$target_element.hasClass('title')) {
            console.log('Error: Target element is not a link or does not have class title', $target_element);

            return;
        }

        // fing parent with class thing
        var $thing = $target_element.closest('.thing');
        if (!$thing.length) {
            console.log('Error: Unable to locate title parent thing element of target element', $target_element);

            return;
        }

        // get data from thing element
        var data = Reddit.getThingData($thing);
        if (data) {
            console.log('Info: Sending message backgroundThingData with data', data);

            Utils.getBrowserOrChromeVar().runtime.sendMessage({
                action: 'backgroundThingData',
                data: data
            });
        }
    },
    getThingData: function ($thing) {
        var $entry = $thing.find('.entry');

        var data = {};
        data.slug = $thing.data('fullname');
        data.title = $entry.find('a.title').text();
        data.likes = $entry.hasClass('likes') || null;
        data.dislikes = $entry.hasClass('dislikes') || null;
        data.saved = $thing.hasClass('saved');
        data.score = Number($thing.data('score'));
        data.subreddit = $thing.data('subreddit-prefixed');
        data.num_comments = $thing.data('comments-count');
        data.permalink = $thing.data('permalink');
        data.url = $thing.data('url');
        data.domain = $thing.data('domain');
        data.type = $thing.data('type');
        data.context = $thing.data('context');
        data.gildings = Number($thing.data('gildings'));
        data.promoted = $thing.data('promoted') === 'true';
        data.nsfw = $thing.data('nsfw') === 'true';
        data.spoiler = $thing.data('spoiler') === 'true';
        data.is_self = /^self\./.test(data.domain);

        return data;
    },
    requestLoginCheck: function () {
        var data = {};
        data.app = 'reddit_bar';

        $.ajax({
            url: 'https://www.reddit.com/api/me.json',
            data: data,
            success: function (response) {
                if (response.data) {
                    console.log('Info: Setting logged in hash', response.data.modhash);

                    Utils.getBrowserOrChromeVar().storage.local.set({logged_in_hash: response.data.modhash});
                }
            }
        });
    }
};

Reddit.init();