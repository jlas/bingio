/*global require*/
'use strict';

require.config({
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        bootstrap: {
            deps: [
                'jquery'
            ],
            exports: 'jquery'
        }
    },
    paths: {
        jquery: '../bower_components/jquery/jquery',
        backbone: '../bower_components/backbone/backbone',
        underscore: '../bower_components/underscore/underscore',
        bootstrap: '../bower_components/sass-bootstrap/dist/js/bootstrap',
        modernizr: '../bower_components/modernizr/modernizr',
        'requirejs-text': '../bower_components/requirejs-text/text',
        requirejs: '../bower_components/requirejs/require',
        'sass-bootstrap': '../bower_components/sass-bootstrap/dist/js/bootstrap'
    }
});

require([
    'backbone',
    'routes/application'
], function (Backbone, router) {

    /**
     * Special click handler for automatically routing <a> clicks through
     * backbone. We can bypass this behaviour by setting the data-bypass
     * attribute on the <a> element.
     */
    $(document).on("click", "a:not([data-bypass])", function(evt) {
        var href = {
            prop : $(this).prop("href"),
            attr : $(this).attr("href")
        };
        var root = location.protocol + "//" + location.host;

        if (href.prop && href.prop.slice(0, root.length) === root) {
            evt.preventDefault();
            Backbone.history.navigate(href.attr, {
                trigger : true
            });
        }
    });

    Backbone.history.start();
});
