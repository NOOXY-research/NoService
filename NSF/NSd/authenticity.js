// NSF/NSd/authenticity.js
// Description:
// "authenticity.js" provide users authenticity\ base on sqldatabase.
// Copyright 2018 NOOXY. All Rights Reserved.


let crypto = require('crypto');
let sqlite3 = require('sqlite3');
let utils = require('./utilities');

// database obj for accessing database of authenticity.
let Authdb = function () {
  let _database = null;
  let _cacheduser = {};

  this.MaxCacheSize = 1000; //Users

  function User(username) {
    // sql statement
    let sql = 'SELECT username, pwdhash, token, tokenexpire FROM users WHERE username = ?';
    _database.get(sql, [username], (err, row) => {
      if(err||typeof(row)=='undefined') {
        this.username = username;
        this.exisitence = false;
      }
      else {
        this.exisitence = true;
        this.username = row.username;
        this.pwdhash = row.pwdhash;
        this.token = row.token;
        this.tokenexpire = row.tokenexpire;
        this.privilege = row.privilege;
        this.detail = row.detail;
      }
    })

    // write newest information of user to database.
    this.updatesql = (handler) => {
      let err = null;
      if(typeof(this.username)=='undefined') {
        throw 'username undefined.';
      }
      else {
        if(this.exisitence) {
          sql = 'UPDATE users SET username=?, pwdhash=?, token=?, tokenexpire=?, privilege=?, detail=? WHERE username = ?';
        }
        else {
          sql = 'INSERT INTO users(username, pwdhash, token, tokenexpire, privilege, detail) VALUES (?, ?, ?, ?, ?, ?, ?);'
        }
        _database.run(sql, [this.username, this.pwdhash, this.token, this.tokenexpire, this.privilege, this.detail]);
        this.exisitence = true;
      }
      if(err) {
        handler(err);
      }
    };

    // delete the user from database.
    this.delete = () => {
      _database.run('DELETE FROM users WHERE username=?;', [this.username])
      this.exisitence = false;
      this.username = null;
      this.pwdhash = null;
      this.token = null;
      this.tokenexpire = null;
      this.privilege = null;
      this.detail = null;
    };
  }

  this.importDatabase = (path) => {
    _database = new sqlite3.Database(path);
  };

  this.createDatabase = (path) => {
    let _database = new sqlite3.Database(path);
    let expireDate = utils.DatetoSQL(utils.addDays(new Date(), 7));
    _database.run('CREATE TABLE users(username text,  pwdhash text, token text, tokenexpire datetime, privilege text, detail text)');
  };

  this.getUser = (username, handler) => {
    let err = null;
    if(typeof(_cacheduser[username])=='undefined') {
      let user = new User(username);
      _cacheduser[username] = user;
    }
    handler(err, _cacheduser[username]);
  }
}

// the authenticity module
function Authenticity() {

  const _authdb = new Authdb;
  const SHA256KEY = 'FATFROG';

  function User(username, isguest) {
    let _username = username;
    let _isGuest = isguest;

    this.isGuest() {
      return _isGuest;
    };

    this.getUsermame() {
      return _username;
    };
  }

  // Declare parameters
  this.TokenExpirePeriod = 7 // Days

  // import database from specified path
  this.importDatabase = (path) => {
    _authdb.importDatabase(path);
  };

  // create a new database for authenticity.
  this.createDatabase = (path) => {
    _authdb.createDatabase(path);

  };

  // create a temp user which will not exist in database.
  this.getGuest = (handler) => {
    let err = null;
    let user = null;

    user = new User('GUEST', true);

    handler(err, user);
  };

  // get a user from imported database.
  this.getUser = (username, handler) => {
    let err = null;
    let userdb = _authdb.getUser(username);
    let user = null;
    if(userdb.exisitence == false) {
      let err = new Error("[Authenticity] User not exist.");
    }
    else {
      user = new User(userdb.username, false);
    }

    handler(err, user);
  }

  this.CreateUser = (username, password, handler) => {
    let err = null;
    let pwdhash = null;
    let user = _authdb.getUser(username);

    if(user.exisitence == false) {
      pwdhash = crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex');
    }
    else {
      let err = new Error("[Authenticity] User already exist.");
    };


    handler(err);
  };

  this.DeleteUser = (user, password, handler) => {
    if(this.PasswordisValid(user, password)) {
      user.delete();
      user.updatesql();
    }
    else {
      const err = true;
      handler(err);
    }
  };

  this.renewPassword = (user, newpassword, handler) => {

  };

  this.PasswordisValid = (user, password, handler) => {
    let user = _authdb.getUser(username);
    let isValid = false;
    let pwdhash = user.pwdhash;
    let pwdhashalpha = crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex');
    if(pwdhash==pwdhashalpha) {
      isValid = true;
    }
    handler(isValid);
  };

  this.TokenisValid = (user, token, handler) => {
    let user = _authdb.getUser(username);
    let isValid = false;
    let now = new Date();
    let exipredate = utils.SQLtoDate(user.tokenexpire)
    if(now>exipredate||) {

    }
  };

  this.getUserToken = (user, password, handler) => {
    let user = _authdb.getUser(username);
    let isValid = false;
    let now = new Date();
    let exipredate = utils.SQLtoDate(user.tokenexpire)
    if(now>exipredate||) {

    }
  };

  this.Userprivilege = (user, handler) => {

  };

}
module.exports = authenticity;
