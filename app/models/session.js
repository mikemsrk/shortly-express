var db = require('../config');
var bcrypt = require('bcrypt-nodejs');

var Session = db.Model.extend({
  tableName: 'sessions',
  hasTimestamps: true,
  initialize: function(){
    // hash the token
    this.on('creating', function(model, attrs, options){
      console.log('sessions.js : initialize : creating');
      var hash = bcrypt.hashSync(model.get('user_id')+Date.now());
      // store new generated hashed token
      model.set('token', hash);
      console.log('token: ' + model.get('token'));
    });
  }
});

module.exports = Session;
