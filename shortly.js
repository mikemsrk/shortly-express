var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Sessions = require('./app/collections/sessions');
var Session = require('./app/models/session');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(__dirname + '/public'));

// Redirect to Login page if not signed in
// app.get('/*',function(req,res){
//   if(false){ //signed in

//   } else {
//     console.log('rendering to login...');
//     res.render('login');
//   }

// });

app.use(util.loginChecker);

app.get('/', function(req, res) {
  console.log('app : root url');
  res.render('index',{
    loggedin: req.loggedin
  });
});

app.get('/login', function(req, res) {
  console.log('inside login route');
  res.render('login');
});

app.get('/signup', function(req, res) {
  console.log('inside login route');
  res.render('signup');
});

app.get('/create', function(req, res) {
  res.render('index');
});

app.get('/links', function(req, res) {
  // Links.reset().fetch().then(function(links) {
  //   res.send(200, links.models);
  // });
  Links.query(function(qb){
    qb.where('user_id','=',req.user_id);
  }).fetch().then(function(links){
      res.send(200,links.models);
  });

});

app.post('/links',function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }
        console.log("shortly : post link : req.user_id= " + req.user_id);
        var link = new Link({
          url: uri,
          title: title,
          user_id: req.user_id,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});


app.post('/signup',function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  //check if user exists ?
  new User({username:username}).fetch().then(function(collection){
    if(collection){ //user exists
      res.send(200, "username already taken!");
    }else{
      //if not create user
      var user = new User({
              username: username,
              password: password
            });
      user.save();
      //respond if persistance is OK
      res.redirect('login');
    }
  });

  //sign in user - extra credit
  //redirect to the requested site - extra credit

});

app.get('/logout',function(req, res) {
  var s_id = req.cookies.session_id;
  var s_token = req.cookies.token;

  //check if session exists ?
  new Session({id: s_id, token: s_token}).fetch().then(function(item){
    if(item){ //session exists
      item.destroy();
      res.redirect('login');
    }else{
      res.send(200, "Not valid session");
    }
  });

  //sign in user - extra credit
  //redirect to the requested site - extra credit

});

app.post('/login',function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  //check if user exists ?
  new User({username:username}).fetch().then(function(myuser){
    console.log(myuser);
    if(myuser){ //user exists
      var salt = myuser.get('salt');
      var authenticated = myuser.checkPassword(username, password);
      console.log(username + ' authenticated: ' + authenticated);

      // what if already logged in ???
      if(authenticated){
        // create a session
        var session = new Session({
          user_id: myuser.get('id')
        });

        session.save().then(function(){
          res.cookie('session_id', session.get('id'));
          res.cookie('token', session.get('token'));
          res.redirect('/');
        });

      } else {
        // redirect
        console.log('Wrong password, redirecting...');
        res.render('login');
      }
    }else{
      res.send(200, "user not found");
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/



app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
