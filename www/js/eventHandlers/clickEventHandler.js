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
	      	if(mBLE.targetDeviceObj) {
			      myApp.modal({
			        title: 'Initiate OTA?',
			        text: '',
			        buttons: [
			        {
			          text: 'Yes',
			          onClick: function () {  
			          	mBLE.startOTA();
			          }
			        },
			        {
			          text: 'No'
			        },
			        ]
			      });

			    } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    },
	    {
	      text: 'Check Password',
	      onClick: function () {
	      	myApp.modal({
		        title: mBLE.userPassword,
		        text: 'is your current password',
		        verticalButtons: true,
		        buttons: [
		        {
		          text: 'Change Password',
		          onClick: function () {  
		          	mBLE.generatePassword();
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

	      	if(mBLE.getConState() === mBLE.conStateIndex.DISCONNECTED) {
	      		var waitingTime = 1000;
	      	
		      	vBLE.ble_status_msg('#BLE-Status', 'Registered device Name deleted: ' + localStorage["deviceName"]);
		      	console.log('Reset only Name saved: ' + localStorage["deviceName"]);
		      	localStorage["deviceName"] = '';

		      	// Jun.01.2018 - To connect to other device?? Issue?
		      	// June.26.2018 - For iOS, don't delete address. 
		      	if(myApp.device.os === 'android' || myApp.device.os === 'Android') localStorage["deviceMacAddress"] = '';

		      	mBLE.targetDeviceObj = null;		// Jun.01.2018 - For Android

		      	vBLE.clear_subscription();	// Mar.22.2018 - Clear subscription data list
						vBLE.display_deviceName('');	// Mar.22.2018 - Clear 
						
		      	if(mBLE.targetDeviceObj) {
		      		if(mBLE.getConState() !== mBLE.conStateIndex.DISCONNECTED) {
		      			mBLE.disconnectDevice(mBLE.targetDeviceObj);
		      			waitingTime = 3000;
		      		}
		      	}
		      	myApp.showPreloader('Please wait...');

		      	setTimeout(() => {
		      		myApp.hidePreloader();
		      		mBLE.startBLEProcess();
		      	}, waitingTime);
	        
	      	} else {
	      		myApp.modal({
			        title: '',
			        text: 'Disconnect QSun and try again',
			        verticalButtons: true,
			        buttons: [
			        {
			          text: 'Ok'
			        }
			        ]
			      });
	      	}
	      	
	        
	      }
	    },
	    {
	      text: 'Disconnect',
	      onClick: function () {
	      	evothings.ble.stopScan();
	        if(mBLE.targetDeviceObj) {
						
	        	// Clear intervals if needed
	        	
	          mBLE.disconnectDevice(mBLE.targetDeviceObj);

	          //vBLE.ble_status_msg('#BLE-Status', 'Registered device address deleted: ' + localStorage["deviceMacAddress"]);
	        	//localStorage["deviceMacAddress"] = '';

	        } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    },
	    {
	      text: 'Connect (or Scan)',
	      onClick: function () {
	        //mBLE.startScanning();
	        mBLE.startBLEProcess();
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
	      	if(mBLE.targetDeviceObj) {
			    	mBLE.startNotification();
			    } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
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

          var prevSkinType = mBLE.currentSkintype;
	        mBLE.currentSkintype = j;

	        if(mBLE.targetDeviceObj) {
	        	// Mar.19.2018 - Recalculate for local TTB display (without device data)
	        	// June.21.2018 - changed
	        	var inputVal = mBLE.calcWriteTTBValue(mBLE.currentSkintype, mBLE.currentEnvironment);
			      mBLE.writeTTB(inputVal, 3, true)
			      .then(() => {

			      	mBLE.prevSkintype = prevSkinType; // Mar.23.2018 - Need previous settings 
			      	vBLE.display_skinEnv(j, mBLE.currentEnvironment);
			      	mBLE.saveSkinEnv();

			      	// Mar.23.2018 - Skin and Env use different calculation methods
			      	//mBLE.appCalculationNeeded();
			      	//mBLE.appCalculationNeeded_skinEnv(prevSkinType, mBLE.currentEnvironment, j, mBLE.currentEnvironment, 'app');

			      	mBLE.initTTBTrackArr.push(mBLE.getLatestInitTTB());	// will be used to recalculate TTB
			      	
			      })
			      .catch((err) => {
			      	console.log('Error Writing Skintype: ' + err);
			      });
			    } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	        
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

          var prevEnvironment = mBLE.currentEnvironment;
	        mBLE.currentEnvironment = j;

	        if(mBLE.targetDeviceObj) {
	        	// Mar.19.2018 - Recalculate for local TTB display (without device data)
			      // June.21.2018 - changed
	        	var inputVal = mBLE.calcWriteTTBValue(mBLE.currentSkintype, mBLE.currentEnvironment);
			      mBLE.writeTTB(inputVal, 3, true)
			      .then(() => {

			      	mBLE.prevEnvironment = prevEnvironment; // Mar.23.2018 - Need previous settings 
			      	vBLE.display_skinEnv(mBLE.currentSkintype, j);
			      	mBLE.saveSkinEnv();

			      	// Mar.23.2018 - Skin and Env use different calculation methods
			      	//mBLE.appCalculationNeeded();
			      	//mBLE.appCalculationNeeded_skinEnv(mBLE.currentSkintype, prevEnvironment, mBLE.currentSkintype, j, 'app');

			      	mBLE.initTTBTrackArr.push(mBLE.getLatestInitTTB());	// will be used to recalculate TTB
			      	
			      })
			      .catch((err) => {
			      	console.log('Error Writing Environment: ' + err);
			      });
			    } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	        
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
        		mBLE.startUVChange(j);
        	} else {
        		mBLE.startUVChange(15);	// read from device
        	}
        	vBLE.display_uvChange(j);
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
	        if(mBLE.targetDeviceObj) {
			      // June.21.2018 - changed
	        	var inputVal = mBLE.calcWriteTTBValue(mBLE.currentSkintype, mBLE.currentEnvironment);
			      mBLE.writeTTB(inputVal, 3, true)
			    } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    },
	    {
	      text: 'Start Infinite Writing',
	      onClick: function () {
	        if(mBLE.targetDeviceObj) {
			      mBLE.writingTest();
			    } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    },
	    {
	      text: 'Stop Infinite Writing',
	      onClick: function () {
	        if(mBLE.targetDeviceObj) {
			      mBLE.infiniteWritingTestStart = false;
			    } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    },
	    {
	      text: 'Start Realtime',
	      onClick: function () {
	        mBLE.startReadRealtime();
	      }
	    },
	    {
	      text: 'Stop Realtime',
	      onClick: function () {
	        mBLE.stopReadRealtime();
	      }
	    },
	    {
	      text: 'Stop Subscription',
	      onClick: function () {
	        mBLE.stopSubscription();
	      }
	    },
	    {
	      text: 'Reset TTB',
	      onClick: function () {
	      	if(mBLE.targetDeviceObj) {
	        	mBLE.startReset(3);
	        } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    },
	    {
	      text: 'Reset Sunscreen',
	      onClick: function () {
	        if(mBLE.targetDeviceObj) {
	        	mBLE.startReset(2)
	        	.then(() => {
	        		console.log('Reset SS Done...');
	        		mBLE.ss_fromDevice = 0;	// reset in local then update when device sends data.
	        	})
	        	.catch((err) => {
	        		console.log('Error Reset SS: ' + err);
	        	});
	        } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	      }
	    }
	    ];
	    myApp.actions(buttons);

	  });

	  $$('.writeTTBBtn').on('click', function (e) {
	    if(mBLE.targetDeviceObj) {
	      // June.21.2018 - changed
      	var inputVal = mBLE.calcWriteTTBValue(mBLE.currentSkintype, mBLE.currentEnvironment);
	      mBLE.writeTTB(inputVal, 3, true)
	      .then(() => {

	      })
	      .catch((err) => {
	      	console.log('Error Writing TTB: ' + err);
	      });
	    } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	  });

	  // Jan.10.2018 - For exporting battery data
	  /*
	  $$('.button#batteryTester_export_email').on('click', function (e) {

	  	console.log('File -> Email: ' + mBLE.batteryTestingData.length);

	  	callDatalogHandler.exportCSVFile(mBLE.batteryTestingData_fileName);

	  });

	  $$('#batteryTester_export_file').on('click', function (e) {

	  	console.log('Data -> File: ' + mBLE.batteryTestingData.length);
	  	callDatalogHandler.mergeCSVFile(mBLE.batteryTestingData_fileName, callDatalogHandler.createCSVDataString_batteryTester());
	  	
	  });
	  */


	  // June.26.2018 - Adding for Testing new variables
	  $$('#resetButton_21').on('click', function (e) { mBLE.startReset(21, 3, true); });
	  $$('#resetButton_22').on('click', function (e) { mBLE.startReset(22, 3, true); });
	  $$('#resetButton_23').on('click', function (e) { mBLE.startReset(23, 3, true); });
	  $$('#resetButton_24').on('click', function (e) { mBLE.startReset(24, 3, true); });
	  $$('#resetButton_25').on('click', function (e) { mBLE.startReset(25, 3, true); });
	  $$('#resetButton_26').on('click', function (e) { mBLE.startReset(26, 3, true); });

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
      vBLE.display_datalog_rawData(mBLE.notificationDataCollected);
    });
    $$('#notification-display-real').on('click', function (e) {
      vBLE.display_datalog_realData(mBLE.notificationDataAnalyzed);
    });
    $$('#notification-datalog-export-real').on('click', function (e) {
    	if(mBLE.notificationDataAnalyzed.length > 0) {

    		callDatalogHandler.createCSVFile_export(mBLE.createCSVDataString_fileName, callDatalogHandler.createCSVDataString_datalog_real(), 'QSun Datalog Export - Real');
    	
    	} else datalogEmpty();
    	
    });
    $$('#notification-datalog-export-raw').on('click', function (e) {
    	if(mBLE.notificationDataCollected.length > 0) {

    		callDatalogHandler.createCSVFile_export(mBLE.createCSVDataString_raw_fileName, callDatalogHandler.createCSVDataString_datalog_raw(), 'QSun Datalog Export - Raw');
    	
    	} else datalogEmpty();
    	
    });
	},

	init_bytes: function () {

		$$('#bytesSendButton').on('click', function (e) {
      if(mBLE.targetDeviceObj) {
      	mBLE.startSendingBytes();
      } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
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
	    if(mBLE.targetDeviceObj) {
      	mBLE.startReset(4);
      } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	  });
	  $$('#send5Button').on('click', function (e) {
	    if(mBLE.targetDeviceObj) {
      	mBLE.startReset(5);
      } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
	  });
	  $$('#send6Button').on('click', function (e) {
	    if(mBLE.targetDeviceObj) {
      	mBLE.startReset(6);
      } else vBLE.ble_status_msg('#BLE-Status', 'Device info does not exist.');
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

	      mBLE.startUVChange(uvValue);

	    }
	  }

		for(var i = 0; i < 14; i++) $$(document).on('click', '.row .uvBtn_' + i, uvChanger(i));

		$$('.row .uvBtn_real').on('click', function (e) {
	    mBLE.startUVChange(15);
	  });

	},

	getRandomInt: function (min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
 
}