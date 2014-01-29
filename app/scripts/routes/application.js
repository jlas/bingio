/*global define*/

define([
    "views/lobby",
    "views/splash"
], function (LobbyView, SplashView) {
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
        router.switchView(route);
    };

    router.on("route", routeCb);
    return router;
});
