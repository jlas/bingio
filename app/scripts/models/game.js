/*
  Copyright (C) 2014 Juan Lasheras (http://www.juanl.org).

  This file is part of Bingio. Bingio is free software under the terms of the
  GNU General Public License version 3, see <http://www.gnu.org/licenses/>.
*/

/*global define*/

define([
    'underscore',
    'backbone',
    'helpers/util'
], function (_, Backbone, Util) {
    'use strict';

    var MAX_USERS = 6;  // max users allowed in a game
    var GAME_TIMEOUTID = null;

    var GameModel = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot: '/games',
        defaults: {},

        isFull: function() {
            return (_.keys(this.get('users')).length >= MAX_USERS);
        },

        addPlayer: function(curUser, successCb) {
            var users = this.get('users');
            users[curUser.id] = curUser;
            this.save({'users': users}, {patch: true}).done(successCb);
        },

        removePlayer: function(userId, successCb) {
            var users = this.get('users');
            delete users[userId];
            this.save({'users': users}, {patch: true}).done(successCb);
        },

        toggleState: function(successCb) {
            this.save(
                {'playState': !this.get('playState')},
                {patch: true})
            .done(successCb);
        },

        guessTrack: function(userId, trackId, successCb) {
            var guess = {'trackId': trackId, 'userId': userId};
            this.save({'guess':guess}, {patch: true}).done(successCb);
        },

        startFetching: function() {
            var game = this;

            function fetchGame() {
                game.fetch({
                    reset: true,
                    error: function(model, xhr) {
                        Util.doError(xhr.responseText);
                    }
                });
                GAME_TIMEOUTID = setTimeout(fetchGame, 2000);
            }

            fetchGame();
        },

        stopFetching: function() {
            clearTimeout(GAME_TIMEOUTID);
        }
    });

    return GameModel;
});
