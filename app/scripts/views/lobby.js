/*global define*/

define([
    "jquery",
    "underscore",
    "backbone",
    "bootstrap",
    "requirejs-text!templates/lobby.html",
    "collections/chat",
    "collections/games",
    "models/chat"
], function ($, _, Backbone, Bootstrap, tmpl, ChatCollection, GamesCollection, ChatModel) {
    "use strict";

    var LobbyView = Backbone.View.extend({
        template: _.template(tmpl),

        events: {
            "submit #chat-form": "sendChat",
            "submit #create-game-form": "createGame",
            "click #create-game-btn": "renderModal",
            "click input[name='source']": "togglePlaylistInput",
            "click .enter-game": "enterGame"
        },

        initialize: function(options) {
            this.curUser = options.curUser;

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
            var curUserUrl = this.curUser.url;
            var $chatlog = this.$el.find("#chat-log");
            var chattmpl = _.template("<p><a class='<%= cssClass %>' " +
                "href='http://www.rdio.com<%= userUrl %>'><%= userName %>:</a>" +
                " <%= msg %></p>");
            this.chatCollection.each(function(entry) {
                var isCurUser = (entry.get("userUrl") === curUserUrl);
                var cssClass = "chat-entry-other";
                if (isCurUser) {
                    cssClass = "chat-entry-me";
                }
                $chatlog.prepend(chattmpl({
                    "userName": entry.get("userName"),
                    "userUrl": entry.get("userUrl"),
                    "msg": entry.get("msg"),
                    "cssClass": cssClass
                }));
            });
        },

        renderGames: function() {
            var $games = this.$el.find("#sidebar-games");
            var gametmpl = _.template(
                "<li><button class='enter-game btn btn-link' data-game-id='<%= _id %>'>" +
                "<%= name %></a></li>");
            $games.empty();
            this.gamesCollection.each(function(entry) {
                $games.append(gametmpl({
                    "name": entry.get("name"),
                    "_id": entry.get("_id")
                }));
            });
        },

        sendChat: function(evt) {
            evt.preventDefault();
            var $chatin = this.$el.find("#chat-input");
            this.chatCollection.sendMessage(
                this.curUser.name,
                this.curUser.url,
                $chatin.val(),
                function() {$chatin.val("");});
        },

        createGame: function(evt) {
            evt.preventDefault();
            var name = $("#game-name-input").val();
            var source = $("input[name='source']:checked").val();
            var playlist = $("#playlist-input").val();
            this.gamesCollection.create({
                "name": name,
                "source": source,
                "playlist": playlist
            }, {
                wait: true,
                success: function() {
                    $("#create-game-modal").modal('hide');
                },
                error: function(model, xhr, options) {
                    $("#error").text(xhr.responseText).show().fadeOut(5000);
                }
            });
        },

        enterGame: function(evt) {
            evt.preventDefault();
            var gameId = $(evt.currentTarget).attr('data-game-id');
            var game = this.gamesCollection.get(gameId);
            game.addPlayer(this.curUser, function() {
                Backbone.history.navigate('game', {
                    trigger : true
                });
            });
        },

        renderModal: function() {
            $("#create-game-modal").modal();
        },

        togglePlaylistInput: function() {
            var container = $("#playlist-input-container");
            if ($("#playlist-btn:checked").length !== 0) {
                container.show();
            } else {
                container.hide();
            }
        }
    });

    return LobbyView;
});
