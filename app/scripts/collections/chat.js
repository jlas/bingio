/*
  Copyright (C) 2014 Juan Lasheras (http://www.juanl.org).

  This file is part of Bingio. Bingio is free software under the terms of the
  GNU General Public License version 3, see <http://www.gnu.org/licenses/>.
*/

/*global define*/

define([
    'underscore',
    'backbone',
    'models/chat',
    'helpers/util'
], function (_, Backbone, ChatModel, Util) {
    'use strict';

    var SENDQ_TIMEOUTID = null;
    var CHAT_TIMEOUTID = null;

    var ChatCollection = Backbone.Collection.extend({
        model: ChatModel,
        url: '/chat',

        initialize: function() {
            this.chatIdx = 0;

            // Keep track of fetching state. This way we avoid syncing chat
            // messages during a fetch.
            this.fetching = false;

            // Queue up chat messages in an array. We do this because we want
            // to add() the messages to the collection at the last possible
            // moment. This way messages will not be 'reset' by the fetch call
            // on latent connections.
            this.chatMsgQueue = [];
        },

        startFetching: function() {
            clearTimeout(CHAT_TIMEOUTID);

            var chatCollection = this;
            function fetchChat() {
                chatCollection.fetching = true;
                console.log("fetching...");
                chatCollection.fetch({
                    reset: true,
                    data: {'since': chatCollection.chatIdx}
                }).done(function() {
                    // The server adds an 'idx' field to chat msg entries so
                    // we can keep track what msg index is latest. Here we find
                    // the highest idx & store the next idx to retrieve from.
                    var newChatIdx = -1;
                    chatCollection.each(function(entry) {
                        if (entry.get('idx') > newChatIdx) {
                            newChatIdx = entry.get('idx');
                        }
                    });

                    if (newChatIdx > -1) {
                        chatCollection.chatIdx = newChatIdx + 1;
                    }

                }).fail(function(xhr) {
                    Util.doError(xhr.responseText);
                }).always(function() {
                    console.log('fetched');
                    chatCollection.fetching = false;
                    CHAT_TIMEOUTID = setTimeout(fetchChat, 1000);
                });
            }
            CHAT_TIMEOUTID = setTimeout(fetchChat, 100);
        },

        stopFetching: function() {
            clearTimeout(CHAT_TIMEOUTID);
        },

        // Here we queue up chat messages that arrive in quick succession e.g.
        // < 1s apart. After user backs off for long enough we send the msgs.
        sendMessage: function(userName, userUrl, msg) {
            this.stopFetching();
            clearTimeout(SENDQ_TIMEOUTID);

            var chatCollection = this;
            function sendMsgQueue() {
                // If we are currently mid-fetch, back off on syncing until
                // fetch is complete.
                if (chatCollection.fetching) {
                    SENDQ_TIMEOUTID = setTimeout(sendMsgQueue, 1000);
                    return;
                }

                // Add all our queued messages, clear the queue, and sync
                chatCollection.reset(chatCollection.chatMsgQueue);
                chatCollection.chatMsgQueue = [];
                console.log("sending...");
                chatCollection.sync("create", chatCollection).done(function() {
                    chatCollection.reset();
                }).fail(function(xhr) {
                    $('#error').text(xhr.responseText).show().fadeOut(5000);
                }).always(function() {
                    console.log('sent');
                    chatCollection.startFetching();
                });
            }

            this.chatMsgQueue.push({
                'userName': userName,
                'userUrl': userUrl,
                'msg': msg
            });

            SENDQ_TIMEOUTID = setTimeout(sendMsgQueue, 1000);
        }

    });

    return ChatCollection;
});
