/*
	Scan with UUID <-- Important!
	Android: When list is empty, it scans for 'empty' uuid
	iOS: When list is empty, it scans for everything

	Mar.05.2018, Mar.09.2018
	When App connects device for the very first time:
	- saves device Object. This Address is default address
	When App FG to BG:
	- Device disconnects from app. App must try to connect to 'Default Address'
	When App BG to FG:
	- Scan again, connect whatever the 'Name matches' with device object name.
	For iOS in BG:
	- Stay in connecting state until it gets connected to 'Default address'
	For Android in BG:
	- Run Job Scheduler(Background task plugin) to run BLE tasks every 15 min.

	Issue:
	- Because its keep switching between addresses, in ios, this message might appear,
	'[CoreBluetooth] API MISUSE: Cancelling connection for unused peripheral , Did you forget to keep a reference to it?'
	
	June.11.2018 - Removed all ttb_uv1 methods. Don't need it.

	June.27.2018 - Reference
	https://android.jlelse.eu/lessons-for-first-time-android-bluetooth-le-developers-i-learned-the-hard-way-fee07646624

*/

function mBLEHandler() {

	this.restUUID = adds.restUUID;

	this.serviceUUID = adds.serviceUUID + this.restUUID;
	this.serviceUUID2 = adds.serviceUUID2 + this.restUUID;	// old one

	var conState = []; 
	this.conStateIndex = {
		SCANNING: 'SCANNING',
		CONNECTING: 'CONNECTING',
		CONNECTED: 'CONNECTED',
		DISCONNECTED: 'DISCONNECTED'
	}
	this.setConState = function (connectionStateString) {		// June.21.2018 - Picking up the latest connection state
		if(conState.length > 50) conState = [];		// clear if too many
		conState.push(connectionStateString);
	}
	this.getConState = function () {		// June.21.2018 - Picking up the latest connection state
		return conState[conState.length - 1];
	}
	
	this.subscriptionOpened = 0;	// to open subscription just once. 

	this.userState = [];
	this.userStateIndex = {
		ENTER_PASSWORD: 'ENTER_PASSWORD',
		ENTER_PASSWORD_DONE: 'ENTER_PASSWORD_DONE',
		SIGNAL_FG: 'SIGNAL_FG',
		SIGNAL_FG_DONE: 'SIGNAL_FG_DONE',
		SIGNAL_BG: 'SIGNAL_BG',
		SIGNAL_BG_DONE: 'SIGNAL_BG_DONE',
		WRITING: 'WRITING',
		WRITE_DONE: 'WRITE_DONE',
		READING: 'READING',
		READ_DONE: 'READ_DONE',
		SUB_DONE: 'SUB_DONE'
	}
	
	// Mar.16.2018 - backgroundError handling
	// app's default address is not actual default address -> background error happens 
	// (connects -> disconnects -> repeat)
	this.bgErrorStack = 0;

	this.scanTimeoutInterval = 0;

	this.scannedDeviceArr = [];

	this.targetDeviceObj;

	this.currentEnvironment = 0;
	this.currentSkintype = 0;
	this.prevEnvironment = 0;
	this.prevSkintype = 0;

	this.initialRealTimeReadingInterval = 2000;

	// Seconds until midnight 
	this.secondsUntilMidnight = 0;

	// check whether battery is replaced 
	this.firstTimeSinceBattery = 0;

	// setInterval IDs
	this.readRealtimeIntervalID = 0;
	this.subscriptionTestInterval = 0;
	this.connectingStateDurationInterval = 0;

	// Entire Notification Data array
	this.notificationDataDone = 0;			// For checking notification is done
	this.notificationDataCollected = [];
	this.notificationDataAnalyzed = [];		// after all calculation

	// Previously notification data collected time
	this.notificationDataCollectedTime = 0;
	this.notificationDataCollectedTimePrev = 0;

	// For Testing Battery, keep bettery data when connected
	this.batteryTestingData = [];
	this.batteryTestingData_fileName = dVar.batteryTestingData_fileName;
	this.batteryTestingData_emailTo = dVar.batteryTestingData_emailTo

	// DataLog export
	this.createCSVDataString_fileName = dVar.createCSVDataString_fileName;
	this.createCSVDataString_emailTo = dVar.createCSVDataString_emailTo;
	this.createCSVDataString_raw_fileName = dVar.createCSVDataString_raw_fileName;

	// Interval that checks how long it takes to connect
	this.connectionWaitingInterval = 0;

	// clearTimeout for wait then connect. (to prevent duplicates)
	this.wait_then_connect_interval = 0;

	// 'checkFirstTimeSinceBattery' function
	this.checkFirstTimeSinceBattery_service = adds.checkFirstTimeSinceBattery_service + this.restUUID;
	this.checkFirstTimeSinceBattery_char = adds.checkFirstTimeSinceBattery_char + this.restUUID;

	// 'writeSecondsUntilMidnight'
	this.writeSecondsUntilMidnight_service = adds.writeSecondsUntilMidnight_service + this.restUUID;
	this.writeSecondsUntilMidnight_char = adds.writeSecondsUntilMidnight_char + this.restUUID; 

	// 'writeSecondsUntilSunRise, Sunset'
	this.writeSecondsUntilSuntime_service = adds.writeSecondsUntilSuntime_service + this.restUUID;
	this.writeSecondsUntilSunrise_char = adds.writeSecondsUntilSunrise_char + this.restUUID; 
	this.writeSecondsUntilSunset_char = adds.writeSecondsUntilSunset_char + this.restUUID; 

	// 'writeTTB'
	this.writeTTB_service = adds.writeTTB_service + this.restUUID;
	this.writeTTB_char = adds.writeTTB_char + this.restUUID;

	// 'startReadRealtime'
	this.startReadRealtime_service1 = adds.startReadRealtime_service1 + this.restUUID;	
	this.startReadRealtime_service2 = adds.startReadRealtime_service2 + this.restUUID;
	this.startReadRealtime_char1 = adds.startReadRealtime_char1 + this.restUUID;		
	this.startReadRealtime_char2 = adds.startReadRealtime_char2 + this.restUUID;		
	this.startReadRealtime_char3 = adds.startReadRealtime_char3 + this.restUUID;		
	this.startReadRealtime_char4 = adds.startReadRealtime_char4 + this.restUUID;		
	this.startReadRealtime_char5 = adds.startReadRealtime_char5 + this.restUUID;		
	this.startReadRealtime_char6 = adds.startReadRealtime_char6 + this.restUUID;
	this.startReadRealtime_char7 = adds.startReadRealtime_char7 + this.restUUID;
	this.startReadRealtime_char8 = adds.startReadRealtime_char8 + this.restUUID;
	this.startReadRealtime_char9 = adds.startReadRealtime_char9 + this.restUUID;		
	this.startReadRealtime_char10 = adds.startReadRealtime_char10 + this.restUUID;
	this.startReadRealtime_char11 = adds.startReadRealtime_char11 + this.restUUID;
	this.startReadRealtime_char12 = adds.startReadRealtime_char12 + this.restUUID;		
	this.startReadRealtime_char13 = adds.startReadRealtime_char13 + this.restUUID;
	this.startReadRealtime_char14 = adds.startReadRealtime_char14 + this.restUUID;
	this.startReadRealtime_char15 = adds.startReadRealtime_char15 + this.restUUID;		
	this.startReadRealtime_char16 = adds.startReadRealtime_char16 + this.restUUID;
	this.startReadRealtime_char17 = adds.startReadRealtime_char17 + this.restUUID;

	// 'startReset'
	this.resetTTB_service = adds.resetTTB_service + this.restUUID;
	this.resetTTB_char = adds.resetTTB_char + this.restUUID;

	// 'startNotification'
	this.startNotification_service = adds.startNotification_service + this.restUUID;
	this.startNotification_char1 = adds.startNotification_char1 + this.restUUID;
	this.startNotification_char2 = adds.startNotification_char2 + this.restUUID;

	// 'startSendingBytes'
	this.startSendingBytes_service = adds.startSendingBytes_service + this.restUUID 
	this.startSendingBytes_char = adds.startSendingBytes_char + this.restUUID;

	// 'startUVChange'
	this.startUVChange_service = adds.startUVChange_service + this.restUUID; 
	this.startUVChange_char = adds.startUVChange_char + this.restUUID;

	// 'startOTA'
	this.startOTA_service = adds.startOTA_service + this.restUUID;
	this.startOTA_char = adds.startOTA_char + this.restUUID;

	// Feb.14.2018 - Testing for notification
	this.notificationTester_service = adds.notificationTester_service + this.restUUID;
	this.notificationTester_char1 = adds.notificationTester_char1 + this.restUUID;			// UV
	this.notificationTester_char2 = adds.notificationTester_char2 + this.restUUID;			// Temp
	this.notificationTester_char3 = adds.notificationTester_char3 + this.restUUID;			// Battery
	this.notificationTester_char4 = adds.notificationTester_char4 + this.restUUID;			// TTB
	this.notificationTester_char5 = adds.notificationTester_char5 + this.restUUID;			// Sunscreen
	this.notificationTester_char7 = adds.notificationTester_char7 + this.restUUID;

	// Feb.21.2018 - For custom password
	this.customPassword_service = adds.customPassword_service + this.restUUID;
	this.customPassword_char = adds.customPassword_char + this.restUUID;
	this.userPassword = dVar.sampleUserPassword;

	// Mar.09.2018 - Android Error counter
	// Counts how many errors occur in connection process -> if too many, reset then try
	this.androidErrorCounter = [];

	// Mar.16.2018 - Display time in app testing
	this.uv_fromDevice = 0;
	this.ttb_fromDevice = 0;
	this.ss_fromDevice = 0;
	//this.ss_applied_signal = false;		// Mar.29.2018 - For 'run a function only ONCE when SS is applied'

	// Mar.16.2018 - App timer interval
	this.appTimerInterval = 0;

	// Mar.19.2018 - Keep track of UV changes
	// Why? Device Doesn't give me calculated value. Since it's connected, I need to keep track of UV 
	// and calculate by myself.
	this.uvTrackerArr = [];
	this.ttbFactorBy1 = 0;	// Value of TTB when UV 1. Use this factor to calculate when UV changed
	this.deviceShaken = 0;	// In device, TTB starts counting only when device is shaken. Keep track of it.
	// Mar.20.2018 - Keep Track of initial TTB for 'recalculating'
	// Push when UV / Skin / Environment changes
	this.initTTBTrackArr = [];

	this.infiniteWritingTestStart = false;

	// June.07.2018 - Global to make BG -> FG work
	this.subscriptionDataArrCurr = [];
	this.subscriptionDataArrPrev = [];

	// June.11.2018 - Track if TTB is over. It'll be reset when reset TTB or SS.
	this.ttbIsOver = false;

	// June.27.2018 - Write number counter. 
	this.writeCounter = 0;

}

mBLEHandler.prototype = {

	/* ===========================================================================
	Scanning Or Connect?
	=========================================================================== */
	startBLEProcess: function () {
		var t = this;
		// Check to just connect or scan
		var deviceInfoString = localStorage["deviceMacAddress"];

		// Apr.17.2018 - Name is primary source for connection in Fourground. <-- important!
		// May.03.2018 - deviceMacAddress will be used only for reconnection (if possible)
		// and will be replaced when 'First Time since battery data' is right. (Check below)
		var defaultName = localStorage["deviceName"]		

		t.bgErrorStack = 0;

		this.loadPassword();		// Feb.21.2018 - load password implemented

		evothings.ble.stopScan();
		t.setConState(t.conStateIndex.DISCONNECTED);

		// Apr.05.2018 - For androids, we can simply reconnect if it was connected before. 
		if(myApp.device.os === 'android' || myApp.device.os === 'Android') {

			console.log('START BLE PROCESS: ' + ((t.targetDeviceObj) ? JSON.stringify(t.targetDeviceObj) : 'No Device Data'))

			if(t.targetDeviceObj) {

				t.startConnecting(t.targetDeviceObj);

			} else {
				
				if(deviceInfoString && deviceInfoString !== '') {	// Device info exists, lets directly connect

					var deviceObj = JSON.parse(deviceInfoString);

					// Mar.22.2018 - Display pre-stored device object
					vBLE.display_saved_device_address(deviceObj.address);
					if(defaultName && defaultName !== '') vBLE.display_deviceName(defaultName);
					else vBLE.display_deviceName(deviceObj.name);


					vBLE.ble_status_msg('#BLE-Status', 'Connecting to saved device: ' + deviceObj.name + ' [' + deviceObj.address + ']');
					console.log('Connecting to saved device: ' + deviceObj.name + ' [' + deviceObj.address + ']');

					t.startConnecting(deviceObj);

				} else {

					// Mar.22.2018 - Display nothing
					vBLE.display_saved_device_address('');
					vBLE.display_deviceName('');

					t.setConState(t.conStateIndex.SCANNING);
					t.startScanning();
				}
				
			}

		} else {

			t.setConState(t.conStateIndex.SCANNING);

			if(deviceInfoString && deviceInfoString !== '') {
				var deviceObj = JSON.parse(deviceInfoString);
				vBLE.display_saved_device_address(deviceObj.address);
			}

			if(defaultName && defaultName !== '') {

				vBLE.display_deviceName(defaultName);

				t.startScanThenConnect(defaultName);

			} else {
				
				t.startScanning();

			}



		}
		
		
	},

	/* ===========================================================================
	Scanning then connect
	Jan.11.2018 - Added for 'automatic connection' and 'connect even system already connected'
	=========================================================================== */
	startScanThenConnect: function (deviceName) {

		var t = this;
		var bleStatus = 'SCANNING';

		vBLE.ble_status_msg('#BLE-Status', 'Scan and connect Started');
		//console.log('Scan and connect Started... Target: ' + deviceName);

		var scanFoundFcn = function (device) {
			evothings.ble.stopScan();
			t.setConState(t.conStateIndex.DISCONNECTED);

			bleStatus = 'CONNECTING';

			t.startConnecting(device);
		}

		evothings.ble.startScan(function(device) {

			console.log('\n[Scan for Existing] Device Found: \n' + JSON.stringify(device));

			if(device !== null && device.hasOwnProperty('name')) {

				console.log('[Scan for Existing] Device Found: ' + device.name + ', ' + device.address);

				// May.03.2018 - For iOS (Sometimes name can be different from 'name' property)
				if(t.getDeviceName(device) === deviceName) { 
					scanFoundFcn(device);
				}

			}

		}, function(err){
      console.log('Error while Scanning...');
	  }, { serviceUUIDs: [t.serviceUUID] });  // t.serviceUUID

	},

	/* ===========================================================================
	Scanning then display list of scanned
	=========================================================================== */
	startScanning: function () {
		
		// Scan -> Stop -> display scanned devices
		vBLE.ble_status_msg('#BLE-Status', 'Scanning Started');
		console.log('Scanning Started...');

		this.scanDevices();	
		this.scanTimeout(6000);

	},

	// Scan then return array of list
	scanDevices: function () {

		var t = this;
		
		evothings.ble.stopScan();
		t.setConState(t.conStateIndex.DISCONNECTED);

		t.scannedDeviceArr = [];		// empty list

		evothings.ble.startScan(function(device) {

			var deviceName;
	    if(device !== null) {

	    	deviceName = t.getDeviceName(device);
	    	console.log('[Scan for New] Device Found: ' + deviceName);

	    	// check if already in the list
        var listChecker = t.scannedDeviceArr.find((element) => {
        	return t.getDeviceName(element) === deviceName;
        });

        //console.log('Filtered List: ' + JSON.stringify(listChecker));

        if(listChecker) {
          console.log(deviceName + ' already exists. Not pushing...');
        } else {
          console.log(deviceName + ' is pushed...');
          t.scannedDeviceArr.push(device);
        }
	    	
      }

    }, function(err){
      console.log('Error while Scanning...: ' + err);
	  }, { serviceUUIDs: [t.serviceUUID] });  

	},

	scanTimeout: function (timeoutDuration) {

		var t = this;

		clearTimeout(t.scanTimeoutInterval);

		t.scanTimeoutInterval = setTimeout(function() {

			evothings.ble.stopScan();
			t.setConState(t.conStateIndex.DISCONNECTED);

			if(t.scannedDeviceArr.length > 0) {

				function clickEvent(deviceInfo) {
	        return function() {
	        	// June.27.2018 - Resolves, 
	        	//		For Android, First time connecting, user selected one device but if failos to connect, it'll reconnect
	        	t.targetDeviceObj = deviceInfo;		
	        	console.log('Saving Device info: ' + JSON.stringify(t.targetDeviceObj));

	          t.startConnecting(deviceInfo);
	        }
	      }

	      var modalButtons = [];

        // Create buttons
        for(var i = 0; i < t.scannedDeviceArr.length; i++) {
          modalButtons.push({
            text: t.getDeviceName(t.scannedDeviceArr[i]),
            onClick: clickEvent(t.scannedDeviceArr[i])
          });
        }

        // Add cancel button at the end
        modalButtons.push({
          text: 'Cancel'
        });

        myApp.modal({
          title: 'Which device would you like to connect?',
          text: 'Current Password: ' + t.userPassword,
          verticalButtons: true,
          buttons: modalButtons
        }); 

			} else {
				vBLE.ble_status_msg('#BLE-Status', 'No device Found');
			}

		}, timeoutDuration);

	},

	/* ===========================================================================
	Scanning in Background Fetch event (Mar.08.2018)
	Start scanning for 'Default Device Address' then connect. If timeout, ignore.
	=========================================================================== */
	startBGFetchEvent: function () {
		var t = this;

		var timeLimit = 60 * 1000;
		var defaultAddress = JSON.parse(localStorage["deviceMacAddress"]);
		var defaultName = JSON.parse(localStorage["deviceName"]);		// Name is primary source for connection in Fourground.

		console.log('Scanning Started for BG Fetch... [ ' + defaultAddress.address + ' ]');

		// Set Timeout then when it's over, stop scanning then run finish
		setTimeout(() => {
			evothings.ble.stopScan();
			t.setConState(t.conStateIndex.DISCONNECTED);
			BackgroundFetch.finish(); // <---- important!
			console.log('BG Fetch Scan is timedout and finish called...');
		}, timeLimit);

		evothings.ble.startScan(function(device) {

	    if(device !== null && device.hasOwnProperty('address') && device.hasOwnProperty('name')) {

	    	console.log('[Scan for BG Fetch] Device Found: ' + device.address);

	    	var defaultAddress = JSON.parse(localStorage["deviceMacAddress"]);
	    	if(device.address === defaultAddress.address) {
	    		evothings.ble.stopScan();
	    		t.setConState(t.conStateIndex.DISCONNECTED);
	    		t.startConnecting(device);
	    	}
	    	
      }

    }, function(err){
      console.log('Error while Scanning for BG fetch...: ' + err);
	  }, { serviceUUIDs: [t.serviceUUID] });

	},

	/* ===========================================================================
	Connecting Process
	=========================================================================== */
	startConnecting: function (deviceObj) {

		var t = this;

		if(t.getConState() === t.conStateIndex.DISCONNECTED) {
			t.setConState(t.conStateIndex.CONNECTING); // connecting

			console.log('\n============================================================' +
									'\n Connecting to ' + t.getDeviceName(deviceObj) + '...' +
									'\nTarget address: ' + deviceObj.address +
									'\nDefault: ' + ((localStorage["deviceMacAddress"]) ? JSON.parse(localStorage["deviceMacAddress"]).address : 'DNE') +
									//'\nActivity Track: ' + t.conState + 
									'\n============================================================\n');

			vBLE.ble_status_msg('#BLE-Status', 'Connecting to ' + t.getDeviceName(deviceObj) + '<br>' + deviceObj.address);

			// Save into Local
	    if(deviceObj.hasOwnProperty('address'))
	      //localStorage["deviceMacAddress"] = JSON.stringify(deviceObj);		// save entire info of device

			// Add functions to call after connect
			// June.27.2018 - Give a small time. Some say it resolved issue with 133 <-- Not working
			//		https://github.com/googlesamples/android-BluetoothLeGatt/issues/44
			setTimeout(() => { t.connectDevice(deviceObj); }, 500);

		}
		
		
	},

	connectDevice: function (deviceObj) {

		var t = this;

		myApp.showPreloader('Connecting...');

		// Jan.29.2018 - For testing purpose, set discoverServices and serviceUUIDs
		evothings.ble.connectToDevice(deviceObj, function(){

			clearInterval(t.connectionWaitingInterval);
			clearInterval(t.connectingStateDurationInterval);
			myApp.hidePreloader();
			setTimeout(() => { myApp.closeModal(); }, 1000);
			
			t.device_state_connected(deviceObj);

		}, function(){

			clearInterval(t.connectionWaitingInterval);
			myApp.hidePreloader();
			setTimeout(() => { myApp.closeModal(); }, 1000);
			
			t.device_state_disconnected(deviceObj);

		}, function(err){

			clearInterval(t.connectionWaitingInterval);
			myApp.hidePreloader();
			setTimeout(() => { myApp.closeModal(); }, 1000);
		
			t.device_state_error(err, deviceObj);

		}, { discoverServices: true });

	},

	device_state_connected: function (deviceObj) {

		var t = this;

		t.androidErrorCounter = [];

		// Global use
		t.targetDeviceObj = deviceObj;

		t.setConState(t.conStateIndex.CONNECTED);

		// Save into Local if device info has full list of services and chars
		// Save it only once!
		// Save only when app is on Foreground. 

		// Apr.17.2018 - Not Save in any case EXCEPT when 'First Time' subscription is received 
		// When BG, connection rely on Address. 
		if(!localStorage["deviceName"] && deviceObj.hasOwnProperty('services')) {

			// May.03.2018 - For iOS, use local name
			localStorage["deviceName"] = t.getDeviceName(deviceObj);
			vBLE.display_deviceName(t.getDeviceName(deviceObj)); 

			

    	myApp.modal({
        title: 'Default Name Saved!',
        text: t.getDeviceName(deviceObj),
        buttons: [{text: 'Ok'}]
      }); 
		}
		
    
    console.log('\n============================================================' +
								'\n Connected!! \n' + t.getDeviceName(t.targetDeviceObj) + 
								'\nConnected to: ' + t.targetDeviceObj.address +
								'\nDefault: ' + ((localStorage["deviceMacAddress"]) ? JSON.parse(localStorage["deviceMacAddress"]).address : 'DNE') +
								//'\nActivity Track: ' + t.conState + 
								'\n============================================================\n');
    
    cordova.plugins.notification.local.schedule({
			id: 9,
			title: 'Connected',
			text: 'Connected to Device'
		});
		

		vBLE.ble_status_msg('#BLE-Status', t.getDeviceName(deviceObj) + ' Connected! ' + '<br>' + deviceObj.address);
		vBLE.display_connected_device_address(deviceObj.address);
		
		// June.01.2018 - A bit of delay for Android
		//setTimeout(() => { t.initAfterConnected(); }, 1000);

	},

	device_state_disconnected: function (deviceObj) {
		
		this.device_state_disconnected_event(deviceObj);

	},

	device_state_error: function (err, deviceObj) {
		var t = this;

		console.log('**** Connection Error: [ ' + err + ' ]');
		vBLE.ble_status_msg('#BLE-Status', 'Error ' + err);
		//t.androidErrorCounter.push(err);

		// Error: 8, 19, 22, 133, 257
		// 8 - BLE_HCI_CONNECTION_TIMEOUT
		// 19 - BLE_HCI_REMOTE_USER_TERMINATED_CONNECTION (Remote device has forced a disconnect.)
		// 22 - BLE_HCI_LOCAL_HOST_TERMINATED_CONNECTION
		// 133 - common error caused by multiple reasons
		// 257 - When this occurs, BLE unable to scan, connect
		// In this case, when password is not correct, error 19 occurs
		// Mar.09.2018 - Since we decided to use JobScheduler for Android, 
		// make complete disconnection. It'll start from scanning every 15 min.
		// But for error msg 257, reset needed.
		if(myApp.device.os === 'android' || myApp.device.os === 'Android') {
		
			if(err == 8) {
				t.wait_then_connect(deviceObj);
			} else if(err == 19) {
				//t.disconnectDevice(deviceObj);
				t.wait_then_connect(deviceObj);
			} else if(err == 133) {

				evothings.ble.reset();				// For testing

				if(mApp.checkAppStatus('BG')) {
					//t.startBGFetchEvent(deviceObj);
					t.wait_then_connect(deviceObj);
				}
				else t.wait_then_connect(deviceObj);

			} else if(err == 257) {
				
				if(mApp.checkAppStatus('BG')) {
					BackgroundFetch.stop();

	        var bgFetchCallback = function() {
				    console.log('- BackgroundFetch event received');

				    // For iOS, 30 seconds are allowed. Android?
				    // finish() is called in scan timeout
				    t.startBGFetchEvent();

				  };

				  var bgFailureCallback = function(error) {
				    console.log('- BackgroundFetch failed: ', error);
				  };

				  BackgroundFetch.configure(bgFetchCallback, bgFailureCallback, {
	          minimumFetchInterval: 15, // <-- default is 15
	          stopOnTerminate: true,   // <-- Android only
	          startOnBoot: false,        // <-- Android only
	          forceReload: false         // <-- Android only
	        });

				} else {
					// Mar.09.2018 - BLE unable to scan or connect in this error. Reset it.
					// Jun.01.2018 - For testing purpose, Reset BLE then reconnect
					evothings.ble.reset();				
					setTimeout(() => { t.wait_then_connect(deviceObj); }, 5000);
				}

			} else {
				if(mApp.checkAppStatus('FG')) t.startConnecting(deviceObj);	
				else {
					t.disconnectDevice(deviceObj);
				}
			}
			
		} else {
			if(err === 'device already connected.') {

				// Mar.06.2018 - Issue:
				// BLE connection cycle -> App FG -> BG is good for one cycle. If another cycle happens, 'device already connected' happens.
				// Means, its not going to create another peripheral object. Thats all. 
				// if in connecting state, it'll stay connecting. <--- !!!!

			} else {
				t.wait_then_connect(deviceObj);
			}
		} 
		
		

	},

	// Mar.07.2018 - Became a separate function for Android. (<- falls into Error 19)
	device_state_disconnected_event: function (deviceObj) {

		var t = this;
		console.log('\n============================================================' +
								'\n Disconnected!! ' + deviceObj.name +
								'\nDisconnected From: ' + deviceObj.address +
								'\nDefault: ' + ((localStorage["deviceMacAddress"]) ? JSON.parse(localStorage["deviceMacAddress"]).address : 'DNE') + 
								//'\nActivity Track: ' + t.conState + 
								'\n============================================================\n');
		
		cordova.plugins.notification.local.schedule({
			id: 9,
			title: 'Disconnected',
			text: 'Disconnected to Device'
		});

		vBLE.ble_status_msg('#BLE-Status', 'Disconnected...');
		vBLE.display_connected_device_address('');	// MAr.22.2018 - Empty

		t.setConState(t.conStateIndex.DISCONNECTED);

		clearInterval(t.readRealtimeIntervalID);
		clearInterval(t.subscriptionTestInterval);
		clearInterval(t.appTimerInterval);
		t.uvTrackerArr = [];		// Mar.19.2018 - Calculate TTB 
		t.ttbFactorBy1 = 0;
		t.initTTBTrackArr = [];	// Mar.21.2018 - calculate TTB

		// Feb.21.2018 - Reconnect only if password was entered correctly
		// Last thing it did was entering password -> then disconnected -> password wrong. -> don't reconnect
		// OR
		// Never READ_DONE (or other event) happened -> something's wrong -> don't reconnect
		var everWorked = t.userState.find(function(el){
			// Check if Reading was done. (Expecting 'Time since battery' reading)
			// Not writing or subscription done. Because they can happen before disconnection.
			return (el === t.userStateIndex.READ_DONE);			
		});
		/*
		console.log('\n============================================================' +
								'\nUser State Track: [ ' + t.userState + ' ]' +
								'\n============================================================\n');
		*/

		console.log('\n============================================================' +
								'\nUser State Length: ' + t.userState.length +
								'\nLatest User State : [ ' + t.userState[t.userState.length - 1] + ' ]' + 
								'\nEver READ DONE? [ ' + everWorked + ' ]' +
								'\nApp on FG / BG: ' + mApp.getAppStatus() +
								'\n============================================================\n');

		// Mar.16.2018 - Dealing more cases
		if(t.userState.length > 0 && (t.userState[t.userState.length - 1] === t.userStateIndex.ENTER_PASSWORD_DONE) && mApp.checkAppStatus('FG')) {
			
			t.disconnectDevice(deviceObj);

			myApp.modal({
	      title: 'Password incorrect',
	      text: '',
	      verticalButtons: true,
	      buttons: [{
	        text: 'Ok'
	      }]
	    }); 

		} else if(t.userState.length > 0 && (t.userState[t.userState.length - 1] === t.userStateIndex.SIGNAL_FG_DONE) && mApp.checkAppStatus('BG')) {

			// Mar.16.2018 - For Background Error
			// Because default address is not correct in app, in BG, it keeps connect / disconnect
			console.log('Background Error Stack Number: ' + t.bgErrorStack);

			t.bgErrorStack++;

			// When  connect - > disconnect keep happening, don't try to connect
			if(t.bgErrorStack > 2) {

				t.disconnectDevice(deviceObj);

				cordova.plugins.notification.local.schedule({
					id: 10,
					title: 'Warning!',
					text: 'You need to reset both App AND device.'
				});

				t.bgErrorStack = 0;

			} else {
				// For ios, we need this. 
				vBLE.ble_status_msg('#BLE-Status', 'Disconnected. Reconnecting...');
				vBLE.display_tester_deviceStatus('Disconnected. Reconnecting...');

				t.wait_then_connect(deviceObj);
			}

		} else {

			// For ios, we need this. 
			vBLE.ble_status_msg('#BLE-Status', 'Disconnected. Reconnecting...');
			vBLE.display_tester_deviceStatus('Disconnected. Reconnecting...');

			t.wait_then_connect(deviceObj);

		}
		
	},

	wait_then_connect: function (deviceObj) {
		var t = this;

		clearInterval(t.readRealtimeIntervalID);
		clearInterval(t.subscriptionTestInterval);
		clearTimeout(t.wait_then_connect_interval);

		var waitForDisconnectionTime = 6000; 
		if(mApp.checkAppStatus('BG')) {
			// in BG, iOS should wait shorter because otherwise app gets suspended. (~4000 ms)
			// Android should wait longer because otherwise ble functions get ruined with error 257
			// (Unable to scan, connect, etc)
			if(myApp.device.os === 'android' || myApp.device.os === 'Android') waitForDisconnectionTime = 6000;  
			else waitForDisconnectionTime = 10000; 
		}	
		
		t.disconnectDevice(deviceObj);

		// Mar.06.2018 - On BG, start connecting to default address,
		// on FG, start scan for unlimited time until it finds device or certain conditions are met.
		t.wait_then_connect_interval = setTimeout(() => {
			clearTimeout(t.wait_then_connect_interval);
    	if(mApp.checkAppStatus('BG')) {

    		// Apr.17.2018 - If current device name is different, don't connect
    		var defaultDeviceName = localStorage["deviceName"];
    		if(defaultDeviceName && defaultDeviceName !== '') {
    			var deviceObj = JSON.parse(localStorage["deviceMacAddress"]);
    			if(defaultDeviceName === deviceObj.name) t.startConnecting(deviceObj);	// try connect to default address <--!!!
    		}
    		
    	} else {
    		t.startBLEProcess();	// timeout is removed. It'll run forever until it finds one. ONLY in Freground!! 
    	}
    }, waitForDisconnectionTime);

	},

	/* ===========================================================================
	Disconnect
	=========================================================================== */
	disconnectDevice: function (deviceObj) {

		var t = this;

		//t.targetDeviceObj = undefined; // May.03.2018 - Reset completely
		clearInterval(t.readRealtimeIntervalID);
		clearInterval(t.subscriptionTestInterval);
		clearInterval(t.appTimerInterval);
		t.uvTrackerArr = [];		// Mar.19.2018 - Calculate TTB 
		t.ttbFactorBy1 = 0;
		t.initTTBTrackArr = [];	// Mar.21.2018 - calculate TTB

		evothings.ble.stopScan();
		t.setConState(t.conStateIndex.DISCONNECTED);
		if(deviceObj) evothings.ble.close(deviceObj);
		// Be sure to disconnect default address too. (Somehow it doesn't clear peripheral for default address)
		if(localStorage["deviceMacAddress"]) evothings.ble.close(JSON.parse(localStorage["deviceMacAddress"]));

		vBLE.ble_status_msg('#BLE-Status', 'Disconnecting...');
		vBLE.display_tester_deviceStatus('Disconnected');
		vBLE.display_connected_device_address('');	// Mar.22.2018

		vBLE.display_subscription_disconnectionState()	// June.07.2018 - Display disconnected state on subscription
		console.log('Disconnecting ');
		myApp.closeModal();
		/*
		cordova.plugins.notification.local.schedule({
			id: 9,
			title: 'Disconnected',
			text: 'Disconnected to Device (from disconnectDevice)'
		});
		*/
    
	},

	/* ===========================================================================
	Read Characteristic
	=========================================================================== */
	readValue: function (characteristic, expectDataType) {

		var t = this;

		t.userState.push(t.userStateIndex.READING);

		return new Promise(function(resolve, reject) {
			if(t.targetDeviceObj && t.getConState() === t.conStateIndex.CONNECTED) {
				evothings.ble.readCharacteristic(t.targetDeviceObj, characteristic, function(data){

					var dataTranslated = t.dataTranslation(data, expectDataType);
					t.userState.push(t.userStateIndex.READ_DONE);
		      resolve(dataTranslated);

		    }, function(err){
		    	console.log('Error Reading: ' + err);
		    	reject('Error Reading: ' + err);
		    });
			} else {
				reject('[Err Read] No Device info or not connected: [state: ' + t.getConState() + ']');
			}
		});
		
	},

	dataTranslation: function (data, expectDataType) {
		switch(expectDataType) {
			case 'Uint8':
				return new Uint8Array(data);
			break;
			case 'Uint16':
				return new Uint16Array(data);
			break;
			case 'Uint32':
				return new Uint32Array(data);
			break;
			case 'Int16':
				return new Int16Array(data);
			break;
			case 'Int8':
				return new Int8Array(data);
			break;
			case 'Int32':
				return new Int32Array(data);
			break;
			default:
				return data;
			break;
		}
	},

	/* ===========================================================================
	Write Characteristic
	=========================================================================== */
	writeValue: function (characteristic, data) {
		var t = this;

		t.userState.push(t.userStateIndex.WRITING);

		return new Promise(function(resolve, reject) {
			if(t.targetDeviceObj && t.getConState() === t.conStateIndex.CONNECTED) {
				evothings.ble.writeCharacteristic(t.targetDeviceObj, characteristic, data, function(){

					console.log('Success Writing: ' + data);
					t.userState.push(t.userStateIndex.WRITE_DONE + '[' + data + ']');

		      resolve(data);

		    }, function(err){
		    	console.log('Error Writing: ' + err);
		    	reject('Error Writing: ' + err);
		    });
			} else {
				reject('[Err Write '+ data +'] No Device info or not connected');
			}
		});
	},

	/* ===========================================================================
	Time since battery replaced
	=========================================================================== */
	checkFirstTimeSinceBattery: function () {

		var t = this;

		var serviceAddress1 = t.checkFirstTimeSinceBattery_service;  
    var characteristicsAddress1 = t.checkFirstTimeSinceBattery_char;  

    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);

    // Wait a bit then call twice
    t.readValue(characteristics1, 'Uint8')
    .delay(1000)
    .then(function(val){
    	console.log('First Time Connection Data 1: ' + val + ', Data: ' + JSON.stringify(val));
    	return t.readValue(characteristics1, 'Uint8');
    })
    .then(function(val){
    	console.log('First Time Connection Data 2: ' + val + ', Data: ' + JSON.stringify(val));
    	t.firstTimeSinceBattery = val;
      vBLE.ble_status_msg('#BLE-Status', 'Time since battery value (2nd Trial): ' + val);
    })
    .catch(function(err){
    	console.log('Error: ' + err);
    	vBLE.ble_status_msg('#BLE-Status', err);
    });

	},

	/* ===========================================================================
	Write seconds until midnight
	=========================================================================== */
	writeSecondsUntilMidnight: function (inputValue, maxTrials, rejectIfFails) {

		var t = this;
		return new Promise(function fcn(resolve, reject){
			var serviceAddress1 = t.writeSecondsUntilMidnight_service;  
	    var characteristicsAddress1 = t.writeSecondsUntilMidnight_char;  

	    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
	    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);

	 
	   
			console.log('Writing Midnight: ' + inputValue);
			vBLE.ble_status_msg('#BLE-Status', 'Writing Midnight... ' + inputValue);

			t.writeValue(characteristics1, new Uint32Array([inputValue]))
			.then(() => { resolve(true); })
			.catch(() => {
				if(--maxTrials > 0) {
					console.log('[Writing Test] writeSecondsUntilMidnight failed...Trying again...');
	    		setTimeout(() => { fcn(resolve, reject); }, 1000);
	    	} else {
	    		if(rejectIfFails) reject('[Writing Test] Writing Midnight ['+ val + '] failed...');
	    		else resolve(true);
	    	}
			});
		});
		
	},

	// Feb.02.2018 - sunset: 'upcoming' seconds until midnight, sunrise: 'upcoming' seconds from midnight
	// Feb.05.2018 - Ignore sunrise. Sunset: upcoming from current time.
	writeSecondsUntilSunTime: function (inputValue, whichOne, maxTrials, rejectIfFails) {	// 0 - sunrise, 1 - sunset
		var t = this;

		return new Promise(function fcn(resolve, reject){
			var serviceAddress1 = t.writeSecondsUntilSuntime_service;  
	    var characteristicsAddress1 = t.writeSecondsUntilSunrise_char;  
	    var characteristicsAddress2 = t.writeSecondsUntilSunset_char;  

	    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
	    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);
	    var characteristics2 = evothings.ble.getCharacteristic(service1, characteristicsAddress2);


	    var writeFailed = function () {
	    	if(--maxTrials > 0) {
					console.log('[Writing Test] writeSecondsUntilSunTime failed...Trying again...');
	    		setTimeout(() => { fcn(resolve, reject); }, 1000);
	    	} else {
	    		if(rejectIfFails) reject('[Writing Test] Writing Suntime failed...');
	    		else resolve(true);
	    	}
	    }

	    if(whichOne == 0) {
	    	vBLE.ble_status_msg('#BLE-Status', 'Writing Sunrise... ' + inputValue);
	    	t.writeValue(characteristics1, new Uint32Array([inputValue]))
	    	.then(() => { resolve(true); })
	    	.catch(writeFailed);
	    } else {
	    	vBLE.ble_status_msg('#BLE-Status', 'Writing Sunset... ' + inputValue);
	    	t.writeValue(characteristics2, new Uint32Array([inputValue]))
	    	.then(() => { resolve(true); })
	    	.catch(writeFailed);
	    }

		});
		
	},

	/* ===========================================================================
	Write Time to burn time
	=========================================================================== */
	writeTTB: function (inputValue, maxTrials, rejectIfFails) {
		
		var t = this;
		return new Promise(function fcn(resolve, reject){
			var serviceAddress1 = t.writeTTB_service;  
	    var characteristicsAddress1 = t.writeTTB_char;  

	    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
	    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);

	    
	    console.log('Writing TTB: ' + inputValue);
	    vBLE.ble_status_msg('#BLE-Status', 'Write TTB... ' + inputValue);
	    vBLE.display_ttb_written(inputValue);

	    t.writeValue(characteristics1, new Uint32Array([inputValue]))
	    .then(() => { resolve(true); })
	    .catch(() => { 
	    	if (--maxTrials > 0) {
	    		console.log('[Writing Test] writeTTB failed...Trying again...');
		      setTimeout(() => { fcn(resolve, reject); }, 1000);
		    } else {
		      if (rejectIfFails) reject('[Writing Test] Writing TTB failed...');
		      else resolve(true);
		    }
	    });

		});	
		
	},

	/* ===========================================================================
	Read Realtime Data
	=========================================================================== */
	startReadRealtime: function () {

		var t = this;

		clearInterval(t.readRealtimeIntervalID);

		var serviceAddress1 = t.startReadRealtime_service1;   
    //var serviceAddress2 = t.startReadRealtime_service2;   

    var characteristicsAddress1 = t.startReadRealtime_char1;    
    var characteristicsAddress2 = t.startReadRealtime_char2;   
    var characteristicsAddress3 = t.startReadRealtime_char3;    
    var characteristicsAddress4 = t.startReadRealtime_char4;     
    var characteristicsAddress5 = t.startReadRealtime_char5;
    var characteristicsAddress6 = t.startReadRealtime_char6;
    var characteristicsAddress7 = t.startReadRealtime_char7;
    var characteristicsAddress8 = t.startReadRealtime_char8;
    var characteristicsAddress9 = t.startReadRealtime_char9;
    //var characteristicsAddress10 = t.startReadRealtime_char10;
    var characteristicsAddress11 = t.startReadRealtime_char11;
    var characteristicsAddress12 = t.startReadRealtime_char12;
    var characteristicsAddress13 = t.startReadRealtime_char13;
    var characteristicsAddress14 = t.startReadRealtime_char14;
    var characteristicsAddress15 = t.startReadRealtime_char15;
    var characteristicsAddress16 = t.startReadRealtime_char16;
    var characteristicsAddress17 = t.startReadRealtime_char17;

    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
    //var service2 = evothings.ble.getService(t.targetDeviceObj, serviceAddress2);
    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);
    var characteristics2 = evothings.ble.getCharacteristic(service1, characteristicsAddress2);
    var characteristics3 = evothings.ble.getCharacteristic(service1, characteristicsAddress3);
    var characteristics4 = evothings.ble.getCharacteristic(service1, characteristicsAddress4);
    var characteristics5 = evothings.ble.getCharacteristic(service1, characteristicsAddress5);
    var characteristics6 = evothings.ble.getCharacteristic(service1, characteristicsAddress6);
    var characteristics7 = evothings.ble.getCharacteristic(service1, characteristicsAddress7);
    var characteristics8 = evothings.ble.getCharacteristic(service1, characteristicsAddress8);
    var characteristics9 = evothings.ble.getCharacteristic(service1, characteristicsAddress9);
    //var characteristics10 = evothings.ble.getCharacteristic(service1, characteristicsAddress10);
    var characteristics11 = evothings.ble.getCharacteristic(service1, characteristicsAddress11);
    var characteristics12 = evothings.ble.getCharacteristic(service1, characteristicsAddress12);
    var characteristics13 = evothings.ble.getCharacteristic(service1, characteristicsAddress13);
    var characteristics14 = evothings.ble.getCharacteristic(service1, characteristicsAddress14);
    var characteristics15 = evothings.ble.getCharacteristic(service1, characteristicsAddress15);
    var characteristics16 = evothings.ble.getCharacteristic(service1, characteristicsAddress16);
    var characteristics17 = evothings.ble.getCharacteristic(service1, characteristicsAddress17);

    var char1Val, char2Val, char3Val, char4Val, char5Val, char6Val, char7Val, char8Val, char9Val, char10Val, char11Val, char12Val, char13Val, char14Val, char15Val, char16Val, char17Val = null;

		t.readRealtimeIntervalID = setInterval(function(){

			// Jan.09.2018 - For testing battery variable
			var currTime = new Date();

			// init variables
			char1Val, char2Val, char3Val, char4Val, char5Val, char6Val, char7Val, char8Val, char9Val, char10Val, char11Val, char12Val, char13Val, char14Val, char15Val, char16Val, char17Val = null;

			t.readValue(characteristics1, 'Uint32')
			.then(function(val){
				char1Val = val;
				return t.readValue(characteristics2, 'Uint8');
			})
			.then(function(val){
				char2Val = val;
				return t.readValue(characteristics3, 'Uint32');
			})
			.then(function(val){
				char3Val = val;
				return t.readValue(characteristics4, 'Uint32');
			})
			.then(function(val){
				char4Val = val;
				return t.readValue(characteristics5, 'Uint8');
			})
			.then(function(val){
				char5Val = val;
				return t.readValue(characteristics6, 'Uint8');
			})
			.then(function(val){
				char6Val = val;
				return t.readValue(characteristics7, 'Uint32'); // Uint32
			})
			.then(function(val){
				char7Val = val;
				return t.readValue(characteristics8, 'Uint32'); // Uint32
			})
			.then(function(val){
				char8Val = val;
				return t.readValue(characteristics9, 'Uint8');
			})
			.then(function(val){
				char9Val = val;
				return true;//t.readValue(characteristics10, 'Uint8');
			})
			.then(function(val){
				//char10Val = val;
				return t.readValue(characteristics11, 'Uint8');
			})
			.then(function(val){
				char11Val = val;
				return t.readValue(characteristics12, 'Uint32');
			})
			.then(function(val){
				char12Val = val;
				return t.readValue(characteristics13, 'Uint32');
			})
			.then(function(val){
				char13Val = val;
				return t.readValue(characteristics14, 'Uint32');
			})
			.then(function(val){
				char14Val = val;
				return t.readValue(characteristics15, 'Uint32'); // Int16
			})
			.then(function(val){
				char15Val = val;
				return t.readValue(characteristics16, 'Uint32'); // Int16
			})
			.then(function(val){
				char16Val = val;
				return t.readValue(characteristics17, 'Uint32'); // Int16
			})
			.then(function(val){
				char17Val = val;
				
				
				vBLE.display_realtimeResult(char1Val, char2Val, char3Val, char4Val,
																							char5Val, char6Val, char7Val, char8Val, 
																							char9Val, char11Val, char12Val, char13Val, 
																							char14Val, char15Val, char16Val, char17Val);

				

				t.batteryTestingData.push({
					currentTime: currTime,
					duration: char14Val,
					voltage: char12Val
				});

				vBLE.display_batteryData();

			})
			.catch(function(err){
				console.log('Stopping Realtime Reading...');
				vBLE.ble_status_msg('#BLE-Status', 'Error in realtime reading ' + err);
				
				clearInterval(t.readRealtimeIntervalID);

				// Apr.18.2018 - ask to manually start realtime.
				myApp.modal({
		      title: 'Realtime Error !',
		      text: err,
		      verticalButtons: true,
		      buttons: [
		      {
		        text: 'Retry Realtime',
		        onClick: function () {
		        	t.startReadRealtime();
		        }
		      },
		      {
		        text: 'Ok'
		      }
		      ]
		    });

			});

		}, t.initialRealTimeReadingInterval);

	},

	stopReadRealtime: function () {
		var t = this;
		clearInterval(t.readRealtimeIntervalID);
	},

	/* ===========================================================================
	Resets
	=========================================================================== */
	startReset: function (val, maxTrials, rejectIfFails) {

		var t = this;
		return new Promise(function fcn(resolve, reject) {
			var serviceAddress1 = t.resetTTB_service;
	    var characteristicsAddress1 = t.resetTTB_char;

	    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
	    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);
	   	
	   	if(val == 7 || val == 8 || val == 9 || val == 10) {
	   		console.log('Writing: ' + val);
	   		vBLE.ble_status_msg('#BLE-Status', 'Writing FG/BG... ' + val);
	   	}

	    t.writeValue(characteristics1, new Uint32Array([val]))
	    .then(() => { resolve(true); })
	    .catch(() => {
	    	if(arguments.length > 1) {
	    		if(--maxTrials > 0) {
	    			console.log('[Writing Test] startReset failed...Trying again...');
		    		setTimeout(() => { fcn(resolve, reject); }, 1000);
		    	} else {
		    		if(rejectIfFails) reject('[Writing Test] Writing '+ val + ' failed...');
		    		else resolve(true);
		    	}
	    	}
	    });
		});
		

	},

	/* ===========================================================================
	OTA
	=========================================================================== */
	startOTA: function () {
		var t = this;
		var serviceAddress1 = t.startOTA_service;
    var characteristicsAddress1 = t.startOTA_char;

    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);

    t.writeValue(characteristics1, new Uint32Array([1]))
    .then(function(){
    	console.log('OTA done: ');
    	vBLE.ble_status_msg('#BLE-Status', 'Initiating OTA...');
    })
    .catch(function(err){
    	console.log('Error: ' + err);
    	vBLE.ble_status_msg('#BLE-Status', err);
    });
	},

	/* ===========================================================================
	Notification call
	=========================================================================== */

	startNotification: function () {

		console.log('Start Notification');

		var t = this;

		t.notificationDataCollected = [];	// empty

		var serviceAddress1 =	t.startNotification_service;
		var characteristicsAddress1 = t.startNotification_char1;
  	var characteristicsAddress2 = t.startNotification_char2;

  	var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
  	var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);
  	var characteristics2 = evothings.ble.getCharacteristic(service1, characteristicsAddress2);

  	var dataCounter = 0;

  	t.notificationDataCollectedTime = new Date().getTime();

  	// Jan.12.2018 - Load, save previous notification fired time
  	var tempCollectedTimePrev = localStorage["notificationDataCollectedTimePrev"];
  	if(!tempCollectedTimePrev) tempCollectedTimePrev = 0;	 
  	tempCollectedTimePrev = Number(tempCollectedTimePrev);		// convert to int
  	t.notificationDataCollectedTimePrev = tempCollectedTimePrev;
	  localStorage["notificationDataCollectedTimePrev"] = t.notificationDataCollectedTime;

	  console.log('Variable Init done with prev time loaded: ' + tempCollectedTimePrev);

	  // Mar.07.2018 - For better UX, keep track of when Datalog download is done. EventListener is in index.js
	  myApp.showPreloader('Reading Datalog...');
		var notificationDoneTrackInterval = 0;	// starts when writing is done. (Because writing done time is unexpected)

	  // Writing 1 triggers notification
  	t.writeValue(characteristics1, new Uint32Array([1]))
  	.then(function() {

  		// Check if notification is completed.
  		// Check every ~ seconds and compare # of data received.
  		var prevDataCounter = 0;
  		notificationDoneTrackInterval = setInterval(() => {

				if(prevDataCounter !== dataCounter) prevDataCounter = dataCounter;
				else {
					clearInterval(notificationDoneTrackInterval);
					document.dispatchEvent(datalogNotificationDone);
				}

			}, 1000);

  		evothings.ble.enableNotification(t.targetDeviceObj, characteristics2, function(buffer) {

  			var data = new Uint8Array(buffer);

  			var dataArr = t.analyzeNotificationData(data);
  			
  			t.notificationDataCollected.push({
          currentTime: t.notificationDataCollectedTime,
          prevTime: tempCollectedTimePrev,  // previously notification activated time
          id: dataCounter,
          time: dataArr[0],
          timeInEpoch: 0,   // will be used to make actual time later.
          uv: dataArr[1],
          temp: dataArr[2],
          ssOn: dataArr[3],
          voltage: dataArr[4]
        });

        vBLE.display_reading_notificationData(dataCounter, data, dataArr[0], dataArr[1], dataArr[2], dataArr[3], dataArr[4]);
        
        dataCounter++;

  		}, function(err){
        console.log('Error reading notification');
        myApp.hidePreloader();
      });

  	})
  	.catch(function(err) {
  		console.log('Error in notification: ' + err);
  		myApp.hidePreloader();
  	});


	},

	analyzeNotificationData: function (data) {
		// conversion - time
    var hexString = ''; var tempString; var i;
    for(i = 0; i < 3; i++){
      var tempVal = data[i].toString(16);
      if(tempVal.length < 2){
        tempString = '0' + tempVal;
      } else {
        tempString = tempVal;
      }
      hexString += tempString;
    }
    var convTime = parseInt(hexString, 16);

    // conversion - uv
    var convUV = Number(data[3]);
    if(!isNaN(convUV) && convUV > 0) convUV = convUV / 10;

    // conversion - temp
    var convTemp = Number(data[4]);
    if(isNaN(convTemp)) convTemp = 'NaN';


    // Sept.25.2017 - Testing purpose, we track whether sunscreen is on and off
    var convSSOnOff = Number(data[5]);
    if(isNaN(convSSOnOff)) convSSOnOff = 'NaN';

    // conversion - steps
    hexString = '';
    for(i = 6; i < 8; i++){
      var tempVal = data[i].toString(16);
      if(tempVal.length < 2){
        tempString = '0' + tempVal;
      } else {
        tempString = tempVal;
      }
      hexString += tempString;
    }
    var convStep = parseInt(hexString, 16);
    
    var convUV = Number(data[3]);

    return [convTime, convUV, convTemp, convSSOnOff, convStep];
	},

	/* ===========================================================================
	service and char write
	=========================================================================== */
	startSendingBytes: function () {

		var t = this;

		var bytesStacker = [];
	  var i;
	  // Gather all inputs
	  for(i = 0; i < 10; i++) {
	    var tempByte = $$('.content-block .row').find('input[name="byteElement'+ i +'"]').val();

	    // Suppose it's hex
	    if(tempByte) {
	      tempByte = '0x' + tempByte;
	      bytesStacker.push(parseInt(tempByte));
	    }
	    else {
	      bytesStacker.push(parseInt('0x0'));
	    }
	  }

	  // Check array in Reversed order and remove all empty spots
	  // if one of them is not 0, never mind
	  for(i = bytesStacker.length - 1; i >= 0; i--) {
	    if(bytesStacker[i] == 0) bytesStacker.pop();
	    else break;   
	  }

	  //console.log('Completed Bytes array: ' + bytesStacker);

	  // Pick service and char from input fields
	  var serviceAddress1 = $$('.content-block .row').find('input[name="byteService"]').val();
    var characteristicsAddress1 = $$('.content-block .row').find('input[name="byteCharacteristic"]').val();

    if(serviceAddress1 && characteristicsAddress1) {
      serviceAddress1 = '0000' + serviceAddress1 + t.restUUID;
      characteristicsAddress1 = '0000' + characteristicsAddress1 + t.restUUID;
    } else {
      serviceAddress1 = t.startSendingBytes_service;
      characteristicsAddress1 = t.startSendingBytes_char;
    }

    // Init
    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);

    t.writeValue(characteristics1, new Uint8Array(bytesStacker))
    .then(function(){
    	console.log('Writing bytes array done: ' + bytesStacker);
    })
    .catch(function(err){
    	console.log('Error writing bytes: ' + err);
    });

	},

	/* ===========================================================================
	UV Changer
	=========================================================================== */
	startUVChange: function (userInputUV) {

		var t = this;
		var serviceAddress1 = t.startUVChange_service;
    var characteristicsAddress1 = t.startUVChange_char;

    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);

    t.writeValue(characteristics1, new Uint32Array([userInputUV]))
    .then(function(){
    	vBLE.ble_status_msg('#BLE-Status', 'Change UV: ' + userInputUV);
    	vBLE.display_uvChange(userInputUV);
    })
    .catch(function(err){
    	console.log('Error: ' + err);
    	vBLE.ble_status_msg('#BLE-Status', err);
    });

	},

	/* ===========================================================================
	Feb.14.2018 - Test for Subscription
	=========================================================================== */
	startSubscription: function () {
		var t =  this;
		var serviceAddress1 = t.notificationTester_service;
    var characteristicsAddress1 = t.notificationTester_char1;
    var characteristicsAddress2 = t.notificationTester_char2;
    var characteristicsAddress3 = t.notificationTester_char3;
    var characteristicsAddress4 = t.notificationTester_char4;
    var characteristicsAddress5 = t.notificationTester_char5;
    var characteristicsAddress6 = t.checkFirstTimeSinceBattery_char;  
    var characteristicsAddress7 = t.notificationTester_char7; 

    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);	// uint8
    var characteristics2 = evothings.ble.getCharacteristic(service1, characteristicsAddress2);	// uint8
    var characteristics3 = evothings.ble.getCharacteristic(service1, characteristicsAddress3);	// uint32
    var characteristics4 = evothings.ble.getCharacteristic(service1, characteristicsAddress4);	// uint32
    var characteristics5 = evothings.ble.getCharacteristic(service1, characteristicsAddress5);	// uint32
    var characteristics6 = evothings.ble.getCharacteristic(service1, characteristicsAddress6); // firstTimeSinceBattery
    var characteristics7 = evothings.ble.getCharacteristic(service1, characteristicsAddress7);

    var counter = 0;

    console.log('Subscription Started....');
    clearInterval(t.subscriptionTestInterval);

    // dataTranslation

    var data0_prev, data1_prev, data2_prev, data3_prev, data4_prev;
    var dataObjArrayPrev = [];
    var dataObjArrayCurr = [];		// June.07.2018 - Now we use global var

  	// ================================================================================
  	// UV 
  	evothings.ble.enableNotification(t.targetDeviceObj, characteristics1, function(buffer) {

    	var data = t.dataTranslation(buffer, 'Uint8');
			console.log('[Subscription] UV data: ' + data);

			let timeEpoch = new Date().getTime();
			var argObj = {
				'id': 0,
				'data': data,
				'createdEpoch': timeEpoch
			}

			dataObjArrayCurr.push(argObj);
			t.subscriptionDataArrCurr.push(argObj);  // June.07.2018 - Added

			t.uv_fromDevice = parseInt(data / 10);

			// Compare with previous UV then decide whether to recalculate or not
			t.uvTrackerArr.push(t.uv_fromDevice);
			
			t.appCalculationNeeded();

			t.initTTBTrackArr.push(t.getLatestInitTTB());	// after recalculation is done, stack new initTTB
			
		}, function(err){
      console.log('Error in subscription characteristics1: ' + err);
      vBLE.ble_status_msg('#BLE-Status', 'Error in Subscription [UV]: ' + err);
    });
  	
  	// ================================================================================
  	// Temp
    evothings.ble.enableNotification(t.targetDeviceObj, characteristics2, function(buffer) {

    	var data = t.dataTranslation(buffer, 'Int8');
			console.log('[Subscription] Temp data: ' + data);
			
			let timeEpoch = new Date().getTime();
			var argObj = {
				'id': 1,
				'data': data,
				'createdEpoch': timeEpoch
			}
			
			dataObjArrayCurr.push(argObj);
			t.subscriptionDataArrCurr.push(argObj);  // June.07.2018 - Added

			//allDataColected(argObj);

		}, function(err){
      console.log('Error in subscription characteristics2: ' + err);
      vBLE.ble_status_msg('#BLE-Status', 'Error in Subscription [Temperature]: ' + err);
    });

    // ================================================================================
    // Battery
    evothings.ble.enableNotification(t.targetDeviceObj, characteristics3, function(buffer) {
    	var data = t.dataTranslation(buffer, 'Uint32');
			console.log('[Subscription] Battery data: ' + data);
			
			let timeEpoch = new Date().getTime();
			var argObj = {
				'id': 2,
				'data': data,
				'createdEpoch': timeEpoch
			}

			dataObjArrayCurr.push(argObj);
			t.subscriptionDataArrCurr.push(argObj);  // June.07.2018 - Added
			
			//allDataColected(argObj);

		}, function(err){
      console.log('Error in subscription characteristics3: ' + err);
      vBLE.ble_status_msg('#BLE-Status', 'Error in Subscription [Battery]: ' + err);
    });

    // ================================================================================
    // TTB
    evothings.ble.enableNotification(t.targetDeviceObj, characteristics4, function(buffer) {
    	var data = t.dataTranslation(buffer, 'Uint32');
			console.log('[Subscription] TTB data: ' + data);
			
			let timeEpoch = new Date().getTime();
			var argObj = {
				'id': 3,
				'data': data,
				'createdEpoch': timeEpoch
			}

			dataObjArrayCurr.push(argObj);
			t.subscriptionDataArrCurr.push(argObj);  // June.07.2018 - Added

			// Mar.29.2018 - Will display what would happen to variables
			var logText = '\n\n================================================' +
										'\nTTB Received:    ' + data + 
										'\nPrevioud TTB:    ' + t.ttb_fromDevice + 
										'\nCurrent SS:      ' + t.ss_fromDevice + 
										'\nUV Data Stacked: ' + t.uvTrackerArr +
										'\nSetting Tracked: ' + '[' + t.prevSkintype + ', '+ t.prevEnvironment +'] => [' + t.currentSkintype + ', '+ t.currentEnvironment +']' +
										'\n------------------------------------------------';

			// June.11.2018 - 50000 means 'TTB is over'
			if(data < 50000) {

				t.ttb_fromDevice = data;

				// Mar.20.2018 - If this is after SS applied, don't recalculate
				// Mar.21.2018 - When SS is on, TTB value is based on UV 1 value. Do division if UV > 0
				// Mar.22.2018 - Now TTB from device is always 'calculated' value. Just use it
				// Mar.23.2018 - Try previous method. 
				// Mar.29.2018 - now order is SS -> TTB. new t.ss_applied_signal is added.
				

				if(t.ss_fromDevice < 1) {

					t.appCalculationNeeded();

					logText += '\n>> No SS, Use App Calculation';
					
				} else {

					var uvValue;
					var uvGT0_arr = t.uvTrackerArr.filter((el) => { return el > 0; });		// picking UV > 0
					if(uvGT0_arr.length > 0) uvValue = uvGT0_arr[uvGT0_arr.length - 1];
					else uvValue = 1;

					logText += ('\n>> SS is there: ' + (parseInt(t.ttb_fromDevice / uvValue)) + ' = ' + t.ttb_fromDevice + ' / ' + uvValue);

					t.ttb_fromDevice = parseInt(t.ttb_fromDevice / uvValue);
					
				}

				t.saveSkinEnv();
				
				logText += ('\n------------------------------------------------' +
										'\nCurrent TTB:     ' + t.ttb_fromDevice + 
										'\nCurrent SS:      ' + t.ss_fromDevice + 
										'\nUV Data Stacked: ' + t.uvTrackerArr +
										'\n================================================\n\n\n');
				
				console.log(logText);

			} else {	

				t.ttb_fromDevice = 0;

				//clearInterval(t.appTimerInterval);		// Stop Timer
				// June.11.2018 - Track TTB is over
				t.ttbIsOver = true;

				// Mar.06.2018 - This is TTB data. Update Local notification if needed
				var id = 99;
				var now = new Date().getTime(),
	  				sec_from_now = new Date(now + (data * 1000));

				cordova.plugins.notification.local.clear(id, function() {

					sec_from_now = new Date(now + (1 * 1000));

					cordova.plugins.notification.local.schedule({
			      id: id,
			      trigger: {
			      	at: sec_from_now
			      },
			      title: 'Device tester',
			      text: 'TTB is Over. Data from Device'
				  });
				  console.log(id + ': Notification Created -> ' + data + ' s');

				});

			}


		}, function(err){
      console.log('Error in subscription characteristics4: ' + err);
      vBLE.ble_status_msg('#BLE-Status', 'Error in Subscription [TTB]: ' + err);
    });

    // ================================================================================
    // Sunscreen
    evothings.ble.enableNotification(t.targetDeviceObj, characteristics5, function(buffer) {
    	var data = t.dataTranslation(buffer, 'Uint32');
			console.log('[Subscription] SS data: ' + data);
			
			let timeEpoch = new Date().getTime();
			var argObj = {
				'id': 4,
				'data': data,
				'createdEpoch': timeEpoch
			}
			
			dataObjArrayCurr.push(argObj);
			t.subscriptionDataArrCurr.push(argObj);  // June.07.2018 - Added

			//t.ss_fromDevice = data;
			//if(t.ss_fromDevice < 1) t.ss_applied_signal = true;

			
			// Mar.29.2018 - Will display what would happen to variables
			var logText = '\n\n================================================' +
										'\nSS Received:     ' + data + 
										'\nPrevioud SS:     ' + t.ss_fromDevice + 
										'\nCurrent TTB:     ' + t.ttb_fromDevice + 
										'\nUV Data Stacked: ' + t.uvTrackerArr +
										'\nSetting Tracked: ' + '[' + t.prevSkintype + ', '+ t.prevEnvironment +'] => [' + t.currentSkintype + ', '+ t.currentEnvironment +']' +
										'\n------------------------------------------------';

			
			t.ss_fromDevice = data;

			logText += ('\n------------------------------------------------' +
									'\nCurrent TTB:     ' + t.ttb_fromDevice + 
									'\nCurrent SS:      ' + t.ss_fromDevice + 
									'\nUV Data Stacked: ' + t.uvTrackerArr +
									'\n================================================\n\n\n');

			console.log(logText);
			



		}, function(err){
      console.log('Error in subscription characteristics5: ' + err);
      vBLE.ble_status_msg('#BLE-Status', 'Error in Subscription [Sunscreen]: ' + err);
    });

    // ================================================================================
    evothings.ble.enableNotification(t.targetDeviceObj, characteristics6, function(buffer) {
    	var data = t.dataTranslation(buffer, 'Uint8');
			console.log('[Subscription] First Time since battery data: ' + data);
			
			let timeEpoch = new Date().getTime();
			var argObj = {
				'id': 5,
				'data': data,
				'createdEpoch': timeEpoch
			}

			// Apr.16.2018 - If its the first time, reset saved address
			// Apr.17.2018 - Saving happens only when 'First Time' is received.
			if(Number(data) !== 0) {	
				if(t.targetDeviceObj) {
					//console.log('First Time ['+ data + ', '+ typeof data +']! Changing Address from ' + JSON.parse(localStorage["deviceMacAddress"]).address + ' => ' + t.targetDeviceObj.address);
					localStorage["deviceMacAddress"] = JSON.stringify(t.targetDeviceObj);	// save current one.

					localStorage["deviceName"] = t.getDeviceName(t.targetDeviceObj);
					vBLE.display_deviceName(t.getDeviceName(t.targetDeviceObj));
	
					vBLE.display_saved_device_address(t.targetDeviceObj.address);
					
				}
			}
			
			dataObjArrayCurr.push(argObj);
			t.subscriptionDataArrCurr.push(argObj);  // June.07.2018 - Added

			//allDataColected(argObj);

		}, function(err){
      console.log('Error in subscription characteristics6: ' + err);
      vBLE.ble_status_msg('#BLE-Status', 'Error in Subscription [First Time]: ' + err);
    });

    // ================================================================================
    // Device is Active or not (Shaken)
    evothings.ble.enableNotification(t.targetDeviceObj, characteristics7, function(buffer) {
    	var data = t.dataTranslation(buffer, 'Uint8');
			console.log('[Subscription] Device shaken: ' + data);
			
			let timeEpoch = new Date().getTime();
			var argObj = {
				'id': 7,
				'data': data,
				'createdEpoch': timeEpoch
			}

			t.deviceShaken = data;

			t.appCalculationNeeded();
			
			dataObjArrayCurr.push(argObj);
			t.subscriptionDataArrCurr.push(argObj);  // June.07.2018 - Added

			//allDataColected(argObj);

		}, function(err){
      console.log('Error in subscription characteristics7: ' + err);
      vBLE.ble_status_msg('#BLE-Status', 'Error in Subscription [Device Shaken]: ' + err);
    });

    t.displaySubscription();		// run interval
		

	},

	// June.07.2018 - Became a separate function
	displaySubscription: function () {
		var t = this;

		// Mike asked for this way. 
    // Wait until certain moment then display whatever changed
    t.subscriptionTestInterval = setInterval(function(){
    		
    	// if current is different from previous, display. 
    	// current array length > 0
    	// length of two array different, 
    	// if length is the same, comapre each element
    	if(t.subscriptionDataArrCurr.length > 0) {

    		if(t.subscriptionDataArrCurr.length !== t.subscriptionDataArrPrev.length) {

    			vBLE.display_subscription(t.subscriptionDataArrCurr);
    			t.subscriptionDataArrPrev = t.subscriptionDataArrCurr.slice();
    			t.subscriptionDataArrCurr = [];

    		} else {

    			// if arrays are not identical,
    			if(!(JSON.stringify(t.subscriptionDataArrCurr) === JSON.stringify(t.subscriptionDataArrPrev))) {

    				t.userState.push(t.userStateIndex.SUB_DONE);
    				vBLE.display_subscription(t.subscriptionDataArrCurr);
    				t.subscriptionDataArrPrev = t.subscriptionDataArrCurr.slice();
    				t.subscriptionDataArrCurr = [];

    			} else {
    				//console.log('Two arrays are identical. Not updating...');
    			}

    		}
    			
    	} else {
    		//console.log('Current Array length is 0. Not updating...');
    	}
 	
    }, 500);

	},

	stopSubscription: function () {

		var t = this;

		clearInterval(t.subscriptionTestInterval);

		// Didn't really implemented stop subscribing

	},

	// Feb.21.2018 - Instead of paring, trying custom password
	startEnteringPassword: function (inputValue, maxTrials, rejectIfFails) {
		var t = this;

		return new Promise(function fcn(resolve, reject){
			var serviceAddress1 = t.customPassword_service;
	    var characteristicsAddress1 = t.customPassword_char;

	    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
	    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);
	   
	    t.writeValue(characteristics1, new Uint32Array([inputValue]))
	    .then(() => { resolve(true); })
	    .catch(() => { 
	    	console.log('[Writing Test] startEnteringPassword failed...Trying again...');
	    	if (--maxTrials > 0) {
		      setTimeout(() => { fcn(resolve, reject); }, 1000);
		    } else {
		      if (rejectIfFails) reject('[Writing Test] Writing Password failed...');
		      else resolve(true);
		    }
	    });

		});
	},

	loadPassword: function () {
		var t = this;
		var password = localStorage["userPassword"];

		if(!password) t.generatePassword();
		else t.userPassword = Number(password);
		
	},

	generatePassword: function () {

		var t = this;

		var max = 999999; var min = 1000; var final = 0;

		var passcode1 = Math.floor(Math.random() * (max - min + 1) + min);
		var passcode2 = Math.floor((Math.random() * Math.random()) * ((max - min) / 7) + min);

		var prop = Math.floor(Math.random() * (100 - 0 + 1));

		if(prop > 50) final = passcode1;
		else final = passcode2;

		// Apr.05.2018 - Only for multiple device testing
		//final = 11111;

		localStorage["userPassword"] = final + '';
		this.userPassword = final;

		console.log('New Password is set to ' + final);

		myApp.modal({
      title: t.userPassword,
      text: 'is your new password',
      buttons: [
      {
        text: 'Ok'
      },
      ]
    });

	},

	/* ===========================================================================
	Mar.19.2018 - Need TTB calculation for updating TTB value locally. (without device) 
	Get ratio of prev and curr then apply to current TTB
	Formula is: 'parseInt(skin / (uv + (uv * env)))'
	=========================================================================== */
	getLatestInitTTB: function () {
		var t = this;

		// Using latest UV, skin, environment
		var uvGT0_arr = t.uvTrackerArr.filter((el) => {
			return el > 0;
		});

		if(uvGT0_arr.length > 0)
			return this.calcTTB(t.currentSkintype, t.currentEnvironment, uvGT0_arr[uvGT0_arr.length - 1]);
		else
			return 0;

	},

	getEnvValue: function (env) {
		switch(env) {
			case 0: return 0.15; break;
			case 1: return 0.8; break;
			case 2: return 0.25; break;
			case 3: return 0.4; break;
			case 4: return 0.25; break;
			case 5: return 0.25; break;
			default: return 0.25; break;
		}
	},

	getSkinValue: function (skin) {
		switch(skin) {				// in seconds
			case 0: return 67; break;
			case 1: return 100; break;
			case 2: return 200; break;
			case 3: return 300; break;
			case 4: return 400; break;
			case 5: return 500; break;
			default: return 67; break;
		}
	},

	// This value is for app timer.
	calcTTB: function (skin, env, uv) {
		var t = this;
		if(uv < 1) uv = 1;
		return parseInt((t.getSkinValue(skin) * 60) / (uv + (uv * t.getEnvValue(env))));
	},

	// This is value for 'Writing to the device'. Device is using this value
	calcWriteTTBValue: function (skin, env) {
		var t = this;

		var inputVal = $$('.content-block').find('input[name="inputTime"]').val();
    if(isNaN(inputVal) || !inputVal) {
      // calculate
      if(env !== undefined && skin !== undefined) {

        inputVal = t.getSkinValue(skin) / (1 + t.getEnvValue(env));

      } else {
        inputVal = 60;
      }
    } else {
      inputVal = Number(inputVal);
    }

    return parseInt(inputVal * 60);
	},

	saveSkinEnv: function () {
		// Just save the latest ones
		localStorage["skin_current"] = this.currentSkintype;
		localStorage["environment_current"] = this.currentEnvironment;
		localStorage["skin_previous"] = this.prevSkintype;
		localStorage["environment_previous"] = this.prevEnvironment;

		console.log('User Settings saved: [' + this.prevSkintype + ', '+ this.prevEnvironment +'] => [' + this.currentSkintype + ', '+ this.currentEnvironment +']');
	},

	loadSkinEnv: function () {
		this.currentSkintype = (localStorage["skin_current"]) ? Number(localStorage["skin_current"]) : 0;
		this.currentEnvironment = (localStorage["environment_current"]) ? Number(localStorage["environment_current"]) : 0;
		this.prevSkintype = (localStorage["skin_previous"]) ? Number(localStorage["skin_previous"]) : 0;
		this.prevEnvironment = (localStorage["environment_previous"]) ? Number(localStorage["environment_previous"]) : 0;


		console.log('User Settings loaded: [' + this.prevSkintype + ', '+ this.prevEnvironment +'] => [' + this.currentSkintype + ', '+ this.currentEnvironment +']');
	},

	/* ===========================================================================
	Mar.14.2018 - Group of init process after connected
	in Background, try not read or write. Because after 'startReset', it'll disconnect from device anyway.
	
	June.01.2018 - Keep trying until one is done. But if too many failures, stop all. 
	Reference: https://stackoverflow.com/questions/40047774/repeat-a-promise-until-its-not-rejected-or-reach-a-timeout

	June.21.2018 - Rework. Be sure that all data is there before start. If variables are not good, don't write and disconnect
	=========================================================================== */
	checkVariablesBeforeWrite: function () {
		var t = this;
		return new Promise((resolve, reject) => {
			let newObj = {}

			if(!t.userPassword) reject('Password does not exist'); // Device Password
			else {
				newObj.userPassword = t.userPassword;
			}

			// Get seconds until midnight ======================================================
	    var currentTime = new Date().getTime();
	    //var timeDifference = new Date().getTimezoneOffset() * 60;	// to seconds	

	    var midnight = new Date(); 
	    midnight.setHours( 24 ); midnight.setMinutes( 0 ); midnight.setSeconds( 0 ); midnight.setMilliseconds( 0 );

	    var secondsUntilMidnight = parseInt((midnight.getTime() - currentTime) / 1000);

	    if(!secondsUntilMidnight || secondsUntilMidnight <= 0) reject('Seconds until midnight value is wrong: ' + secondsUntilMidnight);
	    else {
	    	newObj.secondsUntilMidnight = secondsUntilMidnight;
	    }
	    // =================================================================================

	    // Get TTB ========================================================================
	    var inputVal = t.calcWriteTTBValue(t.currentSkintype, t.currentEnvironment);

	    if(!inputVal || inputVal <= 0) reject('TTB value is incorrect: ' + inputVal);
	    else {
	    	newObj.ttb = inputVal;
	    }
	    // =================================================================================

	    // Get Suntime =====================================================================
	    var weatherData = callWeatherHandler.currentWeatherData;	// data from weather api in String
	    var secondsForSunrise = 0;
		  var secondsForSunset = 0;

	    if(weatherData) {

	    	weatherData = JSON.parse(weatherData);

	    	//console.log('Checking for suntime today: ' + weatherData['daily']['data'][0]['sunriseTime'] + ', ' + weatherData['daily']['data'][0]['sunsetTime']);

		    // ======================================================================
				// Seconds until midnight and midnight in epoch
				var currentTime = parseInt(new Date().getTime() / 1000);	// in seconds

		    var midnight = new Date();
		    midnight.setHours( 24 );
		    midnight.setMinutes( 0 );
		    midnight.setSeconds( 0 );
		    midnight.setMilliseconds( 0 );

		    var midnightEpoch = parseInt(midnight.getTime() / 1000);
		    var midnightEpochYesterday = midnightEpoch - 86400;
		    var secondsUntilMidnight = midnightEpoch - currentTime;
		    var sunriseToday = weatherData['daily']['data'][0]['sunriseTime'];
		    var sunsetToday = weatherData['daily']['data'][0]['sunsetTime'];
		    var sunriseTomorrow = weatherData['daily']['data'][1]['sunriseTime'];
		    var sunsetTomorrow = weatherData['daily']['data'][1]['sunsetTime'];
		    // ======================================================================

		    // Feb.06.2018 - sunset from midnight, sunrise from midnight
		    if(currentTime < sunsetToday) secondsForSunset = sunsetToday - midnightEpochYesterday;	// yesterday's midnight until today sunset
		    else secondsForSunset = sunsetTomorrow - midnightEpoch;				// today midnight until tomorrow sunset

		    if(currentTime < sunriseToday) secondsForSunrise = sunriseToday - midnightEpochYesterday;
		    else secondsForSunrise = sunriseTomorrow - midnightEpoch;
		 		
		 		console.log('Now: ' + currentTime + ', Sunrise: ' + sunriseToday + ', Sunset: ' + sunsetToday);

		 		if(!secondsForSunset || secondsForSunset <= 0) reject('secondsForSunset is invalid: ' + secondsForSunset);
		 		else {
		 			newObj.secondsForSunset = secondsForSunset;
		 		}

		 		if(!secondsForSunrise || secondsForSunrise <= 0) reject('secondsForSunrise is invalid: ' + secondsForSunrise);
		 		else {
		 			newObj.secondsForSunrise = secondsForSunrise;
		 		}

	    } else {
	    	reject('Weather Data Not exist');
	    }
	    // =================================================================================
			
			resolve(newObj);

		});
	},

	initAfterConnected: async function () {
		var t = this;

		let logText = '';		// June.27.2018 - To display all at once

		t.userState.push(t.userStateIndex.ENTER_PASSWORD);
		evothings.ble.stopScan();

		// June.27.2018 - Counter Number of writes are done and display
		t.writeCounter = 0;		// Clear before start

		// June.21.2018 - Divided into FG, BG cases. 
		try {
		
			let resObj = await t.checkVariablesBeforeWrite();

			console.log('\n\nCheck Before Start Writing Done: \n' + JSON.stringify(resObj));
			logText += '<br>[1] Check Variables Done';
			
			await t.startEnteringPassword(resObj.userPassword, 3, true);
			t.writeCounter++;

			console.log('Writing password Done...');
    	t.userState.push(t.userStateIndex.ENTER_PASSWORD_DONE);
    	logText += ('<br>[2] Writing password Done: ' + t.userPassword);
   
    	t.startSubscription();

    	t.userState.push(t.userStateIndex.SIGNAL_FG);
    	await t.startReset(mApp.getAppStatus(), 3, true);
    	t.writeCounter++;

    	console.log('Writing FG/BG Done...');
			t.userState.push(t.userStateIndex.SIGNAL_FG_DONE);
			logText += ('<br>[3] Writing FG/BG Done: ' + mApp.getAppStatus());
    
    	if(mApp.checkAppStatus('FG')) {

    		t.runAppTimer();		// Mar.16.2018 - Start Timer
    		await t.writeSecondsUntilMidnight(resObj.secondsUntilMidnight, 3, true);
    		t.writeCounter++;

    		console.log('Writing Midnight done...');
	    	logText += ('<br>[4] Write Midnight Done: ' + resObj.secondsUntilMidnight);

	    	await t.writeTTB(resObj.ttb, 3, true);
	    	t.writeCounter++;

	    	console.log('Writing TTB done...');
	    	logText += ('<br>[5] Write TTB Done: ' + resObj.ttb);

				await t.writeSecondsUntilSunTime(resObj.secondsForSunset, 1, 3, true);	// sunset
				t.writeCounter++;

				console.log('Writing Sunset done...');
				logText += ('<br>[6] Writing Sunset Done: ' + resObj.secondsForSunset);

				await t.writeSecondsUntilSunTime(resObj.secondsForSunrise, 0, 3, true); // sunrise
				t.writeCounter++;

				console.log('Writing Sunrise done...');
				logText += ('<br>[7] Writing Sunrise Done: ' + resObj.secondsForSunrise);

				vBLE.ble_status_msg('#BLE-Status', 'Result of Init Writing' + logText);
				vBLE.display_writeCounter();

    	} else {
    		vBLE.ble_status_msg('#BLE-Status', 'Result of Init Writing' + logText);
    		vBLE.display_writeCounter();
    	}

		} catch(e) {

			vBLE.ble_status_msg('#BLE-Status', 'Result of Init Writing' + logText);
			vBLE.display_writeCounter();

			if(t.targetDeviceObj) {
				t.disconnectDevice(t.targetDeviceObj);
      }

			myApp.modal({
        title: 'Error checking variables',
        text: e,
        verticalButtons: true,
        buttons: [
        {
          text: 'Ok'
        }
        ]
      });

		}


	},

	runAppTimer: function () {

		var t = this;

		console.log('Start App Timer...');

		var sunriseToday = 0; var sunsetToday = 0;
		var weatherData = callWeatherHandler.currentWeatherData;
		if(weatherData) {
			weatherData = JSON.parse(weatherData);
			sunriseToday = weatherData['daily']['data'][0]['sunriseTime'];
	  	sunsetToday = weatherData['daily']['data'][0]['sunsetTime'];
		}
		

		clearInterval(t.appTimerInterval);


		if(sunriseToday !== 0 && sunsetToday !== 0) {

			t.appTimerInterval = setInterval(() => {

				// All these have to be under sunrise, sunset time. 
				var currentTime = parseInt(new Date().getTime() / 1000);

		    if(currentTime > sunriseToday && currentTime < sunsetToday) {
		    	// Check updates then count down. SS first, then TTB
		    	if(t.deviceShaken > 0) {
		    		if(t.ss_fromDevice > 0) {

							t.ss_fromDevice--;
							if(t.ss_fromDevice < 0) t.ss_fromDevice = 0;

						} else {
							if(t.uv_fromDevice > 0 && t.ttb_fromDevice > 0) {
								t.ttb_fromDevice--;
							}
						}
		    	}
		    	
					vBLE.display_appTimer(t.ttb_fromDevice, t.ss_fromDevice);

		    } else {
		    	// Night time. 
		    	console.log('[App Timer] It\'s night time');
		    	clearInterval(t.appTimerInterval);
		    	vBLE.display_appTimer(0, 0);
		    }

			}, 1000);	

		} else {
			console.log('SunTime is not right. (Maybe failed to get Weather Data)')
		}

	},

	updateTTB_whenSSInOn: function () {
		var t = this;
		// When SS is on, TTB always shows UV 1 value. <--- important!
		// When UV is changed, device TTB will not change but app must show 'recalculated' value
		var uvGT0_arr = t.uvTrackerArr.filter((el) => {
			return el > 0;
		});
		t.ttb_fromDevice = (uvGT0_arr.length > 0) ? parseInt(t.ttbFactorBy1 / uvGT0_arr[uvGT0_arr.length - 1]) : t.ttb_fromDevice;
		
		console.log('[App Timer] TTB: ' + t.ttb_fromDevice +', Latest UV: ' + ((uvGT0_arr.length > 0) ? uvGT0_arr[uvGT0_arr.length - 1] : 'NA'));

	},

	/* ===========================================================================
	Mar.20.2018 - See if app can use device data or not. 
	In some cases, device doesn't calculate TTB. In these cases, App is on its own.
	No calculation occur when:
	- Device no shaken. (Not started TTB)
	- SS not applied
	- TTB is over
	Whenever subscription is updated, check this and decide
	=========================================================================== */

	// May.08.2018 - For iOS, return iOS local name, otherwise return cache name 
	getDeviceName: function (deviceObj) {
		return ((deviceObj.hasOwnProperty('advertisementData') && deviceObj.advertisementData.hasOwnProperty('kCBAdvDataLocalName')) ? deviceObj.advertisementData.kCBAdvDataLocalName : deviceObj.name)
	},

	checkDeviceCalculate: function () {
		var t = this;	

		//console.log('Check Device Calculation Status: ' + lastConnectionState + ', SHK: ' + t.deviceShaken + ', SS: ' + t.ss_fromDevice + ', TTB: ' + t.ttb_fromDevice);
		if(t.targetDeviceObj && t.getConState() === t.conStateIndex.CONNECTED) {

			if(t.deviceShaken == 0 || t.deviceShaken == 2) return false;
			else if(t.ss_fromDevice > 0) return false;
			else if(t.ttb_fromDevice < 1) return false;
			else return true;

		} else {
			console.log('*** Device not exists or not connected');
		}

		return false;

	},

	// new 'initTTBTrackArr' must be stacked after this function
	appCalculationNeeded: function () {
		var t = this;
		// Mar.20.2018 - If device is not calculating, use app's calculation
		if(!t.checkDeviceCalculate()) {

			var uvGT0_arr = t.uvTrackerArr.filter((el) => {
				return el > 0;
			});

			if(t.initTTBTrackArr.length > 0) console.log('Check list of initTTB: ' + t.initTTBTrackArr);

			// Get ratio of prev init and current TTB
			var newTTB;
			var prevInitTTB = (t.initTTBTrackArr.length > 0) ? t.initTTBTrackArr[t.initTTBTrackArr.length - 1] : t.ttb_fromDevice;
			if(prevInitTTB == 0) prevInitTTB = t.ttb_fromDevice;	// Mar.22.2018 - to make ratio of 1
			if(prevInitTTB == 0) prevInitTTB = 1;									// Mar.28.2018 - if still 0, make it 1 (for division)

			var ratio = t.ttb_fromDevice / prevInitTTB;

			if(uvGT0_arr.length > 0 && uvGT0_arr[uvGT0_arr.length - 1] > 0) {
				newTTB = t.calcTTB(t.currentSkintype, t.currentEnvironment, uvGT0_arr[uvGT0_arr.length - 1]);	
			} else {
				//newTTB = t.calcTTB(t.currentSkintype, t.currentEnvironment, 1);	// use UV 1
				newTTB = t.ttb_fromDevice;	// Mar.22.2018 - Now TTB from device is always 'calculated' value.
			}

			console.log('TTB Recalculated with UV ['+ ((uvGT0_arr.length > 0) ? uvGT0_arr[uvGT0_arr.length - 1] : 'Unknown') +']: ' + 
									newTTB + ' * (' + t.ttb_fromDevice + ' / ' + prevInitTTB + ') = ' + parseInt(newTTB * ratio));

			t.ttb_fromDevice = parseInt(newTTB * ratio);
			
		}
	},

	// May.03.2018 - testing for multiple writing
	writingTest: async function() {		// async
		var t = this;

		var serviceAddress1 =	t.startNotification_service;
		var characteristicsAddress1 = t.startNotification_char1;

		var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
		var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);

		let counter = 0;
		t.infiniteWritingTestStart = true;
		

		// Testing 1 by 1
		var timeoutFcn = function () {
			return new Promise((resolve) => {
				setTimeout(() => { 
					console.log('['+ counter +'] Waited...'); 
					resolve(true);
				}, 2000);
			});
		}
		
		while(t.infiniteWritingTestStart) {

			let valueToSend = 12 + counter;
			counter++;
			if(valueToSend > 254) counter = 0;

			try {
				await t.writeValue(characteristics1, new Uint32Array([valueToSend]));
				await timeoutFcn();
				console.log('['+ counter +'] Writing is done...');
			} catch (err) {
				console.log('Error in Testing Writing: ' + err);
				clearInterval(writeTester);
			}
		}
		

		// Testing No waiting for result
		/*
		let promiseArr = [];
		for(var i = 0; i < 10000; i++) {
			let valueToSend = 12 + i;
			promiseArr.push(t.writeValue(characteristics1, new Uint32Array([valueToSend])));
		}

		Promise.all(promiseArr)
		.then(() => {
			console.log('All done Testing Writing...');
		})
		.catch((err) => {
			console.log('Error in Testing Writing: ' + err);
		});
		*/
		
	}


}



