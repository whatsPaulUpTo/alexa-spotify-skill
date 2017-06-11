'use strict';
module.change_code = 1;
var _ = require('lodash');
var Alexa = require('alexa-app');
var app = new Alexa.app('music-mastermind');
var MusicDataHelper = require('./spotify-data-helper');

app.launch(function(req, res) {
  var prompt = 'Tell me the name of the song you want to know the key and tempo for.';
  res.say(prompt).reprompt(prompt).shouldEndSession(false);
});

app.intent('music-mastermind', {
  'slots': {
    'SONGNAME'
  },
  'utterances': ['{|what|tell} {|is|me} {|the} {|key|tempo|bpm|beats per minute} {|and} {|key|tempo|bpm|beats per minute} {|info|information} {|of|for} {-|SONGNAME}']
},
  function(req, res) {
    //get the slot
    var songName = req.slot('SONGNAME');
    var songName = songName.replace(/ /g, '+')
    var reprompt = 'Tell me the name of the song you want to know the key and tempo for.';
    if (_.isEmpty(songName)) {
      var prompt = 'I didn\'t hear a song name. Tell me a song name.';
      res.say(prompt).reprompt(reprompt).shouldEndSession(false);
      return true;
    } else {
      var musicHelper = new MusicDataHelper();
      musicHelper.getSongObj(songName).then(function(airportStatus) {
        console.log(airportStatus);
        res.say(musicHelper.formatAirportStatus(airportStatus)).send();
      }).catch(function(err) {
        console.log(err.statusCode);
        var prompt = 'I didn\'t have data for the song called ' + songName;
        res.say(prompt).reprompt(reprompt).shouldEndSession(false).send();
      });
      return false;
    }
  }
);
//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
module.exports = app;
