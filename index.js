module.change_code = 1;
var Alexa = require('alexa-app');
var app = new Alexa.app('music-mastermind');
var rp = require('request-promise');

var client_id = 'your-client-id-here'; // Your client id
var client_secret = 'your-client-secret-here'; // Your secret
var token;
var options;
var songName;
var songObj;
var trackID;
var songAnalysis;
var reprompt = 	'What song do you want to know the key and tempo for?';
var alexaResponse = 'Sorry, I was unable to retrieve the song data. Please try again.';
var saySong;
var sayArtist;
var sayTempo;
var sayKey;

var exitFunction = function(request, response) {
  var stopOutput = 'Thanks for using Music Mastermind! Goodbye';
  response.say(stopOutput).shouldEndSession(true);
};

var authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
  },
  form: {
    grant_type: 'client_credentials'
  },
  json: true,
  method: 'POST'
};

// *** LAUNCH APP ***
app.launch(function(req, res) {
	var prompt = 	'Welcome to Music Mastermind. What song do you want to know the key and tempo for? For example, you can say, "what is the key and tempo of I Will Survive?"'
	res.say(prompt).reprompt(prompt).shouldEndSession(false);
	return;
});

// *** MAIN INTENT ***
app.intent('getKeyAndTempo', {
		'slots': {
			'SONGNAME': 'SONGNAMES'
		},
		'utterances': ['{what is|tell me} {|the key and tempo|the tempo and key|the key|the tempo} {about|for|of} {-|SONGNAME}']
	}, 
	function(req, res) {
		//get the slot
		songName = req.slot('SONGNAME');

		if (!songName) {
			var prompt = 'I didn\'t understand. Please tell me what song you want to know the key and tempo for. For example, you can say, "what is the key and tempo of I Will Survive?"';
			res.say(prompt).reprompt(reprompt).shouldEndSession(false);
			return true;
		} else {
			songName = songName.replace(/ /g, '+');
			// Main app logic goes here

			//retrieve authorization token from Spotify
			return rp(authOptions).then(function(body) {
        		token = body.access_token;
      		}
      		).then(getSongObj
      		).then(getAnalysis
      		).then(formatResponse
      		).then(buildResponse
      		).then(function() {
      			//alexa response
      			console.log(alexaResponse);
      			res.say(alexaResponse).send();
      		}
      		).catch(function(err) {
				console.log(err.statusCode);
				songName = songName.replace(/\+/g, ' ');
				var prompt = 'Sorry. I couldn\'t find information for ' + songName + '. Please ask me about a different song.';
				res.say(prompt).reprompt(reprompt).shouldEndSession(false).send();
			});

			//alexa response
			console.log(alexaResponse);
			res.say(alexaResponse).shouldEndSession(true).send();
		}
	}
);

app.intent('AMAZON.HelpIntent', {

	"slots": {},
	"utterances": []
}, function(request, response) {
	var helpOutput = 'To find out the key and tempo of a song, request it by it\'s title.  For example, to get information about "I Will Survive", say,  What is the key and tempo of "I Will Survive"?  You can also say stop or cancel to exit. What song would you like me to tell you about?';
	response.say(helpOutput).shouldEndSession(false);
	return;
});

app.intent('AMAZON.StopIntent', {

	"slots": {},
	"utterances": []
}, exitFunction);

app.intent('AMAZON.CancelIntent', {

	"slots": {},
	"utterances": []
}, exitFunction);

// *** SPOTIFY API FUNCTIONS ***

function getSongObj() {
    options = {
    	url: 'https://api.spotify.com/v1/search?q=' + songName + '&type=track&limit=1&offset=0',
    	headers: {
    		'Authorization': 'Bearer ' + token
    	},
    	json: true
    };

    return rp(options);
}

function getAnalysis(song) {
	songObj = song;
	trackID = songObj.tracks.items[0].id;
	console.log(trackID);
	options = {
		url: 'https://api.spotify.com/v1/audio-features/' + trackID,
		headers: {
			'Authorization': 'Bearer ' + token
		},
		json: true
	};

	return rp(options);
}

function formatResponse(analysis) {
	songAnalysis = analysis;
	saySong = (songObj.tracks.items[0].name).replace(/&/g, 'and');
	sayArtist = formatArtist(songObj.tracks.items[0].artists);
	sayTempo = Math.round(songAnalysis.tempo);
	sayKey = formatKey(songAnalysis);

}

function buildResponse() {
	alexaResponse = 'Here\'s what I got for ' + saySong + ', by ' + sayArtist + '. It is in the key of ' + sayKey + ', and it has a tempo of ' + sayTempo + ' beats per minute.';

	console.log(alexaResponse);

	return alexaResponse;
}

function formatArtist(artists) {
	var artistStr = '';
	for (var i = 0; i < artists.length; i++) {
		if (artists[i-1] && !artists[i+1]) {
			artistStr += 'and ';
		}
		artistStr += artists[i].name;
		if (artists[i+1]) {
			artistStr += ', ';
		}
	}

	return artistStr.replace(/&/g, 'and');
}

function formatKey(analysisObj) {
	var keyString = '';

	switch (analysisObj.key) {
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
			keyString += 'F sharp ';
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
			keyString += 'undefined key ';
	}

	switch (analysisObj.mode) {
		case 0:
			keyString += 'minor';
			break;
		case 1:
			keyString += 'major';
			break;
		default:
			keyString += 'with undefined mode ';
	}

	return keyString;
}

//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
module.exports = app;