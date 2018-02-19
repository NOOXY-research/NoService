// NSF/NSd/authoration.js
// Description:
// "authoration.js" provide users authoration and services authoration lib.
// Copyright 2018 NOOXY. All Rights Reserved.


let crypto = require('crypto');
let sqlite3 = require('sqlite3');


function User() {
  let _username = null;
  let _email = null;

  this.getEmail = function() {
    return _email;
  };
  this.getUsername = function() {
    return _username;
  };
}

let authoration = function () {
  let _database = null;
  let _Tokenexpire = function() {

  };

  this.importDatabase = function(path) {
    _database = new sqlite3.Database(path);
  };

  this.createDatabase = function(path) {
    _database = new sqlite3.Database(path);
    _database.run('CREATE TABLE users(username text,  password text, token text, tokenexpire datetime)');

  };

  this.TokenisValid = function(username, token, handler) {
    let sql = 'SELECT username, token, tokenexpire FROM users WHERE username = '+username;
    database.get(sql, function(err, row) {
      
    })
  };

  this.generateUserToken = function(username, password, handler) {

  };

  this.PasswordisValid = function(username, password, handler) {
    if(_Tokenexpire(username)) {}
  };

  this.renewPassword = function(username, oldpassword, newpassword, handler) {

  }

  this.UserisSuperuser = function(user, handler) {

  }

  this.getUser(handler) {

  }

}

module.exports = authoration;
