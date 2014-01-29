/*global define*/

define([
    'underscore',
    'backbone'
], function(_, Backbone) {
    'use strict';

    var AuthenticationModel = Backbone.Model.extend({
        url : '/authentication',
        initialize : function() {
            this.id = 1;
        }
    });

    return new AuthenticationModel();
});