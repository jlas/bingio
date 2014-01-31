/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'cookies-js',
    'requirejs-text!templates/game.html',
    'models/game',
    'helpers/util'
], function ($, _, Backbone, Cookies, tmpl, GameModel, Util) {
    'use strict';

    function toggleStateButtons() {
        $("#start-game-btn").toggle();
        $("#pause-game-btn").toggle();
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
            var userId = this.options.curUser["id"];
            var gameId = Cookies.get("game");
            this.game = new GameModel({_id: gameId});
            // this.game.on("sync", this.render, this);

            var view = this;
            this.game.fetch().done(function () {
                var board = view.game.get("users")[userId]["board"];
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
            });
        },

        render: function() {
            this.$el.html(this.template(this));
            return this;
        },

        quitGame: function() {
            Cookies.expire("game");
            this.game.removePlayer(userId, function() {
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
