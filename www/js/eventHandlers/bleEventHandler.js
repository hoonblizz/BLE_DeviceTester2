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

*/

function cBleEventHandler() {

	this.restUUID = adds.restUUID;

	this.serviceUUID = adds.serviceUUID + this.restUUID;
	this.serviceUUID2 = adds.serviceUUID2 + this.restUUID;	// old one

	this.conState = []; 
	this.conStateIndex = {
		SCANNING: 'SCANNING',
		CONNECTING: 'CONNECTING',
		CONNECTED: 'CONNECTED',
		DISCONNECTED: 'DISCONNECTED'
	}
	
	this.subscriptionOpened = 0;	// to open subscription just once. 

	this.userState = [];
	this.userStateIndex = {
		ENTER_PASSWORD: 'ENTER_PASSWORD',
		WRITING: 'WRITING',
		WRITE_DONE: 'WRITE_DONE',
		READING: 'READING',
		READ_DONE: 'READ_DONE',
		SUB_DONE: 'SUB_DONE'
	}

	this.scannedDeviceArr = [];

	this.targetDeviceObj;

	this.currentEnvironment = 0;
	this.currentSkintype = 0;

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

	// Feb.21.2018 - For custom password
	this.customPassword_service = adds.customPassword_service + this.restUUID;
	this.customPassword_char = adds.customPassword_char + this.restUUID;
	this.userPassword = dVar.sampleUserPassword;

	// Mar.09.2018 - Android Error counter
	// Counts how many errors occur in connection process -> if too many, reset then try
	this.androidErrorCounter = [];

}

cBleEventHandler.prototype = {

	/* ===========================================================================
	Scanning Or Connect?
	=========================================================================== */
	startBLEProcess: function () {
		var t = this;
		// Check to just connect or scan
		var deviceInfoString = localStorage["deviceMacAddress"];

		this.loadPassword();		// Feb.21.2018 - load password implemented

		if(deviceInfoString && deviceInfoString !== '') {	// Device info exists, lets directly connect

			callViewHandler.ble_status_msg('#BLE-Status', 'Registered device Info Found: ' + deviceInfoString);

			// Scan then connect
			t.startScanThenConnect(JSON.parse(deviceInfoString));

		} else {
			t.startScanning();
		}
	},

	/* ===========================================================================
	Scanning then connect
	Jan.11.2018 - Added for 'automatic connection' and 'connect even system already connected'
	=========================================================================== */
	startScanThenConnect: function (deviceInfoObj) {

		var t = this;
		var bleStatus = 'SCANNING';

		callViewHandler.ble_status_msg('#BLE-Status', 'Scan and connect Started');
		console.log('Scan and connect Started...');

		// Even after tiemout, it's still 'SCANNING', means device is not around
		// Mar.06.2018 - Remove timeout. For other usage
		/*
		setTimeout(function() {

			if(bleStatus === 'SCANNING') {
				evothings.ble.stopScan();
				callViewHandler.ble_status_msg('#BLE-Status', 'Device ' + deviceInfoObj.name + ' is not found.');
			}

		},10000);
		*/

		evothings.ble.startScan(function(device) {

			if(device !== null && device.hasOwnProperty('name')) {

				console.log('[Scan for Existing] Device Found: ' + device.name + ', ' + device.address);

				if(device.name === deviceInfoObj.name) { // device.name === deviceInfoObj.name

					evothings.ble.stopScan();

					bleStatus = 'CONNECTING';

					t.startConnecting(device);

				}
			}

		}, function(err){
      console.log('Error while Scanning...');
	  }, { serviceUUIDs: [t.serviceUUID, t.serviceUUID2] });  

	},

	/* ===========================================================================
	Scanning then display list of scanned
	=========================================================================== */
	startScanning: function () {
		
		// Scan -> Stop -> display scanned devices
		callViewHandler.ble_status_msg('#BLE-Status', 'Scanning Started');
		console.log('Scanning Started...');

		this.scanDevices();	
		this.scanTimeout(6000);

	},

	// Scan then return array of list
	scanDevices: function () {

		var t = this;

		t.scannedDeviceArr = [];		// empty list

		evothings.ble.startScan(function(device) {

	    if(device !== null && device.hasOwnProperty('name')) {

	    	console.log('[Scan for New] Device Found: ' + device.name);

	    	var deviceName = device.name;

        // check if already in the list
        var listChecker = t.scannedDeviceArr.find(function(element) {
          return element.name === deviceName;
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
	  }, { serviceUUIDs: [t.serviceUUID, t.serviceUUID2] });  

	},

	scanTimeout: function (timeoutDuration) {

		var t = this;

		setTimeout(function() {

			evothings.ble.stopScan();

			if(t.scannedDeviceArr.length > 0) {

				function clickEvent(deviceInfo) {
	        return function() {
	          t.startConnecting(deviceInfo);
	        }
	      }

	      var modalButtons = [];

        // Create buttons
        for(var i = 0; i < t.scannedDeviceArr.length; i++) {
          modalButtons.push({
            text: t.scannedDeviceArr[i].name,
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
				callViewHandler.ble_status_msg('#BLE-Status', 'No device Found');
			}

		}, timeoutDuration);

	},

	/* ===========================================================================
	Scanning in Background Fetch event (Mar.08.2018)
	Start scanning for 'Default Device Address' then connect. If timeout, ignore.
	=========================================================================== */
	startBGFetchEvent: function () {
		var t = this;

		var defaultAddress = JSON.parse(localStorage["deviceMacAddress"]);

		console.log('Scanning Started for BG Fetch... [ ' + defaultAddress.address + ' ]');

		// Set Timeout then when it's over, stop scanning then run finish
		setTimeout(() => {
			evothings.ble.stopScan();
			BackgroundFetch.finish(); // <---- important!
			console.log('BG Fetch Scan is timedout and finish called...');
		}, 20000);

		evothings.ble.startScan(function(device) {

	    if(device !== null && device.hasOwnProperty('address') && device.hasOwnProperty('name')) {

	    	console.log('[Scan for BG Fetch] Device Found: ' + device.address);

	    	var defaultAddress = JSON.parse(localStorage["deviceMacAddress"]);
	    	if(device.address === defaultAddress.address) {
	    		evothings.ble.stopScan();
	    		t.startConnecting(device);
	    	}
	    	
      }

    }, function(err){
      console.log('Error while Scanning for BG fetch...: ' + err);
	  }, { serviceUUIDs: [t.serviceUUID, t.serviceUUID2] });

	},

	/* ===========================================================================
	Connecting Process
	=========================================================================== */
	startConnecting: function (deviceObj) {

		var t = this;

		if(t.conState[t.conState.length - 1] === t.conStateIndex.DISCONNECTED) {
			t.conState.push(t.conStateIndex.CONNECTING); // connecting

			console.log('\n============================================================' +
									'\n Connecting to ' + deviceObj.name + '...' +
									'\nCurrent: ' + deviceObj.address +
									'\nDefault: ' + ((localStorage["deviceMacAddress"]) ? JSON.parse(localStorage["deviceMacAddress"]).address : 'DNE') +
									//'\nActivity Track: ' + t.conState + 
									'\n============================================================\n');

			callViewHandler.ble_status_msg('#BLE-Status', 'Connecting to ' + deviceObj.name);

			// Save into Local
	    if(deviceObj.hasOwnProperty('address'))
	      //localStorage["deviceMacAddress"] = JSON.stringify(deviceObj);		// save entire info of device

			// Add functions to call after connect
			this.connectDevice(deviceObj);

		}
		
		
	},

	connectDevice: function (deviceObj) {

		var t = this;

		// Jan.29.2018 - For testing purpose, set discoverServices and serviceUUIDs
		evothings.ble.connectToDevice(deviceObj, function(){

			clearInterval(t.connectionWaitingInterval);
			clearInterval(t.connectingStateDurationInterval);
			t.conState.push(t.conStateIndex.CONNECTED);
			t.device_state_connected(deviceObj);

		}, function(){

			clearInterval(t.connectionWaitingInterval);
			t.conState.push(t.conStateIndex.DISCONNECTED);
			t.device_state_disconnected(deviceObj);

		}, function(err){

			clearInterval(t.connectionWaitingInterval);
			t.conState.push(t.conStateIndex.DISCONNECTED);
			t.device_state_error(err, deviceObj);

		}, { discoverServices: true });

	},

	device_state_connected: function (deviceObj) {

		var t = this;

		t.androidErrorCounter = [];

		// Global use
		t.targetDeviceObj = deviceObj;
		
		// Save into Local if device info has full list of services and chars
		// Save it only once!
		if(!localStorage["deviceMacAddress"] && deviceObj.hasOwnProperty('services'))
    	localStorage["deviceMacAddress"] = JSON.stringify(deviceObj);		// save entire info of device
    
    console.log('\n============================================================' +
								'\n Connected!! \n' + t.targetDeviceObj.name + 
								'\nCurrent: ' + t.targetDeviceObj.address +
								'\nDefault: ' + ((localStorage["deviceMacAddress"]) ? JSON.parse(localStorage["deviceMacAddress"]).address : 'DNE') +
								//'\nActivity Track: ' + t.conState + 
								'\n============================================================\n');
    
    cordova.plugins.notification.local.schedule({
			id: 9,
			title: 'Connected',
			text: 'Connected to Device'
		});
		

		callViewHandler.ble_status_msg('#BLE-Status', deviceObj.name + ' Connected');
		
		/*
		// Order matters: sending password, start subscription, send FG/BG info
		t.startEnteringPassword();

		// Feb.14.2018 - For testing, initiate subscription
		// This needs to be before startReset. Needs data from device when connected.
		t.startSubscription(); 

		t.startReset(appBGFG);	// Let device know app is on BG or FG

		// Mar.09.2018 - For BG, don't even bother writing or reading or subscribing. 
		// because it'll disconnect right after startReset() success
		if(appBGFG == 8) {

			// Feb.05.2018 - Saving 'targetDeviceObj' takes time.	
			setTimeout(function(){
				// After connection events
				t.checkFirstTimeSinceBattery();
				t.writeSecondsUntilMidnight();
			},1000);
			
			setTimeout(function(){
				// Feb.02.2018 - Seconds of sunrise / sunset
				t.writeSecondsUntilSunTime();
			},2000);
			
			setTimeout(function(){
				t.startReadRealtime();
			},3000);
			
		}
		*/
		
		t.initAfterConnected();
		

	},

	device_state_disconnected: function (deviceObj) {
		
		this.device_state_disconnected_event(deviceObj);

	},

	device_state_error: function (err, deviceObj) {
		var t = this;

		console.log('**** Connection Error: [ ' + err + ' ]');
		callViewHandler.ble_status_msg('#BLE-Status', 'Error ' + err);
		t.androidErrorCounter.push(err);

		// Error: 8, 19, 22, 133, 257
		// 8 - BLE_HCI_CONNECTION_TIMEOUT
		// 19 - BLE_HCI_REMOTE_USER_TERMINATED_CONNECTION (Remote device has forced a disconnect.)
		// 22 - BLE_HCI_LOCAL_HOST_TERMINATED_CONNECTION
		// 133 - common error caused by multiple reasons
		// 257 - When this occurs, BLE unable to scan, connect
		// Mar.09.2018 - Since we decided to use JobScheduler for Android, 
		// make complete disconnection. It'll start from scanning every 15 min.
		// But for error msg 257, reset needed.
		if(myApp.device.os === 'android' || myApp.device.os === 'Android') {

			if(t.androidErrorCounter.length > 3) {
				evothings.ble.reset();
				setTimeout(() => {
					if(appBGFG == 7) t.startBGFetchEvent();
					else t.startConnecting(deviceObj);
				}, 5000)
			} 

			if(err == 133) {
				if(appBGFG == 7) t.startBGFetchEvent(deviceObj);
				else t.startConnecting(deviceObj);
			}
			else if(err == 257) {

				evothings.ble.reset();	// Mar.09.2018 - BLE unable to scan or connect in this error. Reset it.

				if(appBGFG == 8) t.startConnecting(deviceObj);	
				else t.disconnectDevice(deviceObj);

			} else {
				if(appBGFG == 8) t.startConnecting(deviceObj);	
				else t.disconnectDevice(deviceObj);
			}
			
		} else {
			if(err === 'device already connected') {

				// Mar.06.2018 - Issue:
				// BLE connection cycle -> App FG -> BG is good for one cycle. If another cycle happens, 'device already connected' happens.
				// Means, its not going to create another peripheral object. Thats all. 
				// if in connecting state, it'll stay connecting. <--- !!!!

			} else {
				//t.wait_then_connect(deviceObj);
			}
		} 
		
		

	},

	// Mar.07.2018 - Became a separate function for Android. (<- falls into Error 19)
	device_state_disconnected_event: function (deviceObj) {

		var t = this;
		console.log('\n============================================================' +
								'\n Disconnected!! ' + deviceObj.name +
								'\nCurrent: ' + deviceObj.address +
								'\nDefault: ' + ((localStorage["deviceMacAddress"]) ? JSON.parse(localStorage["deviceMacAddress"]).address : 'DNE') + 
								//'\nActivity Track: ' + t.conState + 
								'\n============================================================\n');
		
		cordova.plugins.notification.local.schedule({
			id: 9,
			title: 'Disconnected',
			text: 'Disconnected to Device'
		});

		callViewHandler.ble_status_msg('#BLE-Status', 'Disconnected...');

		// Because it takes time to run realtime and subscription.
		//
		setTimeout(function () {
			clearInterval(t.readRealtimeIntervalID);
			clearInterval(t.subscriptionTestInterval);
		}, 3000);

		
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
								'\nLatest User State : [ ' + t.userState[t.userState.length - 1] + ' ]' + 
								'\nEver READ DONE? [ ' + everWorked + ' ]' +
								'\n============================================================\n');

		if(t.userState.length > 0 && (t.userState[t.userState.length - 1] === t.userStateIndex.ENTER_PASSWORD || !everWorked)) {
			
			t.disconnectDevice(deviceObj);

			myApp.modal({
	      title: 'Password incorrect',
	      text: '',
	      verticalButtons: true,
	      buttons: [{
	        text: 'Ok'
	      }]
	    }); 

		} else {

			// For ios, we need this. 
			callViewHandler.ble_status_msg('#BLE-Status', 'Disconnected. Reconnecting...');
			callViewHandler.display_tester_deviceStatus('Disconnected. Reconnecting...');

			t.wait_then_connect(deviceObj);

		}
		
	},

	wait_then_connect: function (deviceObj) {
		var t = this;

		clearInterval(t.readRealtimeIntervalID);
		clearInterval(t.subscriptionTestInterval);
		clearTimeout(t.wait_then_connect_interval);

		var waitForDisconnectionTime = 6000; 
		if(appBGFG == 7) {
			// in BG, iOS should wait shorter because otherwise app gets suspended. (~4000 ms)
			// Android should wait longer because otherwise ble functions get ruined with error 257
			// (Unable to scan, connect, etc)
			if(myApp.device.os === 'android' || myApp.device.os === 'Android') waitForDisconnectionTime = 6000;  
			else waitForDisconnectionTime = 4000; 
		}	
		
		t.disconnectDevice();

		// Mar.06.2018 - On BG, start connecting to default address,
		// on FG, start scan for unlimited time until it finds device or certain conditions are met.
		t.wait_then_connect_interval = setTimeout(() => {
    	if(appBGFG == 7) {
    		t.startConnecting(JSON.parse(localStorage["deviceMacAddress"]));	// try connect to default address <--!!!
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

		clearInterval(t.readRealtimeIntervalID);
		clearInterval(t.subscriptionTestInterval);

		evothings.ble.stopScan();
		evothings.ble.close(deviceObj);
		// Be sure to disconnect default address too. (Somehow it doesn't clear peripheral for default address)
		if(localStorage["deviceMacAddress"]) evothings.ble.close(JSON.parse(localStorage["deviceMacAddress"]));

		t.conState.push(t.conStateIndex.DISCONNECTED);
		callViewHandler.ble_status_msg('#BLE-Status', 'Disconnecting...');
		callViewHandler.display_tester_deviceStatus('Disconnected');
		console.log('Disconnecting');
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
		var lastConnectionState = t.conState[t.conState.length - 1]; 

		return new Promise(function(resolve, reject) {
			if(t.targetDeviceObj && lastConnectionState === t.conStateIndex.CONNECTED) {
				evothings.ble.readCharacteristic(t.targetDeviceObj, characteristic, function(data){

					var dataTranslated = t.dataTranslation(data, expectDataType);
					t.userState.push(t.userStateIndex.READ_DONE);
		      resolve(dataTranslated);

		    }, function(err){
		    	console.log('Error Reading: ' + err);
		    	reject('Error Reading: ' + err);
		    });
			} else {
				reject('[Err Read] No Device info or not connected');
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
		var lastConnectionState = t.conState[t.conState.length - 1]; 

		return new Promise(function(resolve, reject) {
			if(t.targetDeviceObj && lastConnectionState === t.conStateIndex.CONNECTED) {
				evothings.ble.writeCharacteristic(t.targetDeviceObj, characteristic, data, function(){

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
      callViewHandler.ble_status_msg('#BLE-Status', 'Time since battery value (2nd Trial): ' + val);
    })
    .catch(function(err){
    	console.log('Error: ' + err);
    	callViewHandler.ble_status_msg('#BLE-Status', err);
    });

	},

	/* ===========================================================================
	Write seconds until midnight
	=========================================================================== */
	writeSecondsUntilMidnight: function () {

		var t = this;

		var serviceAddress1 = t.writeSecondsUntilMidnight_service;  
    var characteristicsAddress1 = t.writeSecondsUntilMidnight_char;  

    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);

    // Get seconds until midnight ======================================================
    var currentTime = new Date().getTime();
    //var timeDifference = new Date().getTimezoneOffset() * 60;	// to seconds	

    var midnight = new Date();
    midnight.setHours( 24 );
    midnight.setMinutes( 0 );
    midnight.setSeconds( 0 );
    midnight.setMilliseconds( 0 );

    var secondsUntilMidnight = parseInt((midnight.getTime() - currentTime) / 1000);

    // For testing, get seconds until next hour
    //var nextHour = new Date();
    //var nowHour = nextHour.getHours();
    //nextHour.setHours( nowHour + 1 );
    // =================================================================================
   
		console.log('Writing secondsUntilMidnight: ' + secondsUntilMidnight);
		return t.writeValue(characteristics1, new Uint32Array([secondsUntilMidnight]));
	},

	// Feb.02.2018 - sunset: 'upcoming' seconds until midnight, sunrise: 'upcoming' seconds from midnight
	// Feb.05.2018 - Ignore sunrise. Sunset: upcoming from current time.
	writeSecondsUntilSunTime: function (whichOne) {	// 0 - sunrise, 1 - sunset
		var t = this;

		var serviceAddress1 = t.writeSecondsUntilSuntime_service;  
    var characteristicsAddress1 = t.writeSecondsUntilSunrise_char;  
    var characteristicsAddress2 = t.writeSecondsUntilSunset_char;  

    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);
    var characteristics2 = evothings.ble.getCharacteristic(service1, characteristicsAddress2);

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
	 

    } else {
    	console.log('Weather Data Not exist...!!!!!!!');
    }

    console.log('Writing '+ ((whichOne == 0) ? 'Sunrise' : 'Sunset') + ': ' + secondsForSunrise + ', ' + secondsForSunset);
    
    if(whichOne == 0) {
    	return t.writeValue(characteristics1, new Uint32Array([secondsForSunrise]));
    } else {
    	return t.writeValue(characteristics2, new Uint32Array([secondsForSunset]));
    }

	},

	/* ===========================================================================
	Write Time to burn time
	=========================================================================== */
	writeTTB: function () {
		
		var t = this;

		var serviceAddress1 = t.writeTTB_service;  
    var characteristicsAddress1 = t.writeTTB_char;  

    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);

    var inputVal = $$('.content-block').find('input[name="inputTime"]').val();

    var currentEnvironment = t.currentEnvironment;
    var currentSkintype = t.currentSkintype;

    // Get TTB ======================================================
    if(isNaN(inputVal) || !inputVal) {
      // calculate
      var env,skintype,inputVal;
      if(currentEnvironment !== undefined && currentSkintype !== undefined) {

        switch(currentEnvironment) {
          case 0: env = 0.15; break;
          case 1: env = 0.8; break;
          case 2: env = 0.25; break;
          case 3: env = 0.4; break;
          case 4: env = 0.25; break;
          case 5: env = 0.25; break;
          default: env = 0.25; break;
        }

        switch(currentSkintype) {        // in seconds
          case 0: skintype = 67 * 1; break;
          case 1: skintype = 100 * 1; break;
          case 2: skintype = 200 * 1; break;
          case 3: skintype = 300 * 1; break;
          case 4: skintype = 400 * 1; break;
          case 5: skintype = 500 * 1; break;
          default: skintype = 67 * 1; break;
        }

        inputVal = (skintype / (1 + env));

      } else {
        inputVal = 60;
      }
    } else {
      inputVal = Number(inputVal);
    }
    // =================================================================================
    
    console.log('Writing TTB: ' + inputVal);
    return t.writeValue(characteristics1, new Float32Array([inputVal]));
		
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
				
				callViewHandler.display_realtimeResult(char1Val, char2Val, char3Val, char4Val,
																							char5Val, char6Val, char7Val, char8Val, 
																							char9Val, char11Val, char12Val, char13Val, 
																							char14Val, char15Val, char16Val, char17Val);


				t.batteryTestingData.push({
					currentTime: currTime,
					duration: char14Val,
					voltage: char12Val
				});

				callViewHandler.display_batteryData();

			})
			.catch(function(err){
				console.log('Stopping Realtime Reading...');
				callViewHandler.ble_status_msg('#BLE-Status', 'Error in realtime reading ' + err);
				//clearInterval(t.readRealtimeIntervalID);
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
	startReset: function (val) {

		var t = this;
		var serviceAddress1 = t.resetTTB_service;
    var characteristicsAddress1 = t.resetTTB_char;

    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);
   
    return t.writeValue(characteristics1, new Uint32Array([val]))

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
    	callViewHandler.ble_status_msg('#BLE-Status', 'Initiating OTA...');
    })
    .catch(function(err){
    	console.log('Error: ' + err);
    	callViewHandler.ble_status_msg('#BLE-Status', err);
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

        callViewHandler.display_reading_notificationData(dataCounter, data, dataArr[0], dataArr[1], dataArr[2], dataArr[3], dataArr[4]);
        
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
    	callViewHandler.ble_status_msg('#BLE-Status', 'Change UV: ' + userInputUV);
    	callViewHandler.display_uvChange(userInputUV);
    })
    .catch(function(err){
    	console.log('Error: ' + err);
    	callViewHandler.ble_status_msg('#BLE-Status', err);
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

    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);	// uint8
    var characteristics2 = evothings.ble.getCharacteristic(service1, characteristicsAddress2);	// uint8
    var characteristics3 = evothings.ble.getCharacteristic(service1, characteristicsAddress3);	// uint32
    var characteristics4 = evothings.ble.getCharacteristic(service1, characteristicsAddress4);	// uint32
    var characteristics5 = evothings.ble.getCharacteristic(service1, characteristicsAddress5);	// uint32

    // Testing for firstTimeSinceBattery in Subscription
    var characteristics6 = evothings.ble.getCharacteristic(service1, characteristicsAddress6);

    var counter = 0;

    console.log('Subscription Started....');
    clearInterval(t.subscriptionTestInterval);

    // dataTranslation

    var data0_prev, data1_prev, data2_prev, data3_prev, data4_prev;
    var dataObjArrayPrev = [];
    var dataObjArrayCurr = [];


    	evothings.ble.enableNotification(t.targetDeviceObj, characteristics1, function(buffer) {

	    	var data = t.dataTranslation(buffer, 'Uint8');
				console.log('[Subscription] 2005 data: ' + data);

				var argObj = {
					'id': 0,
					'data': data
				}

				dataObjArrayCurr.push(argObj);
				
				//allDataColected(argObj);
				
			}, function(err){
	      console.log('Error in subscription characteristics1: ' + err);
	    });

	    evothings.ble.enableNotification(t.targetDeviceObj, characteristics2, function(buffer) {

	    	var data = t.dataTranslation(buffer, 'Int32');
				console.log('[Subscription] 2006 data: ' + data);
				
				var argObj = {
					'id': 1,
					'data': data
				}
				
				dataObjArrayCurr.push(argObj);

				//allDataColected(argObj);

			}, function(err){
	      console.log('Error in subscription characteristics2: ' + err);
	    });

	    evothings.ble.enableNotification(t.targetDeviceObj, characteristics3, function(buffer) {
	    	var data = t.dataTranslation(buffer, 'Uint32');
				console.log('[Subscription] 2007 data: ' + data);
				
				var argObj = {
					'id': 2,
					'data': data
				}

				dataObjArrayCurr.push(argObj);
				
				//allDataColected(argObj);

			}, function(err){
	      console.log('Error in subscription characteristics3: ' + err);
	    });

	    evothings.ble.enableNotification(t.targetDeviceObj, characteristics4, function(buffer) {
	    	var data = t.dataTranslation(buffer, 'Uint32');
				console.log('[Subscription] 2008 data: ' + data);
				
				var argObj = {
					'id': 3,
					'data': data
				}

				dataObjArrayCurr.push(argObj);

				// Mar.06.2018 - This is TTB data. Update Local notification if needed
				var id = 99;
				var now = new Date().getTime(),
    				sec_from_now = new Date(now + (data * 1000));

				if(data < 50000) {	// TTB > 0  and app in BG
					
					cordova.plugins.notification.local.clear(id, function() {

						cordova.plugins.notification.local.schedule({
				      id: id,
				      trigger: {
				      	at: sec_from_now
				      },
				      title: 'Device tester',
				      text: 'TTB is Over: ' + data + ' s' + '. Preset from App'
					  });
					  console.log(id + ': Notification Created -> ' + data + ' s');

					});

				} else {
					console.log('3: Data updated => ' + data + ', App is in ' + appBGFG);

					cordova.plugins.notification.local.clear(id, function() {

						sec_from_now = new Date(now + (2 * 1000));

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

				//allDataColected(argObj);

			}, function(err){
	      console.log('Error in subscription characteristics4: ' + err);
	    });

	    evothings.ble.enableNotification(t.targetDeviceObj, characteristics5, function(buffer) {
	    	var data = t.dataTranslation(buffer, 'Uint32');
				console.log('[Subscription] 2009 data: ' + data);
				
				var argObj = {
					'id': 4,
					'data': data
				}
				
				dataObjArrayCurr.push(argObj);

				//allDataColected(argObj);

			}, function(err){
	      console.log('Error in subscription characteristics5: ' + err);
	    });

	    evothings.ble.enableNotification(t.targetDeviceObj, characteristics6, function(buffer) {
	    	var data = t.dataTranslation(buffer, 'Uint8');
				console.log('[Subscription] First Time since battery data: ' + data);
				
				var argObj = {
					'id': 5,
					'data': data
				}
				
				dataObjArrayCurr.push(argObj);

				//allDataColected(argObj);

			}, function(err){
	      console.log('Error in subscription characteristics6: ' + err);
	    });



	  // Mike asked for this way. 
    // Wait until certain moment then display whatever changed
    t.subscriptionTestInterval = setInterval(function(){
    		
    	// if current is different from previous, display. 
    	// current array length > 0
    	// length of two array different, 
    	// if length is the same, comapre each element
    	if(dataObjArrayCurr.length > 0) {

    		if(dataObjArrayCurr.length !== dataObjArrayPrev.length) {

    			callViewHandler.display_subscription(dataObjArrayCurr);
    			dataObjArrayPrev = dataObjArrayCurr.slice();
    			dataObjArrayCurr = [];

    		} else {

    			// if arrays are not identical,
    			if(!(JSON.stringify(dataObjArrayCurr) === JSON.stringify(dataObjArrayPrev))) {

    				t.userState.push(t.userStateIndex.SUB_DONE);
    				callViewHandler.display_subscription(dataObjArrayCurr);
    				dataObjArrayPrev = dataObjArrayCurr.slice();
    				dataObjArrayCurr = [];

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
	startEnteringPassword: function () {

		var t = this;
		var serviceAddress1 = t.customPassword_service;
    var characteristicsAddress1 = t.customPassword_char;

    console.log('Writing for Password...');

    var service1 = evothings.ble.getService(t.targetDeviceObj, serviceAddress1);
    var characteristics1 = evothings.ble.getCharacteristic(service1, characteristicsAddress1);
   
    return t.writeValue(characteristics1, new Uint32Array([t.userPassword]));

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
	Mar.14.2018 - Group of init process after connected
	in Background, try not read or write. Because after 'startReset', it'll disconnect from device anyway.
	=========================================================================== */
	initAfterConnected: function () {
		var t = this;

		t.startEnteringPassword()
		.then(() => {
			console.log('Writing password Done...');
    	t.userState.push(t.userStateIndex.ENTER_PASSWORD);
    	callViewHandler.ble_status_msg('#BLE-Status', 'Password entered: ' + t.userPassword);
    	
    	t.startSubscription(); 
			return t.startReset(appBGFG);
		})
		.then(() => {
			console.log('Writing FG/BG Done...');
    	callViewHandler.ble_status_msg('#BLE-Status', 'Writing FG/BG Done');

			if(appBGFG == 8) return t.writeSecondsUntilMidnight();
			else return true;
		})
		.then(() => {

			if(appBGFG == 8) {
				console.log('Writing Midnight done...');
	    	callViewHandler.ble_status_msg('#BLE-Status', 'Write Seconds until midnight done');

				return t.writeTTB();
			} else return true;
			
		})
		.then(() => {

			if(appBGFG == 8) {
				console.log('Writing TTB done...');
	    	callViewHandler.ble_status_msg('#BLE-Status', 'Write TTB done');

				return t.writeSecondsUntilSunTime(1);	// sunset
			} else return true;
			
		})
		.then(() => {

			if(appBGFG == 8) {
				console.log('Writing Sunset done...');
	    	callViewHandler.ble_status_msg('#BLE-Status', 'Writing Sunset done');

				return t.writeSecondsUntilSunTime(0); // sunrise
			} else return true;
			
		})
		.then(() => {

			if(appBGFG == 8) {
				console.log('Writing Sunrise done...');
	    	callViewHandler.ble_status_msg('#BLE-Status', 'Writing Sunrise done');

	    	//t.checkFirstTimeSinceBattery();
	    	t.startReadRealtime();
			} else return true;
			
		})
		.catch(function(err){
    	console.log('Error: ' + err);
    	callViewHandler.ble_status_msg('#BLE-Status', err);
    });

	}

}



