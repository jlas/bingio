/*global define*/

define([
    'jquery',
    'jquery.rdio',
    'underscore',
    'backbone',
    'cookies-js',
    'requirejs-text!templates/game.html',
    'models/game',
    'helpers/util'
], function ($, jqueryRdio, _, Backbone, Cookies, tmpl, GameModel, Util) {
    'use strict';

    var PLAY_TIMEOUTID = null;

    function toggleStateButtons() {
        $("#start-game-btn").toggle();
        $("#pause-game-btn").toggle();
    }

    function playbackWatcher(game) {
        var oldPlayingTrack = game.get("playingTrack");
        var playbackToken = game.get("playbackToken");
        function monitorPlayingTrack() {
            var newPlayingTrack = game.get("playingTrack");
            if (oldPlayingTrack !== newPlayingTrack) {
                if (newPlayingTrack === null) {
                    $('#playback').rdio().stop();
                } else {
                    $('#playback').rdio().play(newPlayingTrack);
                }
                oldPlayingTrack = newPlayingTrack;
            }
            console.log('new playing track ' + oldPlayingTrack);
            PLAY_TIMEOUTID = setTimeout(monitorPlayingTrack, 1000);
        }
        $('#playback').rdio(playbackToken);
        $('#playback').bind('ready.rdio', monitorPlayingTrack);
    }

    var GameView = Backbone.View.extend({
        template: _.template(tmpl),

        events: {
            "click #quit-game-btn": "quitGame",
            "click #start-game-btn": "toggleState",
            "click #pause-game-btn": "toggleState"
        },

        initialize: function() {
            this.rows = [];
            this.curUser = this.options.curUser;
            var gameId = Cookies.get("game");
            this.game = new GameModel({_id: gameId});
            // this.game.on("sync", this.render, this);

            var view = this;
            this.game.fetch().done(function () {
                var board = view.game.get("users")[view.curUser["id"]]["board"];
                var tracks = view.game.get("tracks");
                var rows = view.rows;
                var k = 0;
                for (var i = 0; i < 5; i++) {
                    rows[i] = [];
                    for (var j = 0; j < 5; j++) {
                        rows[i][j]= tracks[board[k++]];
                    }
                }
                view.render();

                if (view.game.get("playState") === true) {
                    toggleStateButtons();
                }

                playbackWatcher(view.game);
            });
        },

        cleanUp: function() {
            clearTimeout(PLAY_TIMEOUTID);
        },

        render: function() {
            this.$el.html(this.template(this));
            return this;
        },

        quitGame: function() {
            Cookies.expire("game");
            this.game.removePlayer(this.curUser["id"], function() {
                    Backbone.history.navigate('lobby', {
                        trigger : true
                    });
            });
            Util.doLoading();
        },

        toggleState: function() {
            this.game.toggleState(function() {
                toggleStateButtons();
            });
        }
    });

    return GameView;
});
