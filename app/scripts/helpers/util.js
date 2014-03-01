/*
  Copyright (C) 2014 Juan Lasheras (http://www.juanl.org).

  This file is part of Bingio. Bingio is free software under the terms of the
  GNU General Public License version 3, see <http://www.gnu.org/licenses/>.
*/

/*global define*/

define([
    'jquery',
    'underscore'
], function ($, _) {
    'use strict';

    var that = {};

    /**
     * Escape html. For displaying user input.
     * @param str: {string} string to escape
     */
    that.esc = function(str) {
        return $('<div/>').text(str).html();
    };

    // Render the Loading screen
    that.doLoading = function () {
        $('#app').html(
            '<p id="loading"><i class="fa fa-spinner fa-spin"></i>&nbsp;Loading...</p>');
    };

    // Display an error message
    that.doError = function(msg) {
        try {
            var parsed = $.parseJSON(msg);
            if (typeof parsed === 'string') {
                msg = parsed;
            }
        } catch (e) {
            ;
        }

        // don't display an empty message
        if (!msg) {
            return;
        }

        $('#error').text(msg).show();
        _.delay(function(){
            $('#error').fadeOut(2000);
        }, 4000);
    };

    return that;
});
