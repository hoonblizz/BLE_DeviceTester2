function cClickEventHandler() {

}


cClickEventHandler.prototype = {

	init: function() {
		this.init_navbar();
		this.init_main();
		this.init_bytes();
		this.init_uvChanger();
	},

	init_navbar: function () {

		$$('#Navbar_rightButton').on('click', function (e) {
	    var buttons = [
	    {
	      text: 'Initiate OTA',
	      onClick: function () {
	      	if(callBleEventHandler.targetDeviceObj) {
			      myApp.modal({
			        title: 'Initiate OTA?',
			        text: '',
			        buttons: [
			        {
			          text: 'Yes',
			          onClick: function () {  
			          	callBleEventHandler.startOTA();
			          }
			        },
			        {
			          text: 'No'
			        },
			        ]
			      });

			    } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    },
	    {
	      text: 'Check Password',
	      onClick: function () {
	      	myApp.modal({
		        title: callBleEventHandler.userPassword,
		        text: 'is your current password',
		        verticalButtons: true,
		        buttons: [
		        {
		          text: 'Change Password',
		          onClick: function () {  
		          	callBleEventHandler.generatePassword();
		          }
		        },
		        {
		          text: 'Ok'
		        },
		        ]
		      });
	      }
	    },
	    {
	      text: 'Reset Name and Connect',
	      onClick: function () {

	      	var waitingTime = 1000;
	      	
	      	callViewHandler.ble_status_msg('#BLE-Status', 'Registered device Name deleted: ' + localStorage["deviceName"]);
	      	console.log('Reset only Name saved: ' + localStorage["deviceName"]);
	      	localStorage["deviceName"] = '';

	      	callViewHandler.clear_subscription();	// Mar.22.2018 - Clear subscription data list
					callViewHandler.display_deviceName('');	// Mar.22.2018 - Clear 
					
	      	if(callBleEventHandler.targetDeviceObj) {
	      		if(callBleEventHandler.conState[callBleEventHandler.conState.length - 1] !== callBleEventHandler.conStateIndex.DISCONNECTED) {
	      			callBleEventHandler.disconnectDevice(callBleEventHandler.targetDeviceObj);
	      			waitingTime = 3000;
	      		}
	      	}
	      	myApp.showPreloader('Please wait...');

	      	setTimeout(() => {
	      		myApp.hidePreloader();
	      		callBleEventHandler.startBLEProcess();
	      	}, waitingTime);
	        
	        
	      }
	    },
	    /*
	    {
	      text: 'Reset All and Connect',
	      onClick: function () {

	      	var waitingTime = 1000;
	      	
	      	callViewHandler.ble_status_msg('#BLE-Status', 'Registered device address and name deleted...');
	      	console.log('Reset All saved...');
	      	localStorage["deviceName"] = '';
	      	localStorage["deviceMacAddress"] = '';

	      	callViewHandler.clear_subscription();	// Mar.22.2018 - Clear subscription data list
					callViewHandler.display_deviceName('');	// Mar.22.2018 - Clear 
					
	      	if(callBleEventHandler.targetDeviceObj) {
	      		if(callBleEventHandler.conState[callBleEventHandler.conState.length - 1] !== callBleEventHandler.conStateIndex.DISCONNECTED) {
	      			callBleEventHandler.disconnectDevice(callBleEventHandler.targetDeviceObj);
	      			waitingTime = 3000;
	      		}
	      	}
	      	myApp.showPreloader('Please wait...');

	      	setTimeout(() => {
	      		myApp.hidePreloader();
	      		callBleEventHandler.startBLEProcess();
	      	}, waitingTime);
	        
	        
	      }
	    },
	    */
	    {
	      text: 'Disconnect',
	      onClick: function () {
	      	evothings.ble.stopScan();
	        if(callBleEventHandler.targetDeviceObj) {
						
	        	// Clear intervals if needed
	        	
	          callBleEventHandler.disconnectDevice(callBleEventHandler.targetDeviceObj);

	          //callViewHandler.ble_status_msg('#BLE-Status', 'Registered device address deleted: ' + localStorage["deviceMacAddress"]);
	        	//localStorage["deviceMacAddress"] = '';

	        } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    },
	    {
	      text: 'Connect (or Scan)',
	      onClick: function () {
	        //callBleEventHandler.startScanning();
	        callBleEventHandler.startBLEProcess();
	      }
	    }
	    ];
	    myApp.actions(buttons);
	  });


	  $$('#Navbar_leftButton').on('click', function (e) {
	  	var buttons = [
	    {
	      text: 'Display Datalog',
	      onClick: function () {
	      	callDatalogHandler.start_datalog();
	      }
	    },
	    {
	      text: 'Download Datalog',
	      onClick: function () {
	      	if(callBleEventHandler.targetDeviceObj) {
			    	callBleEventHandler.startNotification();
			    } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    }
	    ]
	  	myApp.actions(buttons);
	  });

	},

	init_main: function () {

		$$('.skintypeSelection').on('click', function (e) {

			function clickEvent(j) {
        return function() {

          var prevSkinType = callBleEventHandler.currentSkintype;
	        callBleEventHandler.currentSkintype = j;

	        if(callBleEventHandler.targetDeviceObj) {
	        	// Mar.19.2018 - Recalculate for local TTB display (without device data)
			      callBleEventHandler.writeTTB()
			      .then(() => {

			      	callBleEventHandler.prevSkintype = prevSkinType; // Mar.23.2018 - Need previous settings 
			      	callViewHandler.display_skinEnv(j, callBleEventHandler.currentEnvironment);
			      	callBleEventHandler.saveSkinEnv();

			      	// Mar.23.2018 - Skin and Env use different calculation methods
			      	//callBleEventHandler.appCalculationNeeded();
			      	callBleEventHandler.appCalculationNeeded_skinEnv(prevSkinType, callBleEventHandler.currentEnvironment, j, callBleEventHandler.currentEnvironment, 'app');

			      	callBleEventHandler.initTTBTrackArr.push(callBleEventHandler.getLatestInitTTB());	// will be used to recalculate TTB
			      	
			      })
			      .catch((err) => {
			      	console.log('Error Writing Skintype: ' + err);
			      });
			    } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	        
        }
      }

			var modalButtons = [];

      // Create buttons
      for(var i = 0; i < 6; i++) {
        modalButtons.push({
          text: i,
          onClick: clickEvent(i)
        });
      }

	    myApp.actions(modalButtons);

	  });

	  $$('.environmentSelection').on('click', function (e) {

			function clickEvent(j) {
        return function() {

          var prevEnvironment = callBleEventHandler.currentEnvironment;
	        callBleEventHandler.currentEnvironment = j;

	        if(callBleEventHandler.targetDeviceObj) {
	        	// Mar.19.2018 - Recalculate for local TTB display (without device data)
			      callBleEventHandler.writeTTB()
			      .then(() => {

			      	callBleEventHandler.prevEnvironment = prevEnvironment; // Mar.23.2018 - Need previous settings 
			      	callViewHandler.display_skinEnv(callBleEventHandler.currentSkintype, j);
			      	callBleEventHandler.saveSkinEnv();

			      	// Mar.23.2018 - Skin and Env use different calculation methods
			      	//callBleEventHandler.appCalculationNeeded();
			      	callBleEventHandler.appCalculationNeeded_skinEnv(callBleEventHandler.currentSkintype, prevEnvironment, callBleEventHandler.currentSkintype, j, 'app');

			      	callBleEventHandler.initTTBTrackArr.push(callBleEventHandler.getLatestInitTTB());	// will be used to recalculate TTB
			      	
			      })
			      .catch((err) => {
			      	console.log('Error Writing Environment: ' + err);
			      });
			    } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	        
        }
      }

			var modalButtons = [];

      // Create buttons
      for(var i = 0; i < 6; i++) {
        modalButtons.push({
          text: i,
          onClick: clickEvent(i)
        });
      }

	    myApp.actions(modalButtons);

	  });

	  // Mar.22.2018 - Added for shortcut
	  $$('.uvSelection').on('click', function (e) {

	  	function clickEvent(j) {
        return function() {
        	if(j !== 9) {
        		callBleEventHandler.startUVChange(j);
        	} else {
        		callBleEventHandler.startUVChange(15);	// read from device
        	}
        	callViewHandler.display_uvChange(j);
        }
      }

	  	var modalButtons = [];

	  	// Create buttons
      for(var i = 0; i < 10; i++) {
      	if(i !== 3 && i !== 5 && i !== 6 && i !== 7) {
      		modalButtons.push({
	          text: ((i == 9) ? 'Measure from Device' : i),
	          onClick: clickEvent(i)
	        });
      	}
      }

	    myApp.actions(modalButtons);

	  });

	  $$('#TTB_actionButton').on('click', function (e) {

    	var buttons = [
     	{
	      text: 'Write TTB',
	      onClick: function () {
	        if(callBleEventHandler.targetDeviceObj) {
			      callBleEventHandler.writeTTB();
			    } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    },
	    {
	      text: 'Start Infinite Writing',
	      onClick: function () {
	        if(callBleEventHandler.targetDeviceObj) {
			      callBleEventHandler.writingTest();
			    } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    },
	    {
	      text: 'Stop Infinite Writing',
	      onClick: function () {
	        if(callBleEventHandler.targetDeviceObj) {
			      callBleEventHandler.infiniteWritingTestStart = false;
			    } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    },
	    {
	      text: 'Start Realtime',
	      onClick: function () {
	        callBleEventHandler.startReadRealtime();
	      }
	    },
	    {
	      text: 'Stop Realtime',
	      onClick: function () {
	        callBleEventHandler.stopReadRealtime();
	      }
	    },
	    {
	      text: 'Stop Subscription',
	      onClick: function () {
	        callBleEventHandler.stopSubscription();
	      }
	    },
	    {
	      text: 'Reset TTB',
	      onClick: function () {
	      	if(callBleEventHandler.targetDeviceObj) {
	        	callBleEventHandler.startReset(3);
	        } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    },
	    {
	      text: 'Reset Sunscreen',
	      onClick: function () {
	        if(callBleEventHandler.targetDeviceObj) {
	        	callBleEventHandler.startReset(2)
	        	.then(() => {
	        		console.log('Reset SS Done...');
	        		callBleEventHandler.ss_fromDevice = 0;	// reset in local then update when device sends data.
	        	})
	        	.catch((err) => {
	        		console.log('Error Reset SS: ' + err);
	        	});
	        } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    }
	    ];
	    myApp.actions(buttons);

	  });

	  $$('.writeTTBBtn').on('click', function (e) {
	    if(callBleEventHandler.targetDeviceObj) {
	      callBleEventHandler.writeTTB()
	      .then(() => {

	      })
	      .catch((err) => {
	      	console.log('Error Writing TTB: ' + err);
	      });
	    } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	  });

	  // Jan.10.2018 - For exporting battery data
	  $$('.button#batteryTester_export_email').on('click', function (e) {

	  	console.log('File -> Email: ' + callBleEventHandler.batteryTestingData.length);

	  	callDatalogHandler.exportCSVFile(callBleEventHandler.batteryTestingData_fileName);

	  });

	  $$('#batteryTester_export_file').on('click', function (e) {

	  	console.log('Data -> File: ' + callBleEventHandler.batteryTestingData.length);
	  	callDatalogHandler.mergeCSVFile(callBleEventHandler.batteryTestingData_fileName, callDatalogHandler.createCSVDataString_batteryTester());
	  	
	  });

	},

	init_datalog: function () {

		function datalogEmpty() {
			myApp.modal({
	      title: 'Datalog Required!',
	      text: '',
	      verticalButtons: true,
	      buttons: [{
	        text: 'Ok'
	      }]
	    }); 
		}

		$$('#notification-display-raw').on('click', function (e) {
      callViewHandler.display_datalog_rawData(callBleEventHandler.notificationDataCollected);
    });
    $$('#notification-display-real').on('click', function (e) {
      callViewHandler.display_datalog_realData(callBleEventHandler.notificationDataAnalyzed);
    });
    $$('#notification-datalog-export-real').on('click', function (e) {
    	if(callBleEventHandler.notificationDataAnalyzed.length > 0) {

    		callDatalogHandler.createCSVFile_export(callBleEventHandler.createCSVDataString_fileName, callDatalogHandler.createCSVDataString_datalog_real(), 'QSun Datalog Export - Real');
    	
    	} else datalogEmpty();
    	
    });
    $$('#notification-datalog-export-raw').on('click', function (e) {
    	if(callBleEventHandler.notificationDataCollected.length > 0) {

    		callDatalogHandler.createCSVFile_export(callBleEventHandler.createCSVDataString_raw_fileName, callDatalogHandler.createCSVDataString_datalog_raw(), 'QSun Datalog Export - Raw');
    	
    	} else datalogEmpty();
    	
    });
	},

	init_bytes: function () {

		$$('#bytesSendButton').on('click', function (e) {
      if(callBleEventHandler.targetDeviceObj) {
      	callBleEventHandler.startSendingBytes();
      } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
    });

		$$('#bytesSaveButton').on('click', function (e) {
	    localStorage["byteService"] = $$('.content-block .row').find('input[name="byteService"]').val();
	    localStorage["byteCharacteristic"] = $$('.content-block .row').find('input[name="byteCharacteristic"]').val();
	  });

	  $$('#bytesLoadButton').on('click', function (e) {
	    var savedByteService = localStorage["byteService"];
		  if(savedByteService) {
		    $$('.content-block .row').find('input[name="byteService"]').val(savedByteService);
		    $$('.content-block .row').find('input[name="byteService"]').attr('placeholder', savedByteService);
		  }

		  var savedByteCharacteristic = localStorage["byteCharacteristic"];
		  if(savedByteCharacteristic) {
		    $$('.content-block .row').find('input[name="byteCharacteristic"]').val(savedByteCharacteristic);
		    $$('.content-block .row').find('input[name="byteCharacteristic"]').attr('placeholder', savedByteCharacteristic);
		  }
	  });

	  $$('#bytesClearButton').on('click', function (e) {
	    for(var i = 0; i < 10; i++) {
	      $$('.content-block .row').find('input[name="byteElement'+ i +'"]').val('');
	    }
	  });

	  // Special buttons (ex. reset device)
		$$('#send4Button').on('click', function (e) {
	    if(callBleEventHandler.targetDeviceObj) {
      	callBleEventHandler.startReset(4);
      } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	  });
	  $$('#send5Button').on('click', function (e) {
	    if(callBleEventHandler.targetDeviceObj) {
      	callBleEventHandler.startReset(5);
      } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	  });
	  $$('#send6Button').on('click', function (e) {
	    if(callBleEventHandler.targetDeviceObj) {
      	callBleEventHandler.startReset(6);
      } else callViewHandler.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	  });

	},

	init_uvChanger: function () {

		var t = this;

		function uvChanger(j) {
	    return function(event) {

	      var uvValue = j;
	        
	      // random box
	      if(j == 13) {
	        uvValue = t.getRandomInt(0, 12);
	      }

	      callBleEventHandler.startUVChange(uvValue);

	    }
	  }

		for(var i = 0; i < 14; i++) $$(document).on('click', '.row .uvBtn_' + i, uvChanger(i));

		$$('.row .uvBtn_real').on('click', function (e) {
	    callBleEventHandler.startUVChange(15);
	  });

	},

	getRandomInt: function (min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
 
}