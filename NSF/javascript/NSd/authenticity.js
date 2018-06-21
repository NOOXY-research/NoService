// NSF/NSd/authenticity.js
// Description:
// "authenticity.js" provide users authenticity base on sqldatabase.
// Copyright 2018 NOOXY. All Rights Reserved.


let crypto = require('crypto');
let sqlite3 = require('sqlite3');
let Utils = require('./utilities');
let Vars = require('./variables');

// database obj for accessing database of authenticity.
let Authdb = function () {
  let _database = null;
  let _cacheduser = {};

  this.MaxCacheSize = 1000; //Users

  function User(username) {

    this.loadsql = (next) => {

      // sql statement
      let sql = 'SELECT username, userid, displayname, pwdhash, token, tokenexpire, detail, privilege FROM users WHERE username = ?';

      _database.get(sql, [username], (err, row) => {
        if(err || typeof(row) == 'undefined') {
          this.username = username;
          this.exisitence = false;
        }
        else {
          this.exisitence = true;
          this.username = row.username;
          this.userid = row.userid;
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
        callback(new Error('username undefined.'));
      }
      else {
        if(this.exisitence) {
          sql = 'UPDATE users SET username=?, userid=?, displayname=?, pwdhash=?, token=?, tokenexpire=?, privilege=?, detail=? WHERE username = ?';
        }
        else {
          sql = 'INSERT INTO users(username, userid, displayname, pwdhash, token, tokenexpire, privilege, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?);'
          this.userid = Utils.generateGUID();
        }
        _database.run(sql, [this.username, this.userid, this.displayname, this.pwdhash, this.token, this.tokenexpire, this.privilege, this.detail], (err) => {
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
      this.userid = null;
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
    _database.run('CREATE TABLE users(username text, userid text, displayname text,  pwdhash text, token text, tokenexpire datetime, privilege text, detail text)');
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

  this.getUserMeta = (username, callback) => {
    _authdb.getUser(username, (err, user) => {
      let user_meta = {
        exisitence : user.exisitence,
        username : user.username,
        userid : user.userid,
        displayname : user.displayname,
        tokenexpire : user.tokenexpire,
        privilege : user.privilege,
        detail : user.detail
      }
      callback(false, user_meta);
    });
  }

  this.createUser = (username, displayname, password, privilege, callback) => {
    let pwdhash = null;
    _authdb.getUser(username, (err, user)=>{
      if(user.exisitence == false || username == null|| password == null || privilege == null) {
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
        let err = new Error("[Authenticity] User create error.");
        callback(err);
      };
    });


  };

  this.deleteUser = (username, callback) => {
    if(Vars.default_user.username != username) {
      _authdb.getUser(username, (err, user) => {
        user.delete();
        callback(false);
      });
    }
    else {
      callback(true);
    }
  };

  this.updatePassword = (username, newpassword, callback) => {
    if(newpassword != null && newpassword.length ) {
      _authdb.getUser(username, (err, user)=>{
        user.pwdhash = crypto.createHmac('sha256', SHA256KEY).update(newpassword).digest('hex');
        user.updatesql(callback);
      });
    }
    else {
      callback(true);
    }
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

  this.updateToken = (username, callback) => {
    let _token=null;
    _authdb.getUser(username, (err, user)=>{
      let expiredate = new Date();
      expiredate = Utils.addDays(expiredate, this.TokenExpirePeriod);
      user.token = Utils.generateGUID();
      user.tokenexpire = Utils.DatatoSQL(expiredate);
      user.updatesql((err)=>{
        if(!err) {
          callback(err, user.token);
        }
        else {
          callback(err);
        }
      });
    });
  }

  this.getUserToken = (username, password, callback) => {
    this.PasswordisValid(username, password, (err, valid) => {
      if(valid) {
        _authdb.getUser(username, (err, user)=>{
          let now = new Date();
          let expiredate = Utils.SQLtoDate(user.tokenexpire);
          if(now > expiredate) {
            this.updateToken(username, (err, token) => {
              callback(error, token);
            });
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
    });
  };

  // // Authenticity Router
  // this.GTRouter = () => {
  //
  // }

};
module.exports = Authenticity;
