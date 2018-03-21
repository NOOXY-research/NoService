// NSF/NSd/authenticity.js
// Description:
// "authenticity.js" provide users authenticity\ base on sqldatabase.
// Copyright 2018 NOOXY. All Rights Reserved.


let crypto = require('crypto');
let sqlite3 = require('sqlite3');
let utils = require('./utilities');

let Authdb = function () {
  let _database = null;
  let _cacheduser = {};

  this.MaxCacheSize = 1000; //Users

  function User(username) {
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

function authenticity() {

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

  this.importDatabase = (path) => {
    _authdb.importDatabase(path);
  };

  this.createDatabase = (path) => {
    _authdb.createDatabase(path);

  };

  this.getGuest = (handler) => {

  };

  this.getUser = (username, handler) => {

  }

  this.Userexist = (user, handler) => {
    let user = _authdb.getUser(username);
    handler(user.exisitence)
  };

  this.CreateUser = (username, password, handler) => {
    let err = null;
    let user = _authdb.getUser(username);
    if(this.exisitence ==) {
      let pwdhash = crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex');
    }
    else {
      let err= new Error();
    };

    handler(err);
  };

  this.getUserObject = (username, password, detail) => {

  }

  this.DeleteUser = (username, password, handler) => {
    let user = _authdb.getUser(username);
    if(this.PasswordisValid(username, password)) {
      user.delete();
      user.updatesql();
    }
    else {
      const err = true;
      handler(err);
    }
  };

  this.renewPassword = (username, oldpassword, newpassword, handler) => {

  };

  this.PasswordisValid = (username, password, handler) => {
    let user = _authdb.getUser(username);
    let isValid = false;
    let pwdhash = user.pwdhash;
    let pwdhashalpha =crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex');
    if(pwdhash==pwdhashalpha) {
      isValid = true;
    }
    handler(isValid);
  };

  this.TokenisValid = (username, token, handler) => {
    let user = _authdb.getUser(username);
    let isValid = false;
    let now = new Date();
    let exipredate = utils.SQLtoDate(user.tokenexpire)
    if(now>exipredate||) {

    }
  };

  this.getUserToken = (username, password, handler) => {
    let user = _authdb.getUser(username);
    let isValid = false;
    let now = new Date();
    let exipredate = utils.SQLtoDate(user.tokenexpire)
    if(now>exipredate||) {

    }
  };

  this.Userprivilege = (username, handler) => {

  };

}
module.exports = authenticity;
