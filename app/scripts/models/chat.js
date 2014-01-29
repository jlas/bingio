/*global define*/

define([
    'underscore',
    'backbone'
], function (_, Backbone) {
    'use strict';

    var ChatModel = Backbone.Model.extend({
        idAttribute: "_id",
        defaults: {}
    });

    return ChatModel;
});
