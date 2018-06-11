// Rewritten in Jan.04.2018

// declare event handlers
var callClickHandler, callBleEventHandler, callAppEventHandler, callWeatherHandler;
var callViewHandler;

callClickHandler = new cClickEventHandler();
callAppEventHandler = new cAppEventHandler();
callBleEventHandler = new cBleEventHandler();
callBleBGEventHandler = new cBleEventHandlerBG();
callWeatherHandler = new cWeatherDataHandler();
callDatalogHandler = new cDatalogHandler();

callViewHandler = new cViewHandler();

// Global var
//var subscriptionTestInterval = 0;   // Feb.20.2018 - Added
var subscriptionDisplayListIndex = 0; // Feb.20.2018 - Added

var appBGFG = 8;    // onBG - 7, onFG - 8
var BackgroundFetch;  // Mar.08.2018 - Testing for background fetch event

var bgTestingInterval = 0;	// May.03.2018 - Testing for BG

var datalogNotificationDone = new CustomEvent('datalogNotificationDone'); // Mar.07.2018 - Added to track of datalog completed

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {

  console.log('\n********************\nDevice Ready' + '\n********************\n');

  callBleEventHandler.loadSkinEnv();
  callViewHandler.display_skinEnv(callBleEventHandler.currentSkintype, callBleEventHandler.currentEnvironment);
  
  // init events
  callClickHandler.init();

  callAppEventHandler.init();
  callAppEventHandler.call_geolocation(); // For sunrise, sunset time
  
  BackgroundFetch = window.BackgroundFetch;

  // For newer iOS, now uses this.
  // Whether its connected or not, disconnect then connect
  document.addEventListener("active", () => {

    appBGFG = 8;
    console.log('Foreground (Active): ' + appBGFG + ', wait_then_connect_interval: ' + callBleEventHandler.wait_then_connect_interval);

    callBleEventHandler.disconnectDevice(callBleEventHandler.targetDeviceObj);

    // Mar.19.2018 - When App BG then right after back to FG. Then 'startBLEProcess' is called twice
    setTimeout(function () {
      callBleEventHandler.startBLEProcess();
    }, 5000);

  }, false);

  // For Android or older iOS
  document.addEventListener("resume", () => {
    setTimeout(function () {

      appBGFG = 8;
      console.log('Foreground (Resume): ' + appBGFG + ', wait_then_connect_interval: ' + callBleEventHandler.wait_then_connect_interval);
      clearInterval(bgTestingInterval);

      var lastConnectionState = callBleEventHandler.conState[callBleEventHandler.conState.length - 1]; 

      // May.03.2018 - For Android, always gets connected
      // For iOS, disconnect then reconnect
      if(myApp.device.os === 'android' || myApp.device.os === 'Android') {
    		
    		if(lastConnectionState !== callBleEventHandler.conStateIndex.DISCONNECTED) {
    			callBleBGEventHandler.notifyDevice_AppOnFG_android();
	    		callBleEventHandler.displaySubscription();		// June.07.2018 - Resume displaying Subscription
	    		callBleEventHandler.runAppTimer();						// June.11.2018 - Continue running
    		} else {

    			// What if it's disconnected somehow???

    		}
    		
    		
    	} else {
    		callBleEventHandler.disconnectDevice(callBleEventHandler.targetDeviceObj);

	      // Mar.19.2018 - When App BG then right after back to FG. Then 'startBLEProcess' is called twice
	      setTimeout(function () {
	        callBleEventHandler.startBLEProcess();
	      }, 5000);
    	}

      
    }, 0);
  }, false); 

	document.addEventListener("pause", () => {
   
    appBGFG = 7;
    clearInterval(callBleEventHandler.readRealtimeIntervalID);  // clear realtime in foreground
    clearInterval(callBleEventHandler.subscriptionTestInterval);
    callBleEventHandler.bgErrorStack = 0;       // Mar.16.2018 - keeps connect / disconnect issue tracker.
    clearInterval(callBleEventHandler.appTimerInterval); // Mar.16.2018 - Stop App Timer

		console.log('Background: ' + appBGFG);
    
    // When Device receives 7, it disconnects. 
    var lastConnectionState = callBleEventHandler.conState[callBleEventHandler.conState.length - 1]; 

    if(lastConnectionState !== callBleEventHandler.conStateIndex.DISCONNECTED) {
      
      // Apr.05.2018 - For android, we give options like, 'disconnect in BG', 'Always connected even in BG'
      
      if(myApp.device.os === 'android' || myApp.device.os === 'Android') {
      	/*
        BackgroundFetch.stop();

        BackgroundFetch.configure(bgFetchCallback, bgFailureCallback, {
          minimumFetchInterval: 15, // <-- default is 15
          stopOnTerminate: true,   // <-- Android only
          startOnBoot: false,        // <-- Android only
          forceReload: false         // <-- Android only
        });
    		*/
    		callBleBGEventHandler.notifyDevice_AppOnBG_android();

    		let timeStart = new Date().getTime();
    		bgTestingInterval = setInterval(() => {
    			let timeSurvived = parseInt((new Date().getTime() - timeStart) / 1000);
    			if((timeSurvived % 10) == 0) console.log('Time Survived: ' + timeSurvived + ' s...');
    		}, 2000);

      } else {
      	callBleBGEventHandler.notifyDevice_AppOnBG_iOS();
      }
    }
    
	}, false);

  var bgFetchCallback = function() {
    console.log('- BackgroundFetch event received');

    // For iOS, 30 seconds are allowed. Android?
    // finish() is called in scan timeout
    callBleEventHandler.startBGFetchEvent();

  };

  var bgFailureCallback = function(error) {
    console.log('- BackgroundFetch failed: ', error);
  };

  // Mar.07.2018 - This event will be fired when datalog notification started then done.
  document.addEventListener('datalogNotificationDone', () => {

    myApp.hidePreloader();
    myApp.modal({
      title: 'Datalog importing done',
      text: '',
      verticalButtons: true,
      buttons: [{
        text: 'Ok'
      }]
    });

  }, false);

}


