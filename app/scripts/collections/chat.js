/*
  Copyright (C) 2014 Juan Lasheras (http://www.juanl.org).

  This file is part of Bingio. Bingio is free software under the terms of the
  GNU General Public License version 3, see <http://www.gnu.org/licenses/>.
*/

/*global define*/

define([
    'underscore',
    'backbone',
    'models/chat'
], function (_, Backbone, ChatModel) {
    'use strict';

    var CHAT_TIMEOUTID = null;

    var ChatCollection = Backbone.Collection.extend({
        model: ChatModel,
        url: '/chat',

        initialize: function() {
            this.chatidx = 0;
        },

        startFetching: function() {
            var chatCollection = this;

            function fetchChat() {
                chatCollection.fetch({
                    reset: true,
                    data: {"since": chatCollection.chatidx},
                    success: function() {
                        chatCollection.chatidx += chatCollection.length;
                    },
                    error: function() {
                        $("error").text(xhr.responseText).show().fadeOut(5000);
                    }
                });
                CHAT_TIMEOUTID = setTimeout(fetchChat, 1000);
            };

            fetchChat();
        },

        stopFetching: function() {
            clearTimeout(CHAT_TIMEOUTID);
        },

        sendMessage: function(userName, userUrl, msg, successFunc) {
            var chatCollection = this;

            chatCollection.create({
                "userName": userName,
                "userUrl": userUrl,
                "msg": msg
            }, {
                wait: true,
                success: function() {
                    chatCollection.reset();
                    successFunc();
                    chatCollection.stopFetching();
                    chatCollection.startFetching();
                },
                error: function(model, xhr, options) {
                    $("#error").text(xhr.responseText).show().fadeOut(5000);
                }
            });
        }

    });

    return ChatCollection;
});
