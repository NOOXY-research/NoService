// NSF/NSd/authoration.js
// Description:
// "authoration.js" provide users authoration and services authoration lib.
// Copyright 2018 NOOXY. All Rights Reserved.


let crypto = require('crypto');
let sqlite3 = require('sqlite3');
let utils = require('./utilities');

let authoration = function () {
  let _database = null;
  let _activateduser = {};

  function User(username) {
    let _username = null;
    let _pwdhash = null;
    let _token = null;
    let tokenexpire = null;

    let sql = 'SELECT username, pwdhash, token, tokenexpire FROM users WHERE username = '+username;
    _database.get(sql, function(err, row) {

    })

    this.updatesql() {

    };
  }

  let _Tokenexpire = function(user) {
    return datatimenow >= datatimeexpire;
  };

  this.importDatabase = function(path) {
    _database = new sqlite3.Database(path);
  };

  this.createDatabase = function(path) {
    let _database = new sqlite3.Database(path);
    let expireDate = utils.DatetoSQL(utils.addDays(new Date(), 7));
    _database.run('CREATE TABLE users(username text,  pwdhash text, token text, tokenexpire datetime)');
    _database.run('INSERT INTO users VALUES("admin", "admin", "none," "'+expireDate+'";)');
  };

  this.activateuser = function(username) {

  }

  this.TokenisValid = function(username, token, handler) {

    return result;
  };

  this.generateUserToken = function(username, password, handler) {
    let sql = 'UPDATE users SET token ''WHERE username='+username+';';
    let token = utils.generateGUID();

  };

  this.PasswordisValid = function(username, password, handler) {
    if(_Tokenexpire(username)) {}
  };

  this.renewPassword = function(username, oldpassword, newpassword, handler) {

  }

  this.UserisSuperuser = function(username, handler) {

  }

  this.getUseremail = function(username, handler) {

  }

}

module.exports = authoration;
