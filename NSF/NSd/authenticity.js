// NSF/NSd/authenticity.js
// Description:
// "authenticity.js" provide users authenticity base on sqldatabase.
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
    let sql = 'SELECT username, displayname, pwdhash, token, tokenexpire FROM users WHERE username = ?';
    _database.get(sql, [username], (err, row) => {
      if(err||typeof(row)=='undefined') {
        this.username = username;
        this.exisitence = false;
      }
      else {
        this.exisitence = true;
        this.username = row.username;
        this.displayname = row.displayname;
        this.pwdhash = row.pwdhash;
        this.token = row.token;
        this.tokenexpire = row.tokenexpire;
        this.privilege = row.privilege;
        this.detail = row.detail;
      }
    })

    // write newest information of user to database.
    this.updatesql = (callback) => {
      let err = null;
      if(typeof(this.username)=='undefined') {
        throw 'username undefined.';
      }
      else {
        if(this.exisitence) {
          sql = 'UPDATE users SET username=?, displayname=?, pwdhash=?, token=?, tokenexpire=?, privilege=?, detail=? WHERE username = ?';
        }
        else {
          sql = 'INSERT INTO users(username, displayname, pwdhash, token, tokenexpire, privilege, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?);'
        }
        _database.run(sql, [this.username, this.displayname, this.pwdhash, this.token, this.tokenexpire, this.privilege, this.detail]);
        this.exisitence = true;
      }
      if(err) {
        callback(err);
      }
    };

    // delete the user from database.
    this.delete = () => {
      _database.run('DELETE FROM users WHERE username=?;', [this.username])
      this.exisitence = false;
      this.username = null;
      this.displayname = null;
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
    _database = new sqlite3.Database(path);
    let expireDate = utils.DatetoSQL(utils.addDays(new Date(), 7));
    _database.run('CREATE TABLE users(username text, displayname text,  pwdhash text, token text, tokenexpire datetime, privilege text, detail text)');
  };

  this.getUser = (username, callback) => {
    let err = null;
    if(typeof(_cacheduser[username]) == 'undefined') {
      let user = new User(username);
      _cacheduser[username] = user;
    }
    callback(err, _cacheduser[username]);
  }
}

// the authenticity module
function Authenticity() {

  const _authdb = new Authdb();
  const SHA256KEY = 'FATFROG';

  // function User(username, isguest) {
  //   let _username = username;
  //   let _isGuest = isguest;
  //
  //   this.isGuest = () => {
  //     return _isGuest;
  //   };
  //
  //   this.getUsermame = () =>  {
  //     return _username;
  //   };
  // }

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
  this.getGuest = (callback) => {
    let err = null;
    let user = null;

    user = new User('GUEST', true);

    callback(err, user);
  };

  // get a user from imported database.
  // this.getUser = (username, callback) => {
  //   let err = null;
  //   let userdb = _authdb.getUser(username);
  //   let user = null;
  //   if(userdb.exisitence == false) {
  //     let err = new Error("[Authenticity] User not exist.");
  //   }
  //   else {
  //     user = new User(userdb.username, false);
  //   }
  //
  //   callback(err, user);
  // }

  this.createUser = (username, displayname, password, privilege, callback) => {
    let err = null;
    let pwdhash = null;
    _authdb.getUser(username, (err, user)=>{
      if(user.exisitence == false) {
        let now = new Date();
        user.username = username;
        user.displayname = displayname;
        user.pwdhash = crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex');
        user.token = utils.generateGUID();
        user.tokenexpire = now.setDate(now.getDate() + this.TokenExpirePeriod); ;
        user.privilege = privilege;
      }
      else {
        let err = new Error("[Authenticity] User already exist.");
      };
    });

    callback(err);
  };

  this.deleteUser = (username, password, callback) => {
    if(this.PasswordisValid(username, password)) {
      user.delete();
      user.updatesql();
    }
    else {
      const err = true;
      callback(err);
    }
  };

  this.renewPassword = (username, newpassword, callback) => {

  };

  this.PasswordisValid = (username, password, callback) => {
    let userdb = _authdb.getUser(username);
    let err = false;
    let isValid = false;
    let pwdhash = userdb.pwdhash;
    let pwdhashalpha = crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex');
    if(pwdhash == pwdhashalpha) {
      isValid = true;
    }
    callback(err, isValid);
  };

  this.TokenisValid = (username, token, callback) => {
    let err = false;
    let isValid = false;
    _authdb.getUser(username, (user) => {
      let now = new Date();
      let exipredate = utils.SQLtoDate(user.tokenexpire);
      if(now > exipredate|| token != user.token) {
        callback(err, false);
      }
      else {
        callback(err, true);
      }
    });

  };

  this.getUserToken = (username, password, callback) => {
    let userdb = _authdb.getUser(username);
    let isValid = false;
    let now = new Date();
    let exipredate = utils.SQLtoDate(user.tokenexpire)
    // if(now>exipredate||) {
    //
    // }
  };

  this.getUserprivilege = (username, callback) => {

  };

  this.signupUser = () => {

  };

  // // Authenticity Router
  // this.GTRouter = () => {
  //
  // }

};
module.exports = Authenticity;
