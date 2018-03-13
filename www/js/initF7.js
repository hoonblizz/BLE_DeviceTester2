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