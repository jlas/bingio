/*
  Copyright (C) 2014 Juan Lasheras (http://www.juanl.org).

  This file is part of Bingio. Bingio is free software under the terms of the
  GNU General Public License version 3, see <http://www.gnu.org/licenses/>.
*/

/*global define*/

define([
    'underscore',
    'backbone',
    'models/game',
    'helpers/util'
], function (_, Backbone, GameModel, Util) {
    'use strict';

    var MAX_GAMES = 500;  // Max number of creatable games
    var GAMES_TIMEOUTID = null;

    var GamesCollection = Backbone.Collection.extend({
        model: GameModel,
        url: '/games',

        isMaxGames: function() {
            return (this.length >= MAX_GAMES);
        },

        startFetching: function() {
            var gamesCollection = this;

            function fetchGames() {
                gamesCollection.fetch({
                    reset: true,
                    error: function(model, xhr) {
                        Util.doError(xhr.responseText);
                    }
                });
                GAMES_TIMEOUTID = setTimeout(fetchGames, 2000);
            }

            fetchGames();
        },

        stopFetching: function() {
            clearTimeout(GAMES_TIMEOUTID);
        }

    });

    return GamesCollection;
});
