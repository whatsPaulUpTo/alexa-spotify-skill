'use strict';
var _ = require('lodash');
var rp = require('request-promise');

var ENDPOINT = 'https://api.spotify.com/v1/';
var client_id = 'YOURIDHERE'; // Your client id
var client_secret = 'YOURSECRETHERE'; // Your secret
var token;
var songName;
var songObject;
var songAnalysis;
var songID;

function MusicDataHelper() {
};

MusicDataHelper.prototype.getToken = function() {
  var authOptions = {
    method: 'GET',
    uri: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };
  rp(authOptions)
    .then (function (data) {
      token = data.access_token;
      console.log('the access token is: ' + token);
    });
    .catch(err) {
      console.log('there was an error with token request');
      console.log(err);
    }
};

MusicDataHelper.prototype.getSongObj = function(songName) {
  //spotify search by query string function
  var options = {
    method: 'GET',
    uri: ENDPOINT + 'search?q=' + songName + '&type=track&limit=1&offset=0',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    json: true
  };
  return rp(options)
    .then(function(response) {
      songObject = response;
      songID = songObject.tracks.items[0].id
      console.log('success - received search result for ' + songName);
      console.log('songID = ' + songID);
      return response;
    })
};


MusicDataHelper.prototype.formatAirportStatus = function(airportStatus) {
  var weather = _.template('The current weather conditions are ${weather}, ${temp} and wind ${wind}.')({
    weather: airportStatus.weather.weather,
    temp: airportStatus.weather.temp,
    wind: airportStatus.weather.wind
  });
  if (airportStatus.delay === 'true') {
    var template = _.template('There is currently a delay for ${airport}. ' +
      'The average delay time is ${delay_time}. ' +
      'Delay is because of the following: ${delay_reason}. ${weather}');
    return template({
      airport: airportStatus.name,
      delay_time: airportStatus.status.avgDelay,
      delay_reason: airportStatus.status.reason,
      weather: weather
    });
  } else {
    //no delay
    return _.template('There is currently no delay at ${airport}. ${weather}')({
      airport: airportStatus.name,
      weather: weather
    });
  }
};

module.exports = MusicDataHelper;
