// Init framework7 
var myApp = new Framework7(
{
  pushState: true,
  fastClicks: true,
  fastClicksDelayBetweenClicks: 20,
  fastClicksDistanceThreshold: 5,
  cacheDuration: 1000*60*5,   
  swipeBackPage: true
});   

var $$ = Dom7;

var mainView = myApp.addView('.view-main', {
  // each page has their own nav bar
  dynamicNavbar: true,
  domCache: true      
}); 



// June.21.2018 - Created
function mAppHanlder () {

	var appStatus = {				// June.21.2018 - Added
		FG_iOS: 8,				
		BG_iOS: 7,
		FG_ANDROID: 10,
		BG_ANDROID: 9
	}

	let appBGFG;

	// June.21.2018 - Added. Setting App forground or background
	this.setAppStatus = function (appStatusString) {	// FG or BG
		if(myApp.device.os === 'android' || myApp.device.os === 'Android') {
			appBGFG = (appStatusString === 'FG') ? appStatus.FG_ANDROID : appStatus.BG_ANDROID;
		} else {
			appBGFG = (appStatusString === 'FG') ? appStatus.FG_iOS : appStatus.BG_iOS;
		}
	}
	this.getAppStatus = function () {
		return appBGFG;
	}
	this.getAppStatusIndex = function () {
		return appStatus;
	}


}

mAppHanlder.prototype.init = function () {
	this.setAppStatus('FG');			// Setting default app status
}
mAppHanlder.prototype.checkAppStatus = function (appStatusString) {	// Check if app is marked as BG or FG
	var t = this;
	if(appStatusString === 'FG') {		
		if(myApp.device.os === 'android' || myApp.device.os === 'Android') {
			if(t.getAppStatus() == t.getAppStatusIndex().FG_ANDROID) return true;
			else return false;
		} else {
			if(t.getAppStatus() == t.getAppStatusIndex().FG_iOS) return true;
			else return false;
		}
	} else {
		if(myApp.device.os === 'android' || myApp.device.os === 'Android') {
			if(t.getAppStatus() == t.getAppStatusIndex().BG_ANDROID) return true;
			else return false;
		} else {
			if(t.getAppStatus() == t.getAppStatusIndex().BG_iOS) return true;
			else return false;
		}
	}
}

var mApp = new mAppHanlder();
mApp.init();

