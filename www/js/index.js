// Rewritten in Jan.04.2018

// declare event handlers
var callClickHandler, mBLE, mBLEinBG, callAppEventHandler, callWeatherHandler;
var vBLE;

callClickHandler = new cClickEventHandler();
callAppEventHandler = new cAppEventHandler();
//mBLE = new cBleEventHandler();
mBLE = new mBLEHandler();			// June.21.2018 - Just changing to simpler name from 'callBleEventHandler'
mBLEinBG = new mBLEinBGHandler();
callWeatherHandler = new cWeatherDataHandler();
callDatalogHandler = new cDatalogHandler();
vBLE = new vBLEHandler();


// Global var
//var subscriptionTestInterval = 0;   // Feb.20.2018 - Added
var subscriptionDisplayListIndex = 0; // Feb.20.2018 - Added

var BackgroundFetch;  // Mar.08.2018 - Testing for background fetch event

var bgTestingInterval = 0;	// May.03.2018 - Testing for BG

var datalogNotificationDone = new CustomEvent('datalogNotificationDone'); // Mar.07.2018 - Added to track of datalog completed

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {

  console.log('\n********************\nDevice Ready' + '\n********************\n');

  mBLE.loadSkinEnv();
  vBLE.display_skinEnv(mBLE.currentSkintype, mBLE.currentEnvironment);
  
  // init events
  callClickHandler.init();

  callAppEventHandler.init();

  // For sunrise, sunset time
  // June.27.2018 - Now be sure to load all then start BLE process
  callAppEventHandler.call_geolocation()
  .then(() => {
  	return callWeatherHandler.calculateSuntimesFromMidnight();
  })
  .then(() => {
  	mBLE.startBLEProcess();
  })
  .catch((err) => {
  	console.log('[Error] ' + err);
  	myApp.modal({
      title: '',
      text: 'Failed to get Geolocation OR Weather Data. Reopen the app.',
      buttons: [
      	{
      		test: 'Ok'
      	}
      ]
    });
  });
  
  BackgroundFetch = window.BackgroundFetch;

  // For newer iOS, now uses this.
  // Whether its connected or not, disconnect then connect
  document.addEventListener("active", () => {

    mApp.setAppStatus('FG');

    console.log('Foreground (Active): ' + mApp.getAppStatus() + ', wait_then_connect_interval: ' + mBLE.wait_then_connect_interval);

    mBLE.disconnectDevice(mBLE.targetDeviceObj);

    // Mar.19.2018 - When App BG then right after back to FG. Then 'startBLEProcess' is called twice
    setTimeout(function () {
      mBLE.startBLEProcess();
    }, 5000);

  }, false);

  // For Android or older iOS
  document.addEventListener("resume", () => {
    setTimeout(function () {

      mApp.setAppStatus('FG');

      console.log('Foreground (Resume): ' + mApp.getAppStatus() + ', wait_then_connect_interval: ' + mBLE.wait_then_connect_interval);
      clearInterval(bgTestingInterval);

      // May.03.2018 - For Android, always gets connected
      // For iOS, disconnect then reconnect
      if(myApp.device.os === 'android' || myApp.device.os === 'Android') {
    		
    		if(mBLE.getConState() !== mBLE.conStateIndex.DISCONNECTED) {
    			mBLEinBG.notifyDevice_AppOnFG_android();
	    		mBLE.displaySubscription();		// June.07.2018 - Resume displaying Subscription
	    		mBLE.runAppTimer();						// June.11.2018 - Continue running
    		} else {

    			// What if it's disconnected somehow???

    		}
    		
    		
    	} else {
    		mBLE.disconnectDevice(mBLE.targetDeviceObj);

	      // Mar.19.2018 - When App BG then right after back to FG. Then 'startBLEProcess' is called twice
	      setTimeout(function () {
	        mBLE.startBLEProcess();
	      }, 5000);
    	}

      
    }, 0);
  }, false); 

	document.addEventListener("pause", () => {
   
    mApp.setAppStatus('BG');

    clearInterval(mBLE.readRealtimeIntervalID);  // clear realtime in foreground
    clearInterval(mBLE.subscriptionTestInterval);
    mBLE.bgErrorStack = 0;       // Mar.16.2018 - keeps connect / disconnect issue tracker.
    clearInterval(mBLE.appTimerInterval); // Mar.16.2018 - Stop App Timer

		console.log('Background: ' + mApp.getAppStatus());
    
    // When Device receives 7, it disconnects. 

    if(mBLE.getConState() !== mBLE.conStateIndex.DISCONNECTED) {
      
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
    		mBLEinBG.notifyDevice_AppOnBG_android();

    		let timeStart = new Date().getTime();
    		bgTestingInterval = setInterval(() => {
    			let timeSurvived = parseInt((new Date().getTime() - timeStart) / 1000);
    			if((timeSurvived % 10) == 0) console.log('Time Survived: ' + timeSurvived + ' s...');
    		}, 2000);

      } else {
      	mBLEinBG.notifyDevice_AppOnBG_iOS();
      }
    }
    
	}, false);

  var bgFetchCallback = function() {
    console.log('- BackgroundFetch event received');

    // For iOS, 30 seconds are allowed. Android?
    // finish() is called in scan timeout
    mBLE.startBGFetchEvent();

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


