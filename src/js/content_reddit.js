/* global Utils, myjQuery */

var Reddit = {
    unread_messages_data: {},
    user_name: '',
    setLoggedInHash: function (logged_in_hash) {
        Reddit.logged_in_hash = logged_in_hash;
    },
    getLoggedInHash: function () {
        return Reddit.logged_in_hash;
    },
    isLoggedIn: function () {
        return !Utils.varIsUndefined(Reddit.getLoggedInHash()) && Reddit.getLoggedInHash() !== '';
    },
    init: function () {
        if (Utils.testRedditUrl(window.location)) {
            Utils.redditApiRequest('me.json', {}, 'GET', function (response) {
                if (response && response.data && response.data.modhash && response.data.modhash !== '') {
                    Reddit.setLoggedInHash(response.data.modhash);
                    Reddit.user_name = response.data.name;

                    Utils.myConsoleLog('info', `User is logged in, modhash: '${response.data.modhash}'`);

                    var session_tracker_split = Utils.getCookieValue('session_tracker').split('.');
                    if (session_tracker_split.length > 0) {
                        var data = {};
                        data.session_tracker = session_tracker_split[0];

                        Reddit.sendDataToBackground('background_content_message_init', data);
                    }
                } else {
                    Utils.myConsoleLog('info', 'User is not logged in');
                }
            });

            myjQuery(document)
                    .on('mousedown', 'a', function () {
                        Reddit.redditLinkClicked(myjQuery(this));
                    })
                    .on('keydown', Reddit.redditLinkKeyed);

            Utils.getBrowserOrChromeVar().runtime.onMessage.addListener(function (request, sender, sendResponse) {
                Utils.myConsoleLog('info', 'Incoming content_reddit request', request, 'sender', sender);

                var data = request.data || {};
                data.uh = Reddit.getLoggedInHash();

                switch (request.action) {
                    case 'background_action_received':
                        Utils.redditApiRequest(request.subaction, data);
                        break;

                    case 'background_messages_check':
                        Utils.redditMessageRequest('unread.json', {}, 'GET', function (response) {
                            if (response && response.data && response.data.children) {
                                for (var child_index in response.data.children) {
                                    Reddit.setUnreadMessagesData(response.data.children[child_index].data);
                                }

                                Reddit.unreadMessagesShowNotification();
                            }
                        });
                        break;
                }
            });
        }
    },
    redditLinkClicked: function ($this) {
        var $target_element = myjQuery($this);

        // check element is a link
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

        Reddit.sendThingDataToBackground($thing);
    },
    redditLinkKeyed: function () {
        var $this = myjQuery(this);
        var $target_element = myjQuery($this);

        if (Utils.elementIsAnchorTag($target_element)) {
            // element is an anchor tag
            Reddit.redditLinkClicked($this);
        } else {
            // it was res shortcut
            var $thing = $target_element.find('.thing.res-selected');
            if (!$thing.length) {
                Utils.myConsoleLog('info', 'Unable to locate res-selected child thing element from target element', $target_element);

                return;
            }

            Reddit.sendThingDataToBackground($thing);
        }
    },
    sendThingDataToBackground: function ($thing) {
        // get data from thing element
        var data = Reddit.getThingData($thing);
        if (data && !Utils.varIsUndefined(data.url)) {
            Utils.myConsoleLog('info', 'Got data from thing', data);

            Reddit.sendDataToBackground('background_content_reddit_clicked', data);
        }
    },
    sendDataToBackground: function (action, data) {
        Utils.myConsoleLog('info', `Sending message to background, action '${action}', data`, data);

        Utils.myRuntimeSendMessage({
            action: action,
            data: data
        });
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
        data.promoted = String($thing.data('promoted')) === 'true';
        data.nsfw = String($thing.data('nsfw')) === 'true';
        data.spoiler = String($thing.data('spoiler')) === 'true';
        data.is_mod = String($thing.data('can-ban')) === 'true';
        data.is_spammed = $thing.hasClass('spam');
        data.to_approve = $thing.find('.approve-button').length > 0 || null;
        data.is_locked = $thing.hasClass('locked');
        data.is_self = /^self\./.test(data.domain);
        data.is_logged_in = Reddit.isLoggedIn();

        return data;
    },
    unreadMessagesShowNotification: function () {
        var unread_messages_data = Reddit.getUnreadMessagesData();
        var messages_count = unread_messages_data.length;

        if (messages_count > 0) {
            var notification_title;
            var notification_message = [];

            if (messages_count === 1) {
                notification_title = `New Reddit message for ${Reddit.user_name}`;

                notification_message.push(`Author: ${unread_messages_data[0].from}`);
                notification_message.push(`Subject: ${unread_messages_data[0].subject}`);
                notification_message.push(`Message: ${unread_messages_data[0].message}`);
            } else {
                var froms = [];
                var subjects = [];

                var unread_message_data;
                for (var message_id in Reddit.unread_messages_data) {
                    unread_message_data = Reddit.unread_messages_data[message_id];

                    froms.push(unread_message_data.from);
                    subjects.push(unread_message_data.subject);
                }

                notification_title = `New Reddit messages (${messages_count})`;

                notification_message.push(`Authors: ${Utils.uniqueArray(froms).join(', ')}`);
                notification_message.push(`Subjects: ${subjects.join(', ')}`);
            }

            var data = {};
            data.title = notification_title;
            data.message = notification_message.join('\n');

            Reddit.sendDataToBackground('background_content_message_notify', data);
        }
    },
    setUnreadMessagesData: function (child_data) {
        var message_id = child_data.id;

        if (Utils.varIsUndefined(Reddit.unread_messages_data[message_id])) {
            Reddit.unread_messages_data[message_id] = {
                from: child_data.author,
                subject: child_data.subject,
                message: child_data.body,
                is_comment: child_data.was_comment,
                notified: false,
                last_updated: Date.now()
            };
        } else {
            Reddit.unread_messages_data[message_id].last_updated = Date.now();
        }
    },
    getUnreadMessagesData: function () {
        var unread_messages_data = [];

        var unread_message_data;
        for (var message_id in Reddit.unread_messages_data) {
            unread_message_data = Reddit.unread_messages_data[message_id];

            if (!unread_message_data.notified) {
                unread_message_data.notified = true;

                unread_messages_data.push(unread_message_data);
            }
        }

        return unread_messages_data;
    },
    deleteUnreadMessagesData: function () {
        var unread_message_data;
        for (var message_id in Reddit.unread_messages_data) {
            unread_message_data = Reddit.unread_messages_data[message_id];

            if (Date.now() - unread_message_data.last_updated > Reddit.garbage_collection_check) {
                Utils.myConsoleLog('info', `Deleted unread_messages_data for message_id '${message_id}'`);

                delete Reddit.unread_messages_data[message_id];
            }
        }
    }
};

myjQuery(document).ready(function () {
    Reddit.init();
});