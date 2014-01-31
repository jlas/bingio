/*global define*/

define([
    'underscore',
    'backbone'
], function (_, Backbone) {
    'use strict';

    var GameModel = Backbone.Model.extend({
        idAttribute: "_id",
        urlRoot: "/games",
        defaults: {},

        addPlayer: function(curUser, successCb) {
            var users = this.get("users");
            users[curUser["id"]] = curUser;
            this.save({"users": users}, {patch: true}).done(successCb);
        },

        removePlayer: function(userId, successCb) {
            var users = this.get("users");
            delete users[userId];
            this.save({"users": users}, {patch: true}).done(successCb);
        },

        toggleState: function(successCb) {
            this.save(
                {"playState": !this.get("playState")},
                {patch: true})
            .done(successCb);
        }
    });

    return GameModel;
});
