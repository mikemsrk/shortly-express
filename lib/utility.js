var request = require('request');
var Sessions = require('../app/collections/sessions');
var Session = require('../app/models/session');

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

exports.loginChecker = function(req, res, next){
    console.log("utils : loginChecker");
    var cookies = req.cookies;
    if(cookies.session_id){
      var id = parseInt(cookies.session_id);
      var clientToken = cookies.token || "";
      new Session({id:id, token:clientToken}).fetch().then(function(item){
        if(item){ //match
          console.log('USER ALREADY LOGGED IN');
          req.loggedin = true;
          next();
        }else{ // no match
          console.log('SESSION NOT FOUND');
          //redirect
          req.loggedin = false;
          //res.render('login');
          next();
        }
      });
    } else {
      console.log('NO COOKIE FOUND');
      req.loggedin = false;
      next();
    }
  }

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/


