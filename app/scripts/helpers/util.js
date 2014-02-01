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
