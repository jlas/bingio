/*
  Copyright (C) 2014 Juan Lasheras (http://www.juanl.org).

  This file is part of Bingio. Bingio is free software under the terms of the
  GNU General Public License version 3, see <http://www.gnu.org/licenses/>.
*/

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
