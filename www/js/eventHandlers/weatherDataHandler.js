function cWeatherDataHandler() {
	
	this.locationCoord = [];	// will be saved when 'call_geolocation' is called

	this.currentWeatherData = '';	// in string

}

cWeatherDataHandler.prototype = {

	getData: function () {
		var t = this;
		return new Promise(function (resolve, reject) {
			$$.ajax({
	        method: 'GET',
	        url: dVar.weatherAPIUrlHead + t.locationCoord[0] + ',' + t.locationCoord[1] + dVar.weatherAPIUrlTail,  
	        dataType: 'json',    
	        async: false,
	        success: resolve,
	        error: reject
	    });
		});
	},

	calculateSuntimesFromMidnight: function () {

		var t = this;
		
		t.getData()
		.then(function (parsed_json) {

			t.currentWeatherData = JSON.stringify(parsed_json);		// make it globalize (within this instance)
			
			// ======================================================================
			// Seconds until midnight and midnight in epoch
			var currentTime = parseInt(new Date().getTime() / 1000);

	    var midnight = new Date();
	    midnight.setHours( 24 );
	    midnight.setMinutes( 0 );
	    midnight.setSeconds( 0 );
	    midnight.setMilliseconds( 0 );

	    var midnightEpoch = parseInt(midnight.getTime() / 1000);
	    var secondsUntilMidnight = midnightEpoch - currentTime;
	    // ======================================================================

			var sunriseTimeEpoch;
			var sunsetTimeEpoch;

			// Case 1: Today's sunset and tomorrow's sunrise -> range of night time
			sunsetTimeEpoch = parsed_json['daily']['data'][0]['sunsetTime'];
			sunriseTimeEpoch = parsed_json['daily']['data'][1]['sunriseTime'];
			
			//console.log('\nCase 1: \nSunset: ' + (midnightEpoch - sunsetTimeEpoch) + ' s ' + '\nSunrise: ' + (sunriseTimeEpoch - midnightEpoch));


		})
		.catch(function(err){
			console.log('Error in getting weather data: ' + JSON.stringify(err));
		});

	} 

}