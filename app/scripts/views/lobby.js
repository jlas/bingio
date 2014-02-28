/*
  Copyright (C) 2014 Juan Lasheras (http://www.juanl.org).

  This file is part of Bingio. Bingio is free software under the terms of the
  GNU General Public License version 3, see <http://www.gnu.org/licenses/>.
*/

/*global define*/
/*jshint bitwise: false*/

define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap',
    'cookies-js',
    'requirejs-text!templates/lobby.html',
    'requirejs-text!templates/chatMsg.html',
    'collections/chat',
    'collections/games',
    'models/chat',
    'helpers/util'
], function ($, _, Backbone, Bootstrap, Cookies, tmpl, chattmpl, ChatCollection, GamesCollection, ChatModel, Util) {
    'use strict';

    var enc = encodeURIComponent;

    var CHATLOG_MAX_ENTRIES = 100;  // max # of msgs to show in chat log
    var CHATLOG_TRUNCATE_TO = 50;  // truncate # msgs to this if over limit

    // uuid generator
    function uuid() {
        function s4() {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        }
        return s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4();
    }

    var LobbyView = Backbone.View.extend({
        template: _.template(tmpl),
        chattmpl: _.template(chattmpl),

        events: {
            'submit #chat-form': 'sendChat',
            'submit #create-game-form': 'createGame',
            'click #create-game-btn': 'renderModal',
            'click input[name="source"]': 'togglePlaylistInput',
            'click .enter-game': 'clickGame',
            'click #how-to-btn': 'showHowTo'
        },

        initialize: function(options) {
            this.curUser = options.curUser;

            this.chatCollection = new ChatCollection();
            this.chatCollection.on('sync', this.renderChat, this);
            this.chatCollection.startFetching();

            this.gamesCollection = new GamesCollection();
            this.gamesCollection.on('sync', this.renderGames, this);
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

        showHowTo: function() {
            $('#how-to-modal').modal();
        },

        renderChat: function() {
            console.log("rendering chat");
            // console.log(arguments);
            if (!this.chatCollection.isQueued()) {
                return;
            }

            // Remove temporary placeholder messages from this user
            $('#chat-log > p[data-placeholder="true"]').remove();

            // Truncate the chat log if it is getting too large
            if ($("#chat-log > p").length > CHATLOG_MAX_ENTRIES) {
                $("#chat-log > p").slice(CHATLOG_TRUNCATE_TO).remove();
            }

            var chattmpl = this.chattmpl;
            var curUserUrl = this.curUser.url;
            var $chatlog = this.$el.find('#chat-log');
            this.chatCollection.each(function(entry) {
                var isCurUser = (entry.get('userUrl') === curUserUrl);
                var cssClass = 'chat-entry-other';
                if (isCurUser) {
                    cssClass = 'chat-entry-me';
                }
                $chatlog.prepend(chattmpl({
                    'userName': entry.get('userName'),
                    'userUrl': entry.get('userUrl'),
                    'msg': Util.esc(entry.get('msg')),
                    'cssClass': cssClass,
                    'placeholder': 'false'
                }));
            });
        },

        renderGames: function() {
            var $games = this.$el.find('#sidebar-games');
            var gametmpl = _.template(
                '<li class="row"><dt class="col-md-8">' +
                '<button class="enter-game btn btn-link" data-game-id="<%= _id %>">' +
                '<%= name %></a></dt><dd class="col-md-4">' +
                '<div class="num-players"><%= numPlayers %></div></dd></li>');

            if (this.gamesCollection.isEmpty()) {
                $('#no-games-msg').show();
            } else {
                $games.html('<li class="row"><dt class="col-md-8">Game Room</dt>' +
                    '<dd class="col-md-4">Players</dd></li><hr>');
            }

            this.gamesCollection.each(function(entry) {
                $games.append(gametmpl({
                    'name': Util.esc(entry.get('name')),
                    '_id': entry.get('_id'),
                    'numPlayers': _.keys(entry.get('users')).length
                }));
            });
        },

        sendChat: function(evt) {
            evt.preventDefault();
            console.log('got chat input');
            var $chatin = this.$el.find('#chat-input');
            this.chatCollection.sendMessage(
                this.curUser.name,
                this.curUser.url,
                enc($chatin.val()));

            // Add placeholder message for recent messages, for better ux.
            // On the next chat Ajax update we'll clear these and replace
            // with all the messages from the server.
            var $chatlog = this.$el.find('#chat-log');
            $chatlog.prepend(this.chattmpl({
                'userName': this.curUser.name,
                'userUrl': this.curUser.url,
                'msg': Util.esc($chatin.val()),
                'cssClass': 'chat-entry-me',
                'placeholder': 'true'
            }));

            $chatin.val('');
        },

        createGame: function(evt) {
            evt.preventDefault();
            var name = enc($('#game-name-input').val());
            var source = $('input[name="source"]:checked').val();
            var playlist = enc($('#playlist-input').val());
            var gameId = uuid();
            var enterGame = _.bind(this.enterGame, this);

            var game = this.gamesCollection.create({
                '_id': gameId,
                'name': name,
                'source': source,
                'playlist': playlist
            }, {
                wait: true,
                success: function() {
                    game.fetch({
                        success: function() { enterGame(game); }
                    });
                },
                error: function(model, xhr) {
                    Util.doError(xhr.responseText);
                }
            });

            $('#create-game-modal').modal('hide');
            $(window).on('hidden.bs.modal', function () {
                Util.doLoading();
            });
        },

        enterGame: function(game) {
            if (game.isFull()) {
                Util.doError("Game room is full.");
                return;
            }
            game.addPlayer(this.curUser, function() {
                Cookies.set('game', game.get('_id'));
                Backbone.history.navigate('game', {
                    trigger : true
                });
            });
            Util.doLoading();
        },

        clickGame: function(evt) {
            evt.preventDefault();
            var gameId = $(evt.currentTarget).attr('data-game-id');
            var game = this.gamesCollection.get(gameId);
            this.enterGame(game);
        },

        renderModal: function() {
            // Check if we can create any more games right now
            if (this.gamesCollection.isMaxGames()) {
                Util.doError("Cannot create any more game rooms.");
                return;
            }
            $('#create-game-modal').modal();
        },

        togglePlaylistInput: function() {
            var container = $('#playlist-input-container');
            if ($('#playlist-btn:checked').length !== 0) {
                container.show();
            } else {
                container.hide();
            }
        }
    });

    return LobbyView;
});
