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
            "click input[name='source']": "togglePlaylistInput"
        },

        initialize: function(options) {
            this.authModel = options.authModel;

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
            var curUserUrl = this.authModel.get("userUrl");
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
            var gametmpl = _.template("<li><a href=''><%= name %></a></li>");
            $games.empty();
            this.gamesCollection.each(function(entry) {
                $games.append(gametmpl({
                    "name": entry.get("name")
                }));
            });
        },

        sendChat: function(evt) {
            evt.preventDefault();
            var $chatin = this.$el.find("#chat-input");
            this.chatCollection.sendMessage(
                this.authModel.get('userName'),
                this.authModel.get('userUrl'),
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
                    console.log('success');
                },
                error: function(model, xhr, options) {
                    $("#error").text(xhr.responseText).show().fadeOut(5000);
                }
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
