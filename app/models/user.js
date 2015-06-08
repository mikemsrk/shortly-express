var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  initialize: function(){
    console.log('users.js : initialize');
    this.on('creating', function(model, attrs, options){
      console.log('users.js : initialize : creating');
      //create random salt
      var salt = bcrypt.genSaltSync(10);
      console.log('>gen salt: ' + salt);
      // store the salt
      model.set('salt', salt);
      // create a hash value using orig_pswrd+salt
      var hash = bcrypt.hashSync(model.get('password'), salt);
      // store new generated hashed pswrd
      model.set('password', hash);
      // store the username
      // model.set('username', username);
    });
  }
});

module.exports = User;
