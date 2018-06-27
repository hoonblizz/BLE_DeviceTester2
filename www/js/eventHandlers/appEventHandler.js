function cAppEventHandler () {

}

cAppEventHandler.prototype = {

	init: function () {
		
		console.log('Start events');

    mBLE.setConState(mBLE.conStateIndex.DISCONNECTED);
		//mBLE.startBLEProcess();			// June.27.2018 - See index.js.
			
	},

  // For Sunset, Sunrise time, we need weather data
	call_geolocation: function () {
		return new Promise((resolve, reject) => {
			var onSuccess = function(position) {

	      callWeatherHandler.locationCoord = [];  
	      callWeatherHandler.locationCoord.push(position.coords.latitude);
	      callWeatherHandler.locationCoord.push(position.coords.longitude);

	      resolve(true);
	      //callWeatherHandler.calculateSuntimesFromMidnight();		// June.27.2018 - See index.js

	    };

	    // onError Callback receives a PositionError object
	    //
	    function onError(error) {
	    	console.log('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
	    	reject('Error in Geolocation');
	    }

	    navigator.geolocation.getCurrentPosition(onSuccess, onError);


		});

	}

	
}