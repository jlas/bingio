##  Copyright (C) 2014 Juan Lasheras (http://www.juanl.org).
##
##  This file is part of Bingio. Bingio is free software under the terms of the
##  GNU General Public License version 3, see <http://www.gnu.org/licenses/>.

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
    """Get the Rdio API object for user based on a UUID cookie
    @return (obj) rdio api object
    """
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
    """OAuth authentication and endpoint for basic user data."""

    def GET(self):
        """Return auth state and basic user data."""
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
        """Start OAuth authentication."""
        url = rdio().begin_authentication(web.ctx.homedomain)
        web.redirect(url)

    def DELETE(self):
        """Logout of Rdio session."""
        rdio().logout()


# Process favicon.ico requests
class icon:
    def GET(self):
        raise web.seeother("/static/favicon.ico")


class game:
    """Endpoint for a single game resource."""

    def GET(self, _id):
        """Return game resource."""
        if not _id in gameStore:
            return resp("404", "Not Found")
        return resp("200", "Ok", gameStore[_id])

    def _makeTracks(self, source, playlist=None):
        user = rdio().currentUser()

        # get top 100 tracks in collection, sorted by playCount
        if source == "collection":
            tracks = rdio().getTracksInCollection(
                user=user["key"], sort="playCount", count=100)

        # get top 50 tracks in top charts
        elif source == "charts":
            tracks = rdio().getTopCharts(type="Track", count=50)

        # get tracks in a playlist
        elif source == "playlist" and playlist:
            playlists = rdio().getUserPlaylists(
                user=user["key"], extras='["tracks"]')
            for pl in playlists:
                if pl["name"].lower() == playlist.lower():
                    tracks = pl["tracks"]
                    break

        # if we have more than 25 tracks, pick a random selection of 25
        if len(tracks) > 25:
            random.shuffle(tracks)
            tracks = tracks[:25]

        # create a dict for each track with a subset of rdio data, add our own
        # "guessedBy" field to track player who guessed track correctly
        trackFields = ["key", "name", "artist", "guessedBy"]
        tracks = [dict([(k, track.get(k, None)) for k in trackFields]) for track in tracks]
        return dict([(track["key"], track) for track in tracks])

    def _makePlaybackToken(self):
        """Generate the Rdio playback token."""
        # get domain name of the server, remove any port number
        domain = web.ctx.host.split(":")[0]
        return rdio().getPlaybackToken(domain=domain)

    def _makeResource(self, _id, name, tracks):
        """Generate a bare dict for the game resource.
        @param _id (string)
        @param name (string)
        @param tracks (dict)
        """
        return {
            # unique id
            "_id": _id,

            # user provided game name
            "name": name,

            # rdio-generated token for clientside playback
            "playbackToken": self._makePlaybackToken(),

            # dict of tracks in game
            "tracks": tracks,

            # dict of users currently in game
            "users": {},

            # game state, False = game is paused, True = game is playing
            "playState": False,

            # current track being played
            "playingTrackId": None,

            # winner
            "winner": None
        }


    def PUT(self, _id):
        """Create a new game resource."""
        # get user provided data
        userData = json.loads(web.data())

        # create track data, playlist is optional
        tracks = self._makeTracks(userData["source"], userData.get("playlist"))

        # create the resource and add to global dict
        gameStore[_id] = game = self._makeResource(_id, userData["name"], tracks)

        return resp("201", "Created", game)

    def _updateUsers(self, oldUsers, newUsers, trackIds):
        """Update user records in game
        @param oldUsers (list)
        @param newUsers (list)
        @param trackIds (list)
        """
        oldNames = set(oldUsers.keys())
        newNames = set(newUsers.keys())
        addedNames = newNames.difference(oldNames)
        for addedName in addedNames:
            # create a randomized layout for the new user's game board
            random.shuffle(trackIds)

            # update user record with new fields
            newUsers[addedName].update({
                    # number of correct guesses
                    "rightGuesses": 0,

                    # number of incorrect guesses
                    "wrongGuesses": 0,

                    # correctly guessed tracks (as indices in the board array)
                    "rightIndices": [],

                    # the user's unique game board
                    "board": trackIds
                })

        return newUsers

    def _pickNewTrack(self, tracks):
        """Select a random track from a list of tracks.
        @param tracks (dict)
        @return track id (aka key)
        """
        toGuess = filter(lambda t: not bool(t["guessedBy"]), tracks.itervalues())
        return random.choice([k["key"] for k in toGuess])

    def _isWinningBoard(self, indices):
        """Check if a set of board indices form a winning bingo board.
        @indices (list) a list of row-major board indices, i.e. 0-4 are
          indices in the first row, 5-6 are indices in the second row, etc.
        """
        # need at least 5 indices to have a winning board
        if len(indices) < 5:
            return False

        # generate ranges
        rows = [range(i, i + 5) for i in xrange(0, 21, 5)]
        cols = [range(i, i + 21, 5) for i in xrange(5)]
        diags = [[0, 6, 12, 18, 24], [20, 16, 12, 8, 4]]

        # check ranges
        for rng in rows + cols + diags:
            for idx in rng:
                if not idx in indices:
                    break
            else:
                return True

    def _handleUserGuess(self, guess, game):
        """Handle a user guess
        @param guess (dict) with trackId and userId
        @param game (dict)
        @return None (game dict altered in this method)
        """
        guessedTrackId = guess["trackId"]
        userId = guess["userId"]
        user = game["users"][userId]
        playingTrackId = game["playingTrackId"]

        # user already lost, too many wrong guesses
        if user["wrongGuesses"] >= 3:
            return

        # game is not being played
        if not game["playState"] or playingTrackId is None:
            return

        alreadyGuessed = bool(game["tracks"][guessedTrackId]["guessedBy"])
        if not alreadyGuessed:
            # user guessed correctly
            if guessedTrackId == playingTrackId:
                user["rightGuesses"] += 1
                user["rightIndices"].append(user["board"].index(guessedTrackId))
                game["tracks"][guessedTrackId]["guessedBy"] = userId
                game["playingTrackId"] = self._pickNewTrack(game["tracks"])
                if self._isWinningBoard(user["rightIndices"]):
                    game["winner"] = userId

            # user guessed incorrectly
            else:
                user["wrongGuesses"] += 1

    def PATCH(self, _id):
        """Update an existing game resource."""
        if not _id in gameStore:
            return resp("404", "Not Found")

        userData = json.loads(web.data())
        game = gameStore[_id]

        # update users, remove game if # of users is 0
        if "users" in userData:
            game["users"] = self._updateUsers(
                game["users"], userData["users"], game["tracks"].keys())

            if len(game["users"]) == 0:
                del gameStore[_id]

        # update the play state (paused vs. playing)
        if "playState" in userData:
            game["playState"] = userData["playState"]
            if userData["playState"]:
                game["playingTrackId"] = self._pickNewTrack(game["tracks"])
            else:
                game["playingTrackId"] = None

        # handle user guess
        if "guess" in userData:
            guess = userData["guess"]
            self._handleUserGuess(guess, game)

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
