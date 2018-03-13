function cAppEventHandler () {

}

cAppEventHandler.prototype = {

	init: function () {
		
		console.log('Start events');

    callBleEventHandler.conState.push(callBleEventHandler.conStateIndex.DISCONNECTED);
		callBleEventHandler.startBLEProcess();
		
	},

  // For Sunset, Sunrise time, we need weather data
	call_geolocation: function () {

		var onSuccess = function(position) {

      callWeatherHandler.locationCoord = [];  
      callWeatherHandler.locationCoord.push(position.coords.latitude);
      callWeatherHandler.locationCoord.push(position.coords.longitude);

      callWeatherHandler.calculateSuntimesFromMidnight();

    };

    // onError Callback receives a PositionError object
    //
    function onError(error) {
        console.log('code: '    + error.code    + '\n' +
              'message: ' + error.message + '\n');
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError);

	}

	
}