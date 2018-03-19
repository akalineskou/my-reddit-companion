/* global Utils */

var Reddit = {
    init: function () {
        $(document).on('mousedown', 'a', Reddit.redditLinkClicked);
        $(document).on('keydown', Reddit.redditLinkKeyed);
    },
    redditLinkClicked: function (event) {
        var $target_element = $(event.target);

        // check element is a link and has title class
        if (!Utils.elementIsAnchorTag($target_element)) {
            Utils.myConsoleLog('info', 'Target element is not a link', $target_element);

            return;
        }

        // fing parent with class thing
        var $thing = $target_element.closest('.thing');
        if (!$thing.length) {
            Utils.myConsoleLog('info', 'Unable to locate closest thing element from target element', $target_element);

            return;
        }

        Reddit.sendBackgroundMessage($thing);
    },
    redditLinkKeyed: function (event) {
        var $target_element = $(event.target);

        if (Utils.elementIsAnchorTag($target_element)) {
            // element is an anchor tag
            Reddit.redditLinkClicked(event);
        } else {
            // it was res shortcut
            var $thing = $target_element.find('.thing.res-selected');
            if (!$thing.length) {
                Utils.myConsoleLog('info', 'Unable to locate res-selected child thing element from target element', $target_element);

                return;
            }

            Reddit.sendBackgroundMessage($thing);
        }
    },
    sendBackgroundMessage: function ($thing) {
        // get data from thing element
        var data = Reddit.getThingData($thing);
        if (data) {
            Utils.myRuntimeSendMessage({
                action: 'content_reddit_clicked',
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
    }
};

$(document).ready(function () {
    Reddit.init();
});