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

var datalogNotificationDone = new CustomEvent('datalogNotificationDone'); // Mar.07.2018 - Added to track of datalog completed

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady(){

  console.log('\n********************\nDevice Ready' + '\n********************\n');

  callBleEventHandler.loadSkinEnv();
  callViewHandler.display_skinEnv(callBleEventHandler.currentSkintype, callBleEventHandler.currentEnvironment);
  
  // init events
  callClickHandler.init();

  callAppEventHandler.init();
  callAppEventHandler.call_geolocation(); // For sunrise, sunset time
  
  BackgroundFetch = window.BackgroundFetch;

  // For iOS, now uses this.
  document.addEventListener("active", () => {

    appBGFG = 8;
    console.log('Foreground (Active): ' + appBGFG + ', wait_then_connect_interval: ' + callBleEventHandler.wait_then_connect_interval);

    var lastConnectionState = callBleEventHandler.conState[callBleEventHandler.conState.length - 1]; 

    if(lastConnectionState !== callBleEventHandler.conStateIndex.DISCONNECTED) {
      callBleBGEventHandler.notifyDevice_AppOnFG();
    }

    callBleEventHandler.disconnectDevice(callBleEventHandler.targetDeviceObj);

    // Mar.19.2018 - When App BG then right after back to FG. Then 'startBLEProcess' is called twice
    //if(callBleEventHandler.wait_then_connect_interval == 0) {
      setTimeout(function () {
        callBleEventHandler.startBLEProcess();
      }, 4000);
    //}

  }, false);

  // For Android or older iOS
  document.addEventListener("resume", () => {
    setTimeout(function () {

      appBGFG = 8;
      console.log('Foreground (Resume): ' + appBGFG + ', wait_then_connect_interval: ' + callBleEventHandler.wait_then_connect_interval);

      var lastConnectionState = callBleEventHandler.conState[callBleEventHandler.conState.length - 1]; 

      if(lastConnectionState !== callBleEventHandler.conStateIndex.DISCONNECTED) {
        callBleBGEventHandler.notifyDevice_AppOnFG();
      }

      callBleEventHandler.disconnectDevice(callBleEventHandler.targetDeviceObj);

      // Mar.19.2018 - When App BG then right after back to FG. Then 'startBLEProcess' is called twice
      //if(callBleEventHandler.wait_then_connect_interval == 0) {
        setTimeout(function () {
          callBleEventHandler.startBLEProcess();
        }, 4000);
      //}

      if(myApp.device.os === 'android' || myApp.device.os === 'Android') {
        BackgroundFetch.stop();
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
      callBleBGEventHandler.notifyDevice_AppOnBG();
      if(myApp.device.os === 'android' || myApp.device.os === 'Android') {

        BackgroundFetch.stop();

        BackgroundFetch.configure(bgFetchCallback, bgFailureCallback, {
          minimumFetchInterval: 15, // <-- default is 15
          stopOnTerminate: true,   // <-- Android only
          startOnBoot: false,        // <-- Android only
          forceReload: false         // <-- Android only
        });
    
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


