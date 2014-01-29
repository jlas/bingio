/*global define*/

define([
    'underscore',
    'backbone',
    'models/game'
], function (_, Backbone, GameModel) {
    'use strict';

    var GAMES_TIMEOUTID = null;

    var GamesCollection = Backbone.Collection.extend({
        model: GameModel,
        url: '/games',

        startFetching: function() {
            var gamesCollection = this;

            function fetchGames() {
                gamesCollection.fetch({
                    reset: true,
                    error: function() {
                        $("error").text(xhr.responseText).show().fadeOut(5000);
                    }
                });
                GAMES_TIMEOUTID = setTimeout(fetchGames, 2000);
            };

            fetchGames();
        },

        stopFetching: function() {
            clearTimeout(GAMES_TIMEOUTID);
        }

    });

    return GamesCollection;
});
