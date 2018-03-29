function cViewHandler () {


}

cViewHandler.prototype = {


	ble_status_msg: function (targetElement, msgString) {
		// Check how many messages
    var totalMessages = $$(targetElement).children('.mainMessage').length;
    //if(totalMessages > 150) $$('#BLE-Status').html('');

    // Time stamp
    var d = new Date();
    var a = d.getHours() + ' : ' + d.getMinutes() + ' : ' + d.getSeconds() + ' : ' + d.getMilliseconds();

    $$(targetElement).prepend('<hr><div class="mainMessage" style="color: red; font-weight: bold;">' + a + ' [ '+ callBleEventHandler.initialRealTimeReadingInterval + ' ms]</div>'
      + '<div style="color: blue;">' + msgString + '</div>');
    
	},

	display_deviceName: function (deviceName) {
		$$('#navbar-deviceName').html(deviceName);
	},

	display_saved_device_address: function (deviceAddress) {
		$$('#saved_device_address').html(deviceAddress);
	},

	display_connected_device_address: function (deviceAddress) {
		$$('#connected_device_address').html(deviceAddress);
	},

	display_ttb_written: function (ttbVal) {
		var t = this;
		var ttbSentArr = t.secondsToMinutes(ttbVal);
		$$('#ttb_sent').html(ttbSentArr[0] + ' M ' + ttbSentArr[1] + ' S <-- ' + ttbVal + ' S');
	},

	display_ttb_uv1: function (ttbVal) {
		var t = this;
		var ttbArr;
		if(callBleEventHandler.ss_fromDevice > 0) {
			
			// Mar.28.2018 - Pick Latest UV
			var uvValue = 1;
			var uvGT0_arr = callBleEventHandler.uvTrackerArr.filter((el) => { return el > 0; });
			if(uvGT0_arr.length > 0) uvValue = uvGT0_arr[uvGT0_arr.length - 1];

			var newTTB = parseInt(ttbVal / uvValue);
			ttbArr = t.secondsToMinutes(newTTB);
			
			$$('#ttb-uv1').html(ttbArr[0] + ' M ' + ttbArr[1] + ' S  (' + ttbVal + ' S / '+ uvValue +' UVI)');
			
			//ttbArr = t.secondsToMinutes(ttbVal);
			//$$('#ttb-uv1').html(ttbArr[0] + ' M ' + ttbArr[1] + ' S  (' + ttbVal + ' S)');
		} else {
			ttbArr = t.secondsToMinutes(ttbVal);
			$$('#ttb-uv1').html(ttbArr[0] + ' M ' + ttbArr[1] + ' S  (' + ttbVal + ' S) No SS');
		}
		
	},

  display_realtimeResult: function (char1Val, char2Val, char3Val, char4Val, 
                                    char5Val, char6Val, char7Val, char8Val, 
                                    char9Val, char11Val, char12Val, char13Val, 
                                    char14Val, char15Val, char16Val, char17Val) {


    var t = this;
    var string1112 = '';
    var string1120 = '';
    var string1121 = '';
    /*
    console.log('\nRaw Data => ' + '1: ' + char1Val[0] + ', 2:' + char2Val + ', 3:' + char3Val[0] + ', 4:' + char4Val[0] + ', 5:' + char5Val 
                + ', 6:' + char6Val + ', 7:' + char7Val + ', 8:' + char8Val + ', 9:' + char9Val + ', 11:' + char11Val
                + ', 12:' + char12Val + ', 13:' + char13Val + ', 14:' + char14Val + ', 15:' + char15Val + ', 16:' + char16Val + ', 17:' + char17Val);
    */

    if(char1Val[0]) {
      var arr1112 = t.secondsToMinutes(char1Val[0]);
      string1112 = arr1112[0] + 'm ' + arr1112[1] + 's';
    } else {
      string1112 = undefined;
    }

    if(char3Val[0]) {
      var arr1120 = t.secondsToMinutes(char3Val[0]);
      string1120 = arr1120[0] + 'm ' + arr1120[1] + 's';
    } else {
      string1120 = undefined;
    }

    if(char4Val[0]) {
      var arr1121 = t.secondsToMinutes(char4Val[0]);
      string1121 = arr1121[0] + 'm ' + arr1121[1] + 's';
    } else {
      string1121 = undefined;
    }

    // Testing for negatives
    /*
    console.log('*** Check for 1123: ' + char13Val + ' -> ' + t.dataAnalyzer2(((typeof char13Val === 'number') ? [char13Val] : char13Val)));
    console.log('*** Check for 1124: ' + char14Val + ' -> ' + t.dataAnalyzer2(((typeof char14Val === 'number') ? [char14Val] : char14Val)));
    console.log('*** Check for 2000: ' + char7Val + ' -> ' + t.dataAnalyzer2(((typeof char7Val === 'number') ? [char7Val] : char7Val)));
    console.log('*** Check for 2001: ' + char8Val + ' -> ' + t.dataAnalyzer2(((typeof char8Val === 'number') ? [char8Val] : char8Val)));
    console.log('*** Check for 2002: ' + char15Val + ' -> ' + t.dataAnalyzer2(((typeof char15Val === 'number') ? [char15Val] : char15Val)));
    console.log('*** Check for 2003: ' + char16Val + ' -> ' + t.dataAnalyzer2(((typeof char16Val === 'number') ? [char16Val] : char16Val)));
    console.log('*** Check for 2004: ' + char17Val + ' -> ' + t.dataAnalyzer2(((typeof char17Val === 'number') ? [char17Val] : char17Val)));
    */

    t.ble_status_msg('#BLE-Status', '[Total]  =  [Sunscreen]  +  [TTB] ' + '<br>'+ 
                                    ((string1112) ? string1112 : '0') + ' = ' + ((string1120) ? string1120 : '0') + ' + ' + ((string1121) ? string1121 : '0') + '<br>' +
                                    '[UV]: ' + ((char2Val) ? t.dataAnalyzer('Uint8Array', char2Val, 'uv') : 'NULL') + ' [UV 1]: ' + ((char5Val) ? char5Val : 'NULL') + ' [UV 2]: ' + ((char6Val) ? char6Val : 'NULL') + '<br>' +
                                    '[41]: ' + ((char7Val) ? char7Val : 'NULL') + ' [42]: ' + ((char8Val) ? char8Val + '(' + t.dataAnalyzer2(((typeof char8Val === 'number') ? [char8Val] : char8Val)) + ')' : 'NULL') + '<br>' +
                                    '[Temp]: ' + ((char9Val) ? char9Val : 'NULL') + ' [Battery]: ' + ((char11Val) ? char11Val : 'NULL') + ' [V]: ' + ((char12Val) ? char12Val : 'NULL') + '<br>' +
                                    '[1123]: ' + ((char13Val) ? char13Val : 'NULL') + ' [S]: ' + ((char14Val) ? char14Val : 'NULL') + '<br>' + 
                                    '[TTB1]: ' + ((char15Val) ? char15Val : 'NULL') + 
                                    ' [TTB2]: ' + ((char16Val) ? char16Val : 'NULL') + 
                                    ' [TTBD1]: ' + ((char17Val) ? char17Val : 'NULL'));

    
    $$('#ttb_result').html(string1112);
    $$('#ttb_whatIsWritten').html(' [' + callBleEventHandler.secondsUntilMidnight + ']');
    
  },

  // Handler data properly including negatives
  dataAnalyzer2: function (dataArray) {

    var tempNegativeHex = '0x';

    for(var i = 0; i < dataArray.length; i++) {
      var hexString = dataArray[i].toString(16);
      if(hexString.length < 2) hexString = '0' + hexString;
      tempNegativeHex += hexString;
    }

    //console.log('Before Hex: ' + tempNegativeHex);
    var beforeHex = tempNegativeHex;

    tempNegativeHex = parseInt(tempNegativeHex, 16);  // to int

    //console.log('After Hex: ' + tempNegativeHex);

    if((tempNegativeHex & 0x8000) > 0){
      tempNegativeHex = tempNegativeHex - 0x10000;
      //var negativeHex = (tempNegativeHex / 100).toFixed(1);
      //if(negativeHex == -0.0) negativeHex = 0.0;          // July.12.2017 - We don't want '-0.0'
      return beforeHex; //+ ' -> ' + tempNegativeHex;
    } else {
      //newHexString = hexString1 + hexString2;
      //return (parseInt(newHexString, 16) / 100).toFixed(1);
      return beforeHex; //+ ' -> ' + tempNegativeHex;
    }

  },

  dataAnalyzer: function (typeOfData, data, purposeOfData) {
    var bleAll; var tempData = '';

    if(typeOfData == 'Uint8Array') bleAll = new Uint8Array(data);
    else if(typeOfData == 'Uint16Array') bleAll = new Uint16Array(data);
    else bleAll = new Uint8Array(data);

    if(bleAll.length > 1) {
      for(var i = 0; i < bleAll.length; i++){
        var tempLogContent = bleAll[i];
        if(i == 0) tempData = tempLogContent;
        else tempData = tempData + ' ' + tempLogContent; 
      }
    } else tempData = bleAll[0];
    
    if(purposeOfData == 'uv') {

      var convertedUV = Number(tempData);
      if(!isNaN(convertedUV)) tempData = convertedUV / 10;

    }

    return tempData;
  },

  secondsToMinutes: function (inSeconds) {
    if(isNaN(inSeconds)) inSeconds = Number(inSeconds);
    var arr = [];
    var min = parseInt(inSeconds / 60);
    var sec = inSeconds % 60;
    arr.push(min); arr.push(sec);
    return arr;
  },

  display_reading_notificationData: function (dataCounter, data, data1, data2, data3, data4, data5) {
    var msgBuilder = '\n=========================================================='+
                    '\n['+ dataCounter +'] Raw Data: ' + JSON.stringify(data) + 
                    '\nTime: ' + data1 + ', UV: ' + data2 + ', Temp: ' + data3 + ', %: '+ data4 + ', V: ' + data5 +
                    '\n==========================================================';

    console.log(msgBuilder);
  },

  display_datalog_init: function () {

    var t = this;

    var allDataHTML = 'Please wait...';

    var popupHTML = '' +
    '<div class="popup">'+
      '<div class="page no-toolbar">'+
        '<div class="page-content" style="-webkit-overflow-scrolling: touch;">'+
          '<div class="content-block" style="margin-top: 5%;">' + 
            '<div class="button button-fill close-popup" style="font-size: 4.5vw;">Close</div>'+
            '<div class="row" style="margin-top: 5%;">'+
              '<div class="col-50 button button-fill" id="notification-display-real" style="font-size: 4.5vw;">Real</div>'+
              '<div class="col-50 button button-fill" id="notification-display-raw" style="font-size: 4.5vw;">Raw</div>'+
            '</div>'+
            '<div class="row" style="margin-top: 5%;">'+
              '<div class="col-50 button button-fill" id="notification-datalog-export-real" style="font-size: 4.5vw;">Export Real</div>'+
              '<div class="col-50 button button-fill" id="notification-datalog-export-raw" style="font-size: 4.5vw;">Export Raw</div>'+
            '</div>'+
          '</div>'+ 
          '<div class="content-block" id="notification-list" style="margin-top: 5%; -webkit-overflow-scrolling: touch;">' + 
            allDataHTML +
          '</div>'+
        '</div>' +
      '</div>' +
    '</div>';

    myApp.popup(popupHTML);

    setTimeout(function(){
      callClickHandler.init_datalog();
    },700);

  },

  display_datalog_realData: function (realDataArr) {

    return new Promise((resolve) => {

      var allDataHTML = '';

      var prevTime = ((realDataArr.length > 0) ? realDataArr[0].prevTime : 0);
      var notificationFiredTime = callBleEventHandler.notificationDataCollectedTime; 
      var firedTimeData = new Date(notificationFiredTime); // Notification fired time

      // Title
      allDataHTML += ('<div style="color: blue; font-size: 4.5vw; font-weight: bold;">Real Data:</div>');

      // Previous Time
      if(prevTime > 0) {

        var prevTimeData = new Date(prevTime);

        allDataHTML += ('<div style="color: red;">Previous Time: '+ 
                        (prevTimeData.getMonth() + 1) + ' / ' + prevTimeData.getDate() + 
                        ' ('+ prevTimeData.getHours() + ':' + prevTimeData.getMinutes() + ':' + prevTimeData.getSeconds() +')' +'</div>');

      } else {
        allDataHTML += ('<div style="color: red;">Previous Time: NA</div>');
      }

      allDataHTML += ('<div style="color: red;">Current Time: '+ 
                      (firedTimeData.getMonth() + 1) + ' / ' + firedTimeData.getDate() + 
                      ' ('+ firedTimeData.getHours() + ':' + firedTimeData.getMinutes() + ':' + firedTimeData.getSeconds() +')' +'</div>');

      // Data length
      allDataHTML += ('<div style="color: green;">Data Length: ' + realDataArr.length + '</div>');

      // Actual Data
      for(i = 0; i < realDataArr.length; i++) {

        var thisTime = new Date(realDataArr[i].timeInEpoch);

        allDataHTML += ('<div style="color: blue;">' + 
                        (thisTime.getMonth() + 1) + '/' + thisTime.getDate() + 
                        ' ('+ thisTime.getHours() + ':' + thisTime.getMinutes() + ':' + thisTime.getSeconds() +')' +
                        ' ['+ realDataArr[i].time +', '+ realDataArr[i].uv + ', '+ realDataArr[i].temp + ', '+ realDataArr[i].voltage + ', '+ realDataArr[i].ssOn +']</div>');
      }

      $$('#notification-list').html(allDataHTML);

      resolve(true);

    });
    

  },

  display_datalog_rawData: function (rawDataArr) {
    var allDataHTML = '';

    // Title
    allDataHTML += ('<div style="color: blue; font-size: 4.5vw; font-weight: bold;">Raw Data:</div>');

    // Data length
    allDataHTML += ('<div style="color: green;">Data Length: ' + rawDataArr.length + '</div>');

    for(i = 0; i < rawDataArr.length; i++) {

      var thisTime = new Date(rawDataArr[i].timeInEpoch);

      allDataHTML += ('<div style="color: blue;">' +
                      ' ['+ rawDataArr[i].time +', '+ rawDataArr[i].uv + ', '+ rawDataArr[i].temp + ', '+ rawDataArr[i].voltage + ', '+ rawDataArr[i].ssOn +']</div>');
    }

    $$('#notification-list').html(allDataHTML);

  },

  // Jan.10.2018 - Display battery data stacked
  display_batteryData: function () {

    var allDataHTML = '';

    // Show total length and the latest data
    var batteryDataArr = callBleEventHandler.batteryTestingData;

    if(batteryDataArr && batteryDataArr.length > 0) {
      allDataHTML += ('Total: ' + batteryDataArr.length + 
                      ' ['+ batteryDataArr[batteryDataArr.length - 1].duration + ', ' + batteryDataArr[batteryDataArr.length - 1].voltage + ']');
    }

    $$('#batteryTester_text').html(allDataHTML);

  },

  display_uvChange: function (val) {

    $$('.uvCurrentValue').html('UV Selected: ' + val);
    $$('#uvSelection-selected').html(val);

  },

  // Jan.18.2018 - Display device status for testing
  display_tester_deviceStatus: function (statusString) {
    $$('#tester_deviceStatus').html(statusString);
  },

  // Mar.20.2018 - Change number for skintype and env
  display_skinEnv: function (skin, env, uv) {
    $$('#skintypeSelection-selected').html(skin);
    $$('#environmentSelection-selected').html(env);
  },  

  display_subscription: function (dataObjArray) {
    
    var data0, data1, data2, data3, data4, data5, data7;

    dataObjArray.map(function(el){
      switch(el.id) {
        case 0: data0 = el.data; break;
        case 1: data1 = el.data; break;
        case 2: data2 = el.data; break;
        case 3: data3 = el.data; break;
        case 4: data4 = el.data; break;
        case 5: data5 = el.data; break;
        case 7: data7 = el.data; break;
      }
    });

    HTMLBuilder = '' +
      '<div id="subscription-data-list" class="row no-gutter" style="color: black; font-size: 3.5vw;">'+
        '<div class="col-auto">'+ ((data0) ? data0 : '--') +'</div>'+ // uv
        '<div class="col-auto">'+ ((data1) ? data1 : '--') +'</div>'+ // temp
        '<div class="col-auto">'+ ((data2) ? data2 : '--') +'</div>'+ // battery
        '<div class="col-auto">'+ ((data3) ? data3 : '--') +'</div>'+ // ttb
        '<div class="col-auto">'+ ((data4) ? data4 : '--') +'</div>'+ // ss
        '<div class="col-auto">'+ ((data5) ? data5 : '--') +'</div>'+ // first time since battery
        '<div class="col-auto">'+ ((data7) ? data7 : '--') +'</div>'+ // device shaken
      '</div>';

    $$('#subscription-data').prepend(HTMLBuilder);

    var d = new Date();
    var a = d.getHours() + ' : ' + d.getMinutes() + ' : ' + d.getSeconds() + ' : ' + d.getMilliseconds();
    $$('#subscription-time').html(a);

  },

  clear_subscription: function () {
  	$$('#subscription-data').html('');
  },

  display_appTimer: function (ttb, ss) {
    var t = this;

    var lastConnectionState = callBleEventHandler.conState[callBleEventHandler.conState.length - 1]; 
    if(lastConnectionState === callBleEventHandler.conStateIndex.CONNECTED) {

      if(callBleEventHandler.checkDeviceCalculate()) console.log('*** [App Timer][From Device]: TTB: ' + ttb + ', SS: ' + ss);
      else console.log('*** [App Timer][From App]: TTB: ' + ttb + ', SS: ' + ss);

      if(callBleEventHandler.deviceShaken > 0) {
        var ttb_arr = t.secondsToMinutes(ttb);
        var ss_arr = t.secondsToMinutes(ss);
        $$('#appTimer-ttb').html(ttb_arr[0] + ' M ' + ttb_arr[1] + ' S (' + ttb + ' S)');
        $$('#appTimer-ss').html(ss_arr[0] + ' M ' + ss_arr[1] + ' S');
      } else {
        $$('#appTimer-ttb, #appTimer-ss').html('--');
      }
      
    } else {
      $$('#appTimer-ttb, #appTimer-ss').html('NA');
    }

  }



}