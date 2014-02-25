/*
  Copyright (C) 2014 Juan Lasheras (http://www.juanl.org).

  This file is part of Bingio. Bingio is free software under the terms of the
  GNU General Public License version 3, see <http://www.gnu.org/licenses/>.
*/

/*global define*/

define([
    'jquery'
], function ($) {
    'use strict';

    var that = {};

    that.doLoading = function () {
        $("#app").html(
            "<p id='loading'><i class='fa fa-spinner fa-spin'></i>&nbsp;Loading...</p>");
    }

    return that;
});
