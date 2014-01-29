/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'requirejs-text!templates/splash.html'
], function ($, _, Backbone, tmpl) {
    'use strict';

    var SplashView = Backbone.View.extend({
        template: _.template(tmpl),

        render : function() {
            this.$el.html(this.template(this));
            return this;
        },
    });

    return SplashView;
});
