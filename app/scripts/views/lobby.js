/*global define*/

define([
    "jquery",
    "underscore",
    "backbone",
    "requirejs-text!templates/lobby.html",
    "collections/chat",
    "collections/games",
    "models/chat"
], function ($, _, Backbone, tmpl, ChatCollection, GamesCollection, ChatModel) {
    "use strict";

    var LobbyView = Backbone.View.extend({
        template: _.template(tmpl),

        events: {
            "submit #chat-form" : "sendChat"
        },

        initialize: function() {
            this.chatCollection = new ChatCollection();
            this.chatCollection.on("sync", this.renderChat, this);
            this.chatCollection.startFetching();

            this.gamesCollection = new GamesCollection();
            this.gamesCollection.on("sync", this.renderGames, this);
            this.gamesCollection.startFetching();
        },

        render: function() {
            this.$el.html(this.template(this));
            return this;
        },

        renderChat: function() {
            var $chatlog = this.$el.find("#chat-log");
            var chattmpl = _.template("<p><%= user %>: <%= msg %></p>");
            this.chatCollection.each(function(entry) {
                $chatlog.prepend(chattmpl({
                    "user": entry.get("user"),
                    "msg": entry.get("msg")
                }));
            });
        },

        sendChat: function() {
            var $chatin = this.$el.find("#chat-input");
            this.chatCollection.sendMessage(
                'jlas', $chatin.val(), function() {$chatin.val("");});
        }
    });

    return LobbyView;
});
