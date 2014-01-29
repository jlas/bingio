import os
from os.path import dirname
import json
import sys
import web
import random
import uuid

urls = (
    '/query', 'query',
    '/collection', 'collection',
    '/authentication', 'authentication',
    '/debug', 'debug',
    '/games/(.+)/users', 'gameusers',
    '/games/(.+)', 'game',
    '/games', 'games',
    '/chat', 'chat',
    '/', 'default'
    )
app = web.application(urls, globals())

from rdioapi import Rdio

rdiodict = {}

def rdio():
    playerid = web.cookies().get('playerid')
    if not playerid:
        playerid = str(uuid.uuid4().get_hex())
        web.setcookie('playerid', playerid)
    rdio = rdiodict.get(playerid)
    if not rdio:
        rdio = rdiodict[playerid] = \
               Rdio('2qezg84b8hhpuza5naty3z6f', 'XwNhEgtNy4', {})
    return rdio

games_store = []

class collection:
    def GET(self):
        user_data = web.input()
        user = rdio().findUser(vanityName=user_data.user)
        resp = rdio().getTracksInCollection(user=user['key'], count=25)
        return json.dumps(resp)


class query:
    def GET(self):
        user_data = web.input()
        resp = rdio().search(query=user_data.query, types=user_data.types)
        return json.dumps(resp)


class authentication:
    def GET(self):
        return json.dumps({'state': bool(rdio().authenticated)})

    def POST(self):
        url = rdio().begin_authentication('http://' + web.ctx.host)
        web.redirect(url)

    def DELETE(self):
        rdio().logout()

class gameusers:
    def POST(self, name):
        if not rdio().authenticated:
            return

        for game in games_store:
            if game['name'] == name:
                break
        else:
            return

        data = web.input()
        users = game.setdefault('users', [])
        users.append(rdio().currentUser(extras='["username"]'))

class game:
    def GET(self, name):
        for game in games_store:
            if game['name'] == name:
                return json.dumps(game)

class games:
    def GET(self):
        return json.dumps(games_store)

    def POST(self):
        user_data = json.loads(web.data())
        name = user_data['name']
        source = user_data['source']
        playlist = user_data.get('playlist')  # could be optional

        game = {
            'name': name,
            'playback_token': rdio().getPlaybackToken(domain='localhost')
            }

        user = rdio().currentUser()
        if source == "collection":
            tracks = rdio().getTracksInCollection(user=user['key'], count=25)
            game['tracks'] = tracks

        elif source == "playlist" and playlist:
            playlists = rdio().getUserPlaylists(user=user['key'], extras='["tracks"]')
            for pl in playlists:
                if pl['name'] == playlist:
                    game['tracks'] = pl['tracks']
                    break

        games_store.append(game)


chatlog = []

class chat:
    def GET(self):
        user_data = web.input(since=0)
        since = int(user_data.since)
        return json.dumps(chatlog[since:])

    def POST(self):
        entry = json.loads(web.data())
        chatlog.append(entry)
        return json.dumps(True)


class default:
    def GET(self):
        if rdio().authenticating:
            user_data = web.input()
            rdio().complete_authentication(user_data['oauth_verifier'])
        web.seeother('static/index.html')


class debug:
    def GET(self):

        url = rdio().begin_authentication(web.ctx.host)
        web.redirect(url)

        #return web.ctx.host
        #return web.url()

if __name__ == "__main__":
    os.chdir(dirname(__file__))
    # Bind to PORT if defined, otherwise default to 8000.
    port = os.environ.get('PORT', '8000')
    # put port in args list cause that's how web.py rolls
    sys.argv.append(port)
    app.run()
