/*
	Mar.09.2018 - Became a separate file
*/
/* ===========================================================================
	Datalog
	// Analysis of notification data (focused on sunscreen)
  // Sept.25.2017 - We need this to display sunscreen data
  // Sept.29.2017 - If device reset, old data still remains in device with time,
  // ex) [5, 10, 15, 20 .... 45, 5, 10, 15...]
  // Then, don't just delete previous data but assume that it's continuous data from last result
  // ex) [5, 10, 15, 20 .... 45, (45 + 5), (45 + 10), (45 + 15)...]
  // Oct.02.2017 - If it's been reset at least once, get first block, and last block and ignore
  // everything in the middle
  // ex)  [5, 10, 15, 20, 5, 10, 15, 5, 10, 5, 10, 5, 10, 15, 20, 25, 30, 5, 10, 15](now)
  //      |<----------->|          ignore all in the middle               |<------>|
  //        first block                                                    last block

  // Dec.11.2017
  // Assume that data was full once, then we'll have a variable that indicates 
  // 'Data' was full. If we have this variable, choose the first block.

  // Jan.09.2018 - Mike added a 'bookmark' that indicates that last data of notification. 
  // Go through the data and make a separation divided by this book mark.  
	=========================================================================== */

function cDatalogHandler () {

}

cDatalogHandler.prototype = {

	start_datalog: function () {

		var t = this;

		if(callBleEventHandler.notificationDataCollected.length < 1) {
	    // notification is empty or not fired
	    myApp.modal({
	      title: 'Notification Data Required!',
	      text: '',
	      verticalButtons: true,
	      buttons: [{
	        text: 'Ok'
	      }]
	    }); 
	  } else {

	  	var t1 = performance.now();

	  	myApp.showPreloader('Analyzing Datalog...');

	  	t.datalog_analyzeData()
	  	.then(() => {
	  		callViewHandler.display_datalog_init();
	  		return callViewHandler.display_datalog_realData(callBleEventHandler.notificationDataAnalyzed);
	  	})
	  	.then(() => {

	  		var t2 = performance.now();
	  		console.log('Datalog Notification Finished: (' + parseInt(t2 - t1) + ' ms )');
	  		myApp.hidePreloader();

	  	})
	  	.catch(() => {
	  		myApp.hidePreloader();
	  	});
	  	
	  }

	},

	datalog_analyzeData: function () {

		var t = this;
		return new Promise((resolve) => {
			var t1 = performance.now();

	    var i;
	    var allData = [];
	    var allDataRaw = [];
	    var firstBlockArray = [];
	    var lastBlockArray = [];

	    // =====================================================================================
	    // Divide by bookmark
	    // =====================================================================================

	    var bookmarkData = {
	      time: 0,
	      temp: 250,
	      uv: 250
	    }

	    var pushTo = 0;   // 0 - firstBlock, 1 - lastBlock

	    for(i = 0; i < callBleEventHandler.notificationDataCollected.length; i++) {

	      if(callBleEventHandler.notificationDataCollected[i].time == bookmarkData.time && 
	        callBleEventHandler.notificationDataCollected[i].temp == bookmarkData.temp &&
	        callBleEventHandler.notificationDataCollected[i].uv == bookmarkData.uv) {

	        pushTo = 1;   // change to push to last block

	      } else {

	        if(pushTo == 0) {
	          if(!checkDuplicates(firstBlockArray, callBleEventHandler.notificationDataCollected[i])) { 
	            firstBlockArray.push(callBleEventHandler.notificationDataCollected[i]);
	          }
	        }
	        else {
	          if(!checkDuplicates(lastBlockArray, callBleEventHandler.notificationDataCollected[i])) { 
	            lastBlockArray.push(callBleEventHandler.notificationDataCollected[i]);
	          }
	        }

	      }

	    }

	    // check duplicates
	    function checkDuplicates (listArr, elementObj) {
	      var checkDuplicates = listArr.find(function(element) {
	        return (element.time == elementObj.time && element.temp == elementObj.temp && element.uv == elementObj.uv);
	      });
	      return checkDuplicates;
	    }

	    console.log('Divide by book mark done');

	    // =====================================================================================
	    // Concat blocks
	    // =====================================================================================

	    // ==================================================
	    // Jan.09.2018 - With Mike's bookmark, testing to see attaching last + first data blocks
	    allData = lastBlockArray.concat(firstBlockArray);
	    // ==================================================
	    allDataRaw = callBleEventHandler.notificationDataCollected;
	    allDataRaw.sort(function(a, b){
	      return a.id - b.id;
	    });// Desc order for raw data

	    callBleEventHandler.notificationDataCollected = allDataRaw;

	    // =====================================================================================
	    // Divide by reset point 
	    // (where time is decreased)
	    // =====================================================================================
	    var firstBlockCreated = false;
	    firstBlockArray = [];
	    lastBlockArray = [];    // usually use this to stack up
	    
	    for(i = 0; i < allData.length; i++) {
	      if(lastBlockArray.length > 1) {

	        var currTimeValue = allData[i].time;
	        var prevTimeValue = lastBlockArray[lastBlockArray.length - 1].time;

	        if(currTimeValue < prevTimeValue) {   // previous value is greater -> device reseted 

	          if(!firstBlockCreated) {

	            firstBlockArray = lastBlockArray.slice();   // array copy and we will keep the first block
	            lastBlockArray = [];      // clear it and stack from the beginning
	            lastBlockArray.push(allData[i]);
	            firstBlockCreated = true;

	          } else {
	            lastBlockArray = [];    // just clear
	            lastBlockArray.push(allData[i]);
	          }

	        } else {
	          lastBlockArray.push(allData[i]);
	        }

	      } else {
	        lastBlockArray.push(allData[i]);
	      }
	    }
	   
	    // =====================================================================================
	    // Add calculated realtime for each first, last block
	    // =====================================================================================
	    // Then get time calculation
	    if(firstBlockArray.length > 0 && lastBlockArray[0].prevTime > 0) {
	      firstBlockArray = firstBlockArray.map(function(elements){
	        //elements.timeInEpoch = lastBlockArray[0].prevTime - (firstBlockArray[firstBlockArray.length - 1].time * 1000) + (elements.time * 1000);  // Ascending calculation
	        elements.timeInEpoch = lastBlockArray[0].prevTime + ((elements.time * 1000) - (firstBlockArray[0].time * 1000)); 
	        elements.blockType = 0;   // Dec.22.2017 - Mark block type. 0 - first block, 1 - last block
	        return elements;
	      });
	    }
	   
	    if(lastBlockArray.length > 0) {
	      lastBlockArray = lastBlockArray.map(function(elements){
	        elements.timeInEpoch = elements.currentTime - (lastBlockArray[lastBlockArray.length - 1].time * 1000) + (elements.time * 1000);  // Descending calculation
	        elements.blockType = 1;   // Dec.22.2017 - Mark block type. 0 - first block, 1 - last block
	        return elements;
	      });
	    }

	    // =====================================================================================
	    // Depending on conditions, pick blocks and concat
	    // =====================================================================================
	    var dataWasReset = callBleEventHandler.firstTimeSinceBattery;
	    if(dataWasReset == 1) {
	      // Check if prevTime exists, 
	      if(lastBlockArray[0].prevTime == 0) firstBlockArray = [];
	    }

	    allData = firstBlockArray.concat(lastBlockArray);

	    var t2 = performance.now();

	    callBleEventHandler.notificationDataAnalyzed = allData;

	    //console.log('\n\nMerged / Sorted Data ['+ parseInt(t2 - t1) +' ms]: \n\n' + JSON.stringify(callBleEventHandler.notificationDataAnalyzed));
	    //console.log('\n\nRaw Array ['+ parseInt(t2 - t1) +' ms]: \n\n' + JSON.stringify(callBleEventHandler.notificationDataCollected));

	    // switch it to 0
	  	callBleEventHandler.firstTimeSinceBattery = 0;

	  	resolve(true);

		});
		

	},

	/* ===========================================================================
	exporting data - copied from my app code utility
	Process:
	createCSVDataString: transform current data into csv format (string)
	mergeCSVFile: creates / merge data file
	
	=========================================================================== */
	createCSVDataString_batteryTester: function () {

		var t = this;

		var t1 = performance.now();

		var csvContent = '';//"data:text/csv;charset=utf-8,";

		callBleEventHandler.batteryTestingData.map(function(element){
			csvContent += (element.currentTime + ',' + element.duration + ',' + element.voltage + '\n');	// \r\n
		});

		var t2 = performance.now();

		console.log('\nCSV created [' + parseInt(t2 - t1) + ' ms]: \n' + csvContent);

		return csvContent;
	},

	createCSVDataString_datalog_real: function () {

		var t = this;

		var t1 = performance.now();

		var csvContent = '';//"data:text/csv;charset=utf-8,";
		var realDataArr = callBleEventHandler.notificationDataAnalyzed;

		var prevTime = ((realDataArr.length > 0) ? realDataArr[0].prevTime : 0);
    var notificationFiredTime = callBleEventHandler.notificationDataCollectedTime;

		csvContent += ('Calculated Time' + ',' + 'Time(s)' + ',' + 'UV' + ',' + 'TotalTTB' + ',' + 'ActiveLED' + ',' + 'Sunscreen' + ',' + 'Current Time' + ',' + 'Previous Time' + ',' + 'Data Size' + '\n');

		realDataArr.map(function(element){
			csvContent += (new Date(element.timeInEpoch) + ',' + element.time + ',' + element.uv + ',' + element.voltage + ',' + element.temp + ',' + element.ssOn + ',' + new Date(notificationFiredTime) + ',' + new Date(prevTime) + ',' + realDataArr.length + '\n');	// \r\n
		});

		var t2 = performance.now();

		console.log('\nCSV created [' + parseInt(t2 - t1) + ' ms]: \n' + csvContent);

		return csvContent;
	},

	createCSVDataString_datalog_raw: function () {

		var t = this;

		var t1 = performance.now();

		var csvContent = '';//"data:text/csv;charset=utf-8,";
		var rawDataArr = callBleEventHandler.notificationDataCollected;

		var prevTime = ((rawDataArr.length > 0) ? rawDataArr[0].prevTime : 0);
    var notificationFiredTime = callBleEventHandler.notificationDataCollectedTime;

		csvContent += ('Time(s)' + ',' + 'UV' + ',' + 'ActiveLED' + ',' + 'TotalTTB' + ',' + 'Sunscreen' + ',' + 'Current Time' + ',' + 'Previous Time' + ',' + 'Data Size' + '\n');

		rawDataArr.map(function(element){
			csvContent += (element.time + ',' + element.uv + ',' + element.temp + ','+ element.voltage + ',' + element.ssOn + ',' + new Date(notificationFiredTime) + ',' + new Date(prevTime) + ',' + rawDataArr.length + '\n');	// \r\n
		});

		var t2 = performance.now();

		console.log('\nCSV created [' + parseInt(t2 - t1) + ' ms]: \n' + csvContent);

		return csvContent;
	},

	mergeCSVFile: function (fileName, csvContent) {
		var t = this;
		
		var fileEntryHere;

		// Read original file Data and merge then write
		t.file_requestFileSystem()
		.then(function(fs){
			console.log('File system requested');
			return t.file_getFile(fs, fileName);
		})
		.then(function(fileEntry){
			fileEntryHere = fileEntry;
			return t.file_readFile(fileEntry);
		})
		.then(function(fileResult){
				
			console.log('\n[Reading Result] \n' + fileResult);
			console.log('\n[Current Data] \n' + csvContent);

			return t.file_writeFile(fileEntryHere, fileResult + csvContent); // its all string in csv format

		})
		.then(function(fileEntry){
			return t.file_readFile(fileEntry);
		})
		.then(function(fileResult){
				
			console.log('\n\n*******************************\nCheck Merged Data: \n\n' + fileResult);

		})
		.catch(function(err){
			console.log('Error in File: ' + err);
		});
	},

	exportCSVFile: function (fileName) {
		var t = this;

		console.log('Starting Export process...');

		t.file_requestFileSystem()
		.then(function(fs){
			console.log('File system requested');
			return t.file_getFile(fs, fileName);
		})	
		.then(function(fileEntry){

			t.file_sendEmail(fileEntry, emailSubject);	

		})
		.catch(function(err){
			console.log('Error in File: ' + err);
		});
	},

	//
	createCSVFile_export: function (fileName, csvContent, emailSubject) {

		var t = this;

		//console.log('Starting Export process...');

		t.file_requestFileSystem()
		.then(function(fs){
			console.log('File system requested');
			return t.file_getFile(fs, fileName);
		})	
		.then(function(fileEntry){
			console.log('Writing file done');
			return t.file_writeFile(fileEntry, csvContent);
		})
		//.then(function(fileEntry){
		//	return t.file_readFile(fileEntry);
		//})
		.then(function(fileEntry){

			console.log('\n\nCheck once again for File Entry: \n' + JSON.stringify(fileEntry));
			t.file_sendEmail(fileEntry, emailSubject);	

		})
		.catch(function(err){
			console.log('Error in File: ' + err);
		});
		
	},

	file_requestFileSystem: function () {
		return new Promise(function(resolve, reject){
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
				resolve(fs);
			}, function(err){	
		  	reject(err);
			});
		});	
	},

	file_getFile: function (fs, fileName) {
		return new Promise(function(resolve, reject){
			fs.root.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {
				resolve(fileEntry);
			}, function(err){	
		  	reject(err);
			});
		});	
	},

	file_writeFile: function (fileEntry, dataString) {

		var t = this;
		return new Promise(function(resolve, reject){

			fileEntry.createWriter(function (fileWriter) {

				fileWriter.onwriteend = function() {
          console.log("Successful file write..." + JSON.stringify(fileEntry));
          resolve(fileEntry);
	      };

	      fileWriter.onerror = function (e) {
	      	reject(e);
	      };

	      if (!dataString) {	// If data object is not passed in, create a new Blob instead.
	        dataString = new Blob([''], { type: 'text/plain' });
	      } //else dataString = new Blob([dataString], { type: 'text/plain' });

	      fileWriter.write(dataString);
			});

		});
	},

	file_readFile: function (fileEntry) {
		return new Promise(function(resolve, reject){

			fileEntry.file(function (file) {

	      var reader = new FileReader();
	      reader.onloadend = function () {
	        console.log('Successful file read...[Path: ' + fileEntry.nativeURL + ']: ' + this.result);
	        resolve(this.result);
	      };
	      reader.readAsText(file);

	    }, function(err){
	      reject(err);
	    });

		});
	},

	file_sendEmail: function (fileEntry, emailSubject) {

		var t = this;

		console.log('\nGenerated path: \n' + fileEntry.nativeURL);

		var attachmentLocationArray = [];
		if(fileEntry.nativeURL) attachmentLocationArray.push(fileEntry.nativeURL)

		if(attachmentLocationArray.length > 0) {
			// https://github.com/katzer/cordova-plugin-email-composer/issues/97
			cordova.plugins.email.isAvailable(function (isAvailable) {
	      cordova.plugins.email.open({
	        to: callBleEventHandler.batteryTestingData_emailTo,
	        subject: emailSubject,
	        body: 'Check the attachment',
	        attachments: attachmentLocationArray
	      });
	    });
		} else {
			myApp.modal({
	      title: 'File Entry Error',
	      text: '',
	      verticalButtons: true,
	      buttons: [{
	        text: 'Ok'
	      }]
	    }); 
		}
		

	},

}