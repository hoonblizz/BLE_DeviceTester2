// Written Feb.06.2018
// https://developer.apple.com/library/content/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/CoreBluetoothBackgroundProcessingForIOSApps/PerformingTasksWhileYourAppIsInTheBackground.html
// https://stackoverflow.com/questions/21812161/ios-core-bluetooth-state-preservation-and-restoration-issues
// 'Efficient way to handle BLE'
// https://developer.apple.com/library/content/documentation/Performance/Conceptual/EnergyGuide-iOS/BluetoothBestPractices.html
// For Background event, 
// Assume device is connected at least once on Foreground
// When out of range, call 'connect' (connectPeripheral:options:)
// To keep it alive in background, repeat reading

// Mar.04 - came up with new background algorithm that saves a lot of bettery of the device.

function cBleEventHandlerBG () {

	this.keepingAliveIntervalID = 0;
	this.backgroundEnteredTime = 0;		// epoch
}

cBleEventHandlerBG.prototype = {

	reconnect: function (deviceObj) {
		var t = this;
		evothings.ble.connectToDevice(deviceObj, function(){
			callBleEventHandler.conState.push(callBleEventHandler.conStateIndex.CONNECTED);
			t.startKeepingAliveInBG(deviceObj);
		}, function(){
			callBleEventHandler.conState.push(callBleEventHandler.conStateIndex.DISCONNECTED);
			console.log('Disconnected in BG. Reconnect...');
			callViewHandler.ble_status_msg('#BLE-Status', 'Disconnected in BG. Reconnect...');
			t.reconnect(deviceObj);
		}, function(err){
			callBleEventHandler.conState.push(callBleEventHandler.conStateIndex.DISCONNECTED);
			console.log('Error in Reconnection BG: ' + err);
			callViewHandler.ble_status_msg('#BLE-Status', 'Error in Reconnection BG: ' + err);
			t.reconnect(deviceObj);
		}, { discoverServices: true });
	},

	// Feb.06.2018 - Decided to read TTB + Sunscreen
	startKeepingAliveInBG: function (deviceObj) {
		var t = this;

		clearInterval(t.keepingAliveIntervalID);
		var messageCounter = 0;

		var char3Val, char4Val;
		var serviceAddress1 = callBleEventHandler.startReadRealtime_service1;
		var characteristicsAddress3 = callBleEventHandler.startReadRealtime_char3;    
    var characteristicsAddress4 = callBleEventHandler.startReadRealtime_char4; 

    var service1 = evothings.ble.getService(deviceObj, serviceAddress1);
    var characteristics3 = evothings.ble.getCharacteristic(service1, characteristicsAddress3);
    var characteristics4 = evothings.ble.getCharacteristic(service1, characteristicsAddress4);

		t.keepingAliveIntervalID = setInterval(function () {

			callBleEventHandler.readValue(characteristics3, 'Uint32')
			.then(function (val) {
				char3Val = val;
				return callBleEventHandler.readValue(characteristics4, 'Uint32');
			})
			.then(function (val) {
				char4Val = val;

				var totalTTB = (char3Val[0] + char4Val[0]);

				var timePassed = (parseInt(new Date().getTime() / 1000) - t.backgroundEnteredTime);
				var message = '['+ timePassed +' s] Background alive: ';
				console.log(message);

				messageCounter++;
		
				
			})
			.catch(function (err) {
				console.log('Error in Keeping Alive: ' + err);
				callViewHandler.ble_status_msg('#BLE-Status', 'Error in Keeping Alive: ' + err);
				if(err === 'device not found') {
					callBleBGEventHandler.reconnect(deviceObj);
				}
			});

		},2000);
	},

	getTTB: function () {

	},

	// iOS
	notifyDevice_AppOnBG_iOS: function () {

		callBleEventHandler.startReset(7);

	},

	notifyDevice_AppOnFG_iOS: function () {

		callBleEventHandler.startReset(8);

	},

	// Android
	notifyDevice_AppOnBG_android: function () {

		callBleEventHandler.startReset(9);

	},

	notifyDevice_AppOnFG_android: function () {

		callBleEventHandler.startReset(10);

	},

}