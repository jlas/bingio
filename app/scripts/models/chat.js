/*
  Copyright (C) 2014 Juan Lasheras (http://www.juanl.org).

  This file is part of Bingio. Bingio is free software under the terms of the
  GNU General Public License version 3, see <http://www.gnu.org/licenses/>.
*/

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
