/*global define*/

define([
    "models/authentication",
    "views/lobby",
    "views/splash"
], function (authModel, LobbyView, SplashView) {
    "use strict";

    var routeViews = {
        "lobby" : LobbyView,
        "splash" : SplashView
    };

    var ApplicationRouter = Backbone.Router.extend({
        routes: {
            "" : "splash",
            "lobby" : "lobby",
            "splash" : "splash"
        },

        switchView : function(route, options) {
            Backbone.history.navigate(route);

            // unset the current view and set a new one
            if (this.currentView !== undefined) {
                console.log("cleanup!");
                this.currentView.remove();
                this.currentView.unbind();
            }

            var ViewCls = routeViews[route];
            var view = new ViewCls(options);
            view.render();
            $("body").html(view.$el);
            this.currentView = view;
        }
    });

    var router = new ApplicationRouter();

    var routeCb = function(route, params) {
        if (route !== "splash") {
            /**
             * If user is not auth'ed and tries to get non-splash page, send
             * them to splash.
             */
            authModel.fetch({
                success: function() {
                    if (authModel.get("state") === true) {
                        router.switchView(route);
                    } else {
                        router.switchView("splash");
                    }
                },
                error: function(model, xhr, options) {
                    $("#error").text(xhr.responseText).show().fadeOut(5000);
                }
            });
        } else {
            router.switchView("splash");
        }
    };

    router.on("route", routeCb);
    return router;
});
