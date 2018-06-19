// NSF/NSd/authenticity.js
// Description:
// "authenticity.js" provide users authenticity base on sqldatabase.
// Copyright 2018 NOOXY. All Rights Reserved.


let crypto = require('crypto');
let sqlite3 = require('sqlite3');
let Utils = require('./utilities');

// database obj for accessing database of authenticity.
let Authdb = function () {
  let _database = null;
  let _cacheduser = {};

  this.MaxCacheSize = 1000; //Users

  function User(username) {

    this.loadsql = (next) => {

      // sql statement
      let sql = 'SELECT username, displayname, pwdhash, token, tokenexpire, detail, privilege FROM users WHERE username = ?';

      _database.get(sql, [username], (err, row) => {
        if(err || typeof(row) == 'undefined') {
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
        _database.close();
        next(false);
      })

    };

    // write newest information of user to database.
    this.updatesql = (callback) => {
      let sql = null;
      let err = null;
      if(typeof(this.username)=='undefined') {
        throw 'username undefined.';
      }
      else {
        if(this.exisitence) {
          sql = 'UPDATE users SET username=?, displayname=?, pwdhash=?, token=?, tokenexpire=?, privilege=?, detail=? WHERE username = ?';
        }
        else {
          sql = 'INSERT INTO users(username, displayname, pwdhash, token, tokenexpire, privilege, detail) VALUES (?, ?, ?, ?, ?, ?, ?);'
        }
        _database.run(sql, [this.username, this.displayname, this.pwdhash, this.token, this.tokenexpire, this.privilege, this.detail], (err) => {
          if(err) {
            callback(err);
          }
          else {
            this.exisitence = true;
            callback(false);
          }
        });

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
    let expiredate = Utils.DatetoSQL(Utils.addDays(new Date(), 7));
    _database.run('CREATE TABLE users(username text, displayname text,  pwdhash text, token text, tokenexpire datetime, privilege text, detail text)');
  };

  this.getUser = (username, callback) => {
    let err = null;
    if(typeof(_cacheduser[username]) == 'undefined') {
      let user = new User(username);
      user.loadsql((err)=>{
        _cacheduser[username] = user;
        callback(err, _cacheduser[username]);
      });
    }
    else {
      callback(err, _cacheduser[username]);
    }
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
  //   let userdb = null;_authdb.getUser(username);
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
        let expiredate = new Date();
        expiredate = Utils.addDays(expiredate, this.TokenExpirePeriod);
        user.username = username;
        user.displayname = displayname;
        user.pwdhash = crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex');
        user.token = Utils.generateGUID();
        user.tokenexpire = Utils.DatetoSQL(expiredate);
        user.privilege = privilege;
        user.updatesql(callback);
      }
      else {
        let err = new Error("[Authenticity] User already exist.");
        callback(err);
      };
    });


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
    let isValid = false;
    _authdb.getUser(username, (err, user) => {
      let pwdhash = user.pwdhash;
      let pwdhashalpha = crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex');
      if(pwdhash == pwdhashalpha) {
        isValid = true;
      }
      callback(false, isValid);
    });


  };

  this.TokenisValid = (username, token, callback) => {
    let err = false;
    let isValid = false;
    _authdb.getUser(username, (err, user) => {
      let now = new Date();
      let expiredate = Utils.SQLtoDate(user.tokenexpire);
      if(now > expiredate|| token != user.token) {
        callback(err, false);
      }
      else {
        callback(err, true);
      }
    });

  };

  this.renewToken = (username) => {
    let _token=null;
    _authdb.getUser(username, (err, user)=>{
      let expiredate = new Date();
      expiredate = Utils.addDays(expiredate, this.TokenExpirePeriod);
      user.token = Utils.generateGUID();
      user.tokenexpire = Utils.DatatoSQL(expiredate);
      user.updatesql();
      _token = user.token;
    });
    return _token;
  }

  this.getUserToken = (username, password, callback) => {
    this.PasswordisValid(username, password, (err, valid) => {
      if(valid) {
        _authdb.getUser(username, (err, user)=>{
          let now = new Date();
          let expiredate = Utils.SQLtoDate(user.tokenexpire);
          if(now > expiredate) {
            callback(false, this.renewToken(username));
          }
          else {
            callback(false, user.token);
          }
        });
      }
      else {
        callback(true);
      }
    })

  };

  this.getUserprivilege = (username, callback) => {
    _authdb.getUser(username, (err, user) => {
      callback(false, user.privilege);
    };
  };

  this.signupUser = () => {

  };

  // // Authenticity Router
  // this.GTRouter = () => {
  //
  // }

};
module.exports = Authenticity;
