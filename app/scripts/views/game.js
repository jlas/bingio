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
        var oldPlayingTrack = null;
        var playbackToken = game.get("playbackToken");
        function monitorPlayingTrack() {
            var newPlayingTrack = game.get("playingTrackId");
            if (oldPlayingTrack !== newPlayingTrack) {
                if (newPlayingTrack === null) {
                    $('#playback').rdio().stop();
                } else {
                    $('#playback').rdio().stop();
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
            "click #pause-game-btn": "toggleState",
            "click .game-square": "guessTrack"
        },

        initialize: function() {
            this.rows = [];
            this.curUser = this.options.curUser;
            var gameId = Cookies.get("game");
            this.game = new GameModel({_id: gameId});
            this.game.on("sync", this.render, view);

            var view = this;
            this.game.fetch().done(function () {
                playbackWatcher(view.game);
                view.render();
            });
        },

        cleanUp: function() {
            $('#playback').rdio().stop();
            clearTimeout(PLAY_TIMEOUTID);
        },

        render: function() {
            if (this.game === undefined || this.game.get("playState") === undefined) {
                console.log("dont render");
                return this;
            }
            console.log("render");

            var board = this.game.get("users")[this.curUser["id"]]["board"];
            var tracks = this.game.get("tracks");
            var rows = this.rows;
            var k = 0;
            for (var i = 0; i < 5; i++) {
                rows[i] = [];
                for (var j = 0; j < 5; j++) {
                    rows[i][j]= tracks[board[k++]];
                }
            }

            this.$el.html(this.template(this));

            if (this.game.get("playState") === true) {
                toggleStateButtons();
            }

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
        },

        guessTrack: function(evt) {
            evt.preventDefault();
            var trackId = $(evt.currentTarget).attr("id");
            var userId = this.curUser["id"];

            var view = this;
            this.game.guessTrack(userId, trackId, function() {
                view.render();
            });
        }
    });

    return GameView;
});
