bingio
======

It's like bingo, except with music. Made with web.py & Backbone. Powered by Rdio.

Try out the live demo: http://bingio.juanl.org

## Demo Video

http://youtu.be/dHLPX_LekNc

## Screenshots

![bingio](https://raw.github.com/jlas/bingio/master/media/screenshot-game.png)

---

* Game Lobby:

![bingio](https://raw.github.com/jlas/bingio/master/media/screenshot-lobby.png)

---

* Splash Screen:

![bingio](https://raw.github.com/jlas/bingio/master/media/screenshot-splash.png)

## Install & Run

You must first setup the project environment. Run:

    $ ./make-prod

This will setup npm, bower, and will finally run grunt.

Run the game server:

    $ python dist/app.py

... now you can visit http://localhost:8000 and start playing.

Connecting with Rdio requires API Keys, visit http://www.rdio.com/developers/
to create your keys. By default <code>app.py</code> will check environment
variables for keys, or you can edit <code>app.py</code> to use yours directly.

Running <code>make-prod</code> will create a <code>dist/</code> directory. This
directory essentially contains the "production" environment, i.e. all the built
and minified client files are found here.

You can also run the game server from the dev environment (you'll still
need to run <code>make-prod</code>), like so:

    $ python app/app.py

Copyright
---------

Copyright (C) 2014 Juan Lasheras (http://www.juanl.org).

Licensed under GPL, see https://www.gnu.org/copyleft/gpl.html for details.

Send any questions or comments [here](http://twitter.com/jlas_).
