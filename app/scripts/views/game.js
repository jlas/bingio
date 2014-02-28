/*
  Copyright (C) 2014 Juan Lasheras (http://www.juanl.org).

  This file is part of Bingio. Bingio is free software under the terms of the
  GNU General Public License version 3, see <http://www.gnu.org/licenses/>.
*/

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

    /**
     * Modal display functions and private variable to track display state.
     */

    var winnerModalDisplayed = false;

    function displayWinnerModal() {
        if (winnerModalDisplayed) {
            return;
        }
        winnerModalDisplayed = true;
        // display winner modal, disable keyboard ESC
        $('#winner-modal').modal({keyboard: false});
    }

    function hideWinnerModal(callback) {
        if (!winnerModalDisplayed) {
            callback();
            return;
        }

        $('#winner-modal').modal('hide');
        $(window).on('hidden.bs.modal', function () {
            winnerModalDisplayed = false;
            callback();
        });
    }

    /**
     * Toggle Play / Pause button state.
     */

    function toggleStateButtons() {
        $('#start-game-btn').toggle();
        $('#pause-game-btn').toggle();
        $('#playing-status').toggle();
    }

    /**
     * Rdio web playback function and private variable to track init state.
     */

    var initRdio = false;
    function monitorPlayingTrack(view) {
        if (!initRdio) {
            return;
        }
        var newPlayingTrack = view.game.get('playingTrackId');
        if (view.oldPlayingTrack !== newPlayingTrack) {
            if (newPlayingTrack === null) {
                $('#playback').rdio().stop();
            } else {
                $('#playback').rdio().stop();
                $('#playback').rdio().play(newPlayingTrack);
            }
            view.oldPlayingTrack = newPlayingTrack;
        }
        // console.log('new playing track ' + view.oldPlayingTrack);
    }

    // wait for rdio library to load before using the rdio functions
    $('#playback').bind('ready.rdio', function() {
        initRdio = true;
    });


    var GameView = Backbone.View.extend({
        template: _.template(tmpl),

        events: {
            'click #quit-game-btn': 'quitGame',
            'click #game-over-btn': 'gameOver',
            'click #start-game-btn': 'toggleState',
            'click #pause-game-btn': 'toggleState',
            'click .game-square': 'guessTrack'
        },

        initialize: function() {
            this.rows = [];
            this.oldPlayingTrack = null;
            this.curUser = this.options.curUser;
            var gameId = Cookies.get('game');
            this.game = new GameModel({_id: gameId});
            this.game.on('sync', this.render, this);
            this.game.startFetching();
        },

        cleanUp: function() {
            this.game.stopFetching();
            $('#playback').rdio().stop();
        },

        render: function() {
            if (this.game === undefined ||
                this.game.get('playState') === undefined ||
                winnerModalDisplayed) {
                return this;
            }

            var user = this.game.get('users')[this.curUser.id];
            if (user === undefined) {
                return this;
            }

            // Create a 2D array for the game board
            var board = user.board;
            var tracks = this.game.get('tracks');
            var rows = this.rows;
            var k = 0;
            for (var i = 0; i < 5; i++) {
                rows[i] = [];
                for (var j = 0; j < 5; j++) {
                    rows[i][j]= tracks[board[k++]];
                }
            }

            this.$el.html(this.template(this));

            if (this.game.get('playState') === true) {
                toggleStateButtons();
            }

            if (this.game.get('winner') !== null) {
                displayWinnerModal();
            }

            // On subsequent calls rdio init function returns early,
            // so don't worry about performance. This must be called
            // before 'ready.rdio' is fired.
            $('#playback').rdio(this.game.get('playbackToken'));
            monitorPlayingTrack(this);

            return this;
        },

        quitGame: function() {
            Cookies.expire('game');
            this.game.removePlayer(this.curUser.id, function() {
                    Backbone.history.navigate('lobby', {
                        trigger : true
                    });
                });
            Util.doLoading();
        },

        gameOver: function() {
            // hides the winner modal if it's visible
            hideWinnerModal(_.bind(this.quitGame, this));
        },

        toggleState: function() {
            this.game.toggleState(function() {
                toggleStateButtons();
            });
        },

        guessTrack: function(evt) {
            evt.preventDefault();
            var trackId = $(evt.currentTarget).attr('id');
            var userId = this.curUser.id;

            var view = this;
            this.game.guessTrack(userId, trackId, function() {
                view.render();
            });
        }
    });

    return GameView;
});
