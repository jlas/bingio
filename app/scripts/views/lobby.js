/*global define*/

define([
    "jquery",
    "underscore",
    "backbone",
    "bootstrap",
    "cookies-js",
    "requirejs-text!templates/lobby.html",
    "collections/chat",
    "collections/games",
    "models/chat",
    "helpers/util"
], function ($, _, Backbone, Bootstrap, Cookies, tmpl, ChatCollection, GamesCollection, ChatModel, Util) {
    "use strict";

    // uuid generator
    function uuid() {
        function s4() {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        }
        return s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4();
    }

    var LobbyView = Backbone.View.extend({
        template: _.template(tmpl),

        events: {
            "submit #chat-form": "sendChat",
            "submit #create-game-form": "createGame",
            "click #create-game-btn": "renderModal",
            "click input[name='source']": "togglePlaylistInput",
            "click .enter-game": "clickGame"
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

        cleanUp: function() {
            this.gamesCollection.stopFetching();
            this.chatCollection.stopFetching();
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
                "<li class='row'><dt class='col-md-8'>" +
                "<button class='enter-game btn btn-link' data-game-id='<%= _id %>'>" +
                "<%= name %></a></dt><dd class='col-md-4'>" +
                "<div class='num-players'><%= numPlayers %></div></dd></li>");

            if (this.gamesCollection.isEmpty()) {
                $("#no-games-msg").show();
            } else {
                $games.html("<li class='row'><dt class='col-md-8'>Game Room</dt>" +
                    "<dd class='col-md-4'>Players</dd></li><hr>");
            }

            this.gamesCollection.each(function(entry) {
                $games.append(gametmpl({
                    "name": entry.get("name"),
                    "_id": entry.get("_id"),
                    "numPlayers": _.keys(entry.get("users")).length
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
            var gameId = uuid();
            var enterGame = _.bind(this.enterGame, this);

            var game = this.gamesCollection.create({
                "_id": gameId,
                "name": name,
                "source": source,
                "playlist": playlist
            }, {
                wait: true,
                success: function() {
                    game.fetch({
                        success: function() { enterGame(game); }
                    });
                },
                error: function(model, xhr, options) {
                    $("#error").text(xhr.responseText).show().fadeOut(5000);
                }
            });

            $("#create-game-modal").modal("hide");
            $(window).on('hidden.bs.modal', function (e) {
                Util.doLoading();
            });
        },

        enterGame: function(game) {
            game.addPlayer(this.curUser, function() {
                Cookies.set("game", game.get("_id"));
                Backbone.history.navigate("game", {
                    trigger : true
                });
            });
            Util.doLoading();
        },

        clickGame: function(evt) {
            evt.preventDefault();
            var gameId = $(evt.currentTarget).attr("data-game-id");
            var game = this.gamesCollection.get(gameId);
            this.enterGame(game);
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
