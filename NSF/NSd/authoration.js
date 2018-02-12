// NSF/NSd/authoration.js
// Description:
// "authoration.js" provide users authoration and services authoration lib.
// Copyright 2018 NOOXY. All Rights Reserved.


let crypto = require('crypto');
//  TEST
//  test code

user1 = new User().setusername('user1').setpassword('user1');
user2 = new User().setusername('user2').setpassword('user2');
user3 = new User().setusername('user3').setpassword('user3');
users = {user1, user2, user3};

getuser = function(username) {
  for(let user in users) {
    if(user.getusername() == username) {
      return user;
    }
  }
}


//  TEST END

function User() {
  let _username = null;
  let _password = null; // hashed
  let _email = null;
  let _usertoken = null;
  let _usertoken_expire = null;

  this.setUsername = function(username) {
    _username = username;
  };

  this.setPassword = function(password) {
    hash = crypto.createHash('sha256').update(password).digest('base64');
    _password = hash;
  };

  this.getUsername = function() {
    return _username;
  };

  this.Password = function(password, handler) {
    if(_password) {};
  }
}

let authoration = function () {
  let database = null;

  this.importDatabase = function(path) {

  }

  this.TokenisValid = function(username, key, handler) {

  },

  this.UserisSuperuser = function(user) {

  }

}

module.exports = authoration;
