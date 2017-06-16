'use strict';
module.change_code = 1;
var Alexa = require('alexa-app');
var app = new Alexa.app('music-mastermind');
var request = require('request');

var client_id = ''; // Your client id
var client_secret = ''; // Your secret
var token;
var options;
var songName;
var songObj;
var trackID;
var songAnalysis;
var alexaResponse = 'the response was never formatted';

var authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
  },
  form: {
    grant_type: 'client_credentials'
  },
  json: true
};

// *** LAUNCH APP ***
app.launch(function(req, res) {
  var prompt = 'Tell me the name of the song you want to know the key and tempo for.';
  res.say(prompt).reprompt(prompt).shouldEndSession(false);
});

// *** MAIN INTENT ***
app.intent('getKeyAndTempo', {
		'slots': {
			'SONGNAME': 'SONGNAMES'
		},
		'utterances': ['{|about|for} {-|SONGNAME}']
	}, 
	function(req, res) {
		//get the slot
		songName = req.slot('SONGNAME');
		var reprompt = 'Tell me the name of the song you want to know the key and tempo for.';

		if (songName == '') {
			var prompt = 'I didn\'t hear a song name. Tell me a song name.';
			res.say(prompt).reprompt(reprompt).shouldEndSession(false);
			return true;
		} else {
			songName = songName.replace(/ /g, '+');

			// Main app logic goes here
			//get token
			return request.post(authOptions, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					var token = body.access_token;

					//set up for get song object
					var options = {
						url: 'https://api.spotify.com/v1/search?q=' + songName + '&type=track&limit=1&offset=0',
						headers: {
							'Authorization': 'Bearer ' + token
						},
						json: true
					};
										 
					//get song object
					request.get(options, function(error, response, body) {
						if (!error && response.statusCode === 200) {
							songObj = body;
							trackID = songObj.tracks.items[0].id;

							// set up for get analysis
							options = {
								url: 'https://api.spotify.com/v1/audio-analysis/' + trackID,
								headers: {
									'Authorization': 'Bearer ' + token
								},
								json: true
							};

							//get analysis
							request.get(options, function(error, response, body) {
								if (!error && response.statusCode === 200) {
									songAnalysis = body;
									var saySong = songObj.tracks.items[0].name;
									var sayArtist = formatArtist(songObj.tracks.items[0].artists);
									var sayTempo = Math.round(songAnalysis.track.tempo);
									var sayKey = formatKey(songAnalysis);

									alexaResponse = 'Here\'s what I got for ' + saySong + ', by ' + sayArtist + '. It is in the key of ' + sayKey + ', and it has a tempo of ' + sayTempo + ' beats per minute.';

									// //alexa response
									// res.say(alexaResponse).send();

								} else {
									console.log(error);
								}
							});
						} else {
							console.log(error);
						}
					});
				} else {
					console.log(error);
				}
			});

			//Alexa says answer
			res.say(alexaResponse).send();

		}
	}
);

// *** SPOTIFY API FUNCTIONS ***

function formatArtist(artists) {
	var artistStr;
	for (var i = 0; i < artists.length; i++) {
		if (artists[i-1] && !artists[i+1]) {
			artistStr += 'and ';
		}
		artistStr += artists[i].name;
		if (artists[i+1]) {
			artistStr += ', ';
		}
	}
	return artistStr;
}

function formatKey(analysisObj) {
	var keyString;

	switch (analysisObj.track.key) {
		case 0:
			keyString += 'C ';
			break;
		case 1:
			keyString += 'C sharp ';
			break;
		case 2:
			keyString += 'D ';
			break;
		case 3:
			keyString += 'E flat ';
			break;
		case 4:
			keyString += 'E ';
			break;
		case 5:
			keyString += 'F ';
			break;
		case 6:
			keyString += 'F sharp';
			break;
		case 7:
			keyString += 'G ';
			break;
		case 8:
			keyString += 'A flat ';
			break;
		case 9:
			keyString += 'A ';
			break;
		case 10:
			keyString += 'B flat ';
			break;
		case 11:
			keyString += 'B ';
			break;
		default:
			console.log('There shouldn\'t be a default case for the key');
	}

	switch (analysisObj.track.mode) {
		case 0:
			keyString += 'minor';
			break;
		case 1:
			keyString += 'major';
			break;
		default:
			console.log('There shouldn\'t be a default case for the mode');
	}

	return keyString;
}

//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
module.exports = app;
