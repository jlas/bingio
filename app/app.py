import os
from os.path import dirname
import json
import sys
import web
import random
import uuid

urls = (
    "/authentication", "authentication",
    "/chat", "chat",
    "/debug", "debug",
    "/favicon.ico", "icon",
    "/games/(.+)", "game",
    "/games", "games",
    "/", "default"
    )
app = web.application(urls, globals())

from rdioapi import Rdio

rdiodict = {}

def rdio():
    playerid = web.cookies().get("playerid")
    if not playerid:
        playerid = str(uuid.uuid4().get_hex())
        web.setcookie("playerid", playerid)
    rdio = rdiodict.get(playerid)
    if not rdio:
        rdio = rdiodict[playerid] = \
               Rdio("2qezg84b8hhpuza5naty3z6f", "XwNhEgtNy4", {})
    return rdio


def resp(code, status, data=None):
    """Return a wrapped response and set response status.
    @param code: http return code
    @param status: success, error, failure
    @param data: data to return
    @return json string
    """
    web.ctx.status = " ".join([code, status])
    if not data is None:
        resp = data
    else:
        resp = {"code": code, "status": status}
    return json.dumps(resp)

gameStore = {}


class authentication:
    def GET(self):
        user = rdio().currentUser(extras='["username"]')
        return json.dumps({
            "state": bool(rdio().authenticated),
            "userData": {
                "name": user["username"],
                "url": user["url"],
                "id": user["key"],
                "icon": user["icon"]
            }
        })

    def POST(self):
        url = rdio().begin_authentication(web.ctx.homedomain)
        web.redirect(url)

    def DELETE(self):
        rdio().logout()


# Process favicon.ico requests
class icon:
    def GET(self):
        raise web.seeother("/static/favicon.ico")


class game:
    def GET(self, _id):
        return json.dumps(gameStore[_id])

    def PUT(self, _id):
        userData = json.loads(web.data())
        name = userData["name"]
        source = userData["source"]
        playlist = userData.get("playlist")  # could be optional

        domain = web.ctx.host.split(":")[0]
        game = {
            "_id": _id,
            "name": name,
            "playbackToken": rdio().getPlaybackToken(domain=domain),
            "tracks": {},
            "users": {},
            "playState": False,
            "playingTrack": None
            }

        user = rdio().currentUser()
        if source == "collection":
            tracks = rdio().getTracksInCollection(
                user=user["key"], sort="playCount", count=100)

        elif source == "charts":
            tracks = rdio().getTopCharts(type="Track", count=50)

        elif source == "playlist" and playlist:
            playlists = rdio().getUserPlaylists(
                user=user["key"], extras='["tracks"]')
            for pl in playlists:
                if pl["name"].lower() == playlist.lower():
                    tracks = pl["tracks"]
                    break

        if len(tracks) > 25:
            random.shuffle(tracks)
            tracks = tracks[:25]

        trackFields = ["key", "name", "artist", "guessedBy"]
        tracks = [dict([(k, track.get(k, None)) for k in trackFields]) for track in tracks]
        game["tracks"] = dict([(track["key"], track) for track in tracks])
        gameStore[_id] = game
        return resp("201", "Created", game)

    def PATCH(self, _id):
        userData = json.loads(web.data())
        game = gameStore[_id]

        if "users" in userData:
            oldUsers = set(game["users"].keys())
            newUsers = set(userData["users"].keys())
            addedUsers = newUsers.difference(oldUsers)

            # add some new fields to new users' records
            for addedUser in addedUsers:
                newFields = {
                    "rightGuesses": 0,
                    "wrongGuesses": 0
                }

                # create a randomized layout for the game board
                board = game["tracks"].keys()
                random.shuffle(board)
                newFields["board"] = board

                # update user record with new fields
                userData["users"][addedUser].update(newFields)

            game["users"] = userData["users"]
            if len(game["users"]) == 0:
                del gameStore[_id]

        if "playState" in userData:
            game["playState"] = userData["playState"]
            if userData["playState"]:
                toGuess = filter(lambda t: not bool(t[1]["guessedBy"]), game["tracks"].iteritems())
                game["playingTrack"] = random.choice([k for k, v in toGuess])
            else:
                game["playingTrack"] = None

        if "guess" in userData:
            guess = userData["guess"]
            guessedTrackId = guess["trackId"]
            userId = guess["userId"]
            user = game["users"][userId]
            playState = game["playState"]
            playingTrackId = game["playingTrack"]

            if playingTrackId is not None and playState:
                # user guessed correctly
                if guessedTrackId == playingTrackId:
                    user["rightGuesses"] += 1
                    game["tracks"][guessedTrackId]["guessedBy"] = userId

                # user guessed incorrectly
                else:
                    user["wrongGuesses"] += 1

        return resp("200", "Ok", game)


class games:
    def GET(self):
        return json.dumps(gameStore.values())


chatlog = []

class chat:
    def GET(self):
        userData = web.input(since=0)
        since = int(userData.since)
        return json.dumps(chatlog[since:])

    def POST(self):
        entry = json.loads(web.data())
        chatlog.append(entry)
        return resp("201", "Created")


class default:
    def GET(self):
        if rdio().authenticating:
            userData = web.input()
            rdio().complete_authentication(userData["oauth_verifier"])
            web.seeother("static/index.html#lobby")
        else:
            web.seeother("static/index.html")


class debug:
    def GET(self):
        print web.ctx.status

        # url = rdio().begin_authentication(web.ctx.host)
        # web.redirect(url)

        #return web.ctx.host
        #return web.url()

if __name__ == "__main__":
    os.chdir(dirname(__file__))
    # Bind to PORT if defined, otherwise default to 8000.
    port = os.environ.get("PORT", "8000")
    # put port in args list cause that"s how web.py rolls
    sys.argv.append(port)
    app.run()
