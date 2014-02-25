/*
  Copyright (C) 2014 Juan Lasheras (http://www.juanl.org).

  This file is part of Bingio. Bingio is free software under the terms of the
  GNU General Public License version 3, see <http://www.gnu.org/licenses/>.
*/

/*global define*/

define([
    "models/authentication",
    "views/game",
    "views/lobby",
    "views/splash"
], function (authModel, GameView, LobbyView, SplashView) {
    "use strict";

    var routeViews = {
        "game": GameView,
        "lobby": LobbyView,
        "splash": SplashView
    };

    var ApplicationRouter = Backbone.Router.extend({
        routes: {
            "": "splash",
            "game": "game",
            "lobby": "lobby",
            "splash": "splash",
        },

        switchView: function(route, options) {
            Backbone.history.navigate(route);

            // unset the current view and set a new one
            if (this.currentView !== undefined) {
                this.currentView.remove();
                this.currentView.unbind();

                if (this.currentView.cleanUp !== undefined) {
                    this.currentView.cleanUp();
                }
            }

            var ViewCls = routeViews[route];
            var view = new ViewCls(options);
            view.render();
            $("#app").html(view.$el);
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
                        router.switchView(route, {"curUser": authModel.get("userData")});
                    } else {
                        router.switchView("splash");
                    }
                },
                error: function(model, xhr, options) {
                    router.switchView("splash");
                }
            });
        } else {
            router.switchView("splash");
        }
    };

    router.on("route", routeCb);
    return router;
});
