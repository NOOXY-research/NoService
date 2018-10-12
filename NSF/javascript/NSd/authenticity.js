// NSF/NSd/authenticity.js
// Description:
// "authenticity.js" provide users authenticity base on sqldatabase.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

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
      let sql = 'SELECT username, userid, displayname, pwdhash, token, tokenexpire, detail, privilege, firstname, lastname FROM users WHERE username = ?';
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
          this.firstname = row.firstname;
          this.lastname = row.lastname;
        }
        next(false);
      })
    };

    this.loadbyUserIdsql = (userid, next) => {

      // sql statement
      let sql = 'SELECT username, userid, displayname, pwdhash, token, tokenexpire, detail, privilege, firstname, lastname FROM users WHERE userid = ?';

      _database.get(sql, [userid], (err, row) => {
        if(err || typeof(row) == 'undefined') {
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
          this.firstname = row.firstname;
          this.lastname = row.lastname;
        }
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
        let datenow = Utils.DatetoSQL(new Date());
        if(this.exisitence) {
          sql = 'UPDATE users SET username=?, userid=?, displayname=?, pwdhash=?, token=?, tokenexpire=?, detail=?, privilege=?, firstname=?, lastname=?, modifydate=? WHERE username=?';
          _database.run(sql, [this.username, this.userid, this.displayname, this.pwdhash, this.token, this.tokenexpire, this.detail, this.privilege, this.firstname, this.lastname, datenow, this.username], (err) => {
            if(err) {
              callback(err);
            }
            else {
              this.exisitence = true;
              callback(false);
            }
          });
        }
        else {
          sql = 'INSERT INTO users(username, userid, displayname, pwdhash, token, tokenexpire, detail, privilege, firstname, lastname, createdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
          this.userid = Utils.generateGUID();
          _database.run(sql, [this.username, this.userid, this.displayname, this.pwdhash, this.token, this.tokenexpire, this.detail, this.privilege, this.firstname, this.lastname, datenow], (err) => {
            if(err) {
              callback(err);
            }
            else {
              this.exisitence = true;
              callback(false);
            }
          });
        }
      }
    };

    // delete the user from database.
    this.delete = (callback) => {
      _database.run('DELETE FROM users WHERE username=?;', [this.username], callback)
      this.exisitence = false;
      this.username = null;
      this.userid = null;
      this.displayname = null;
      this.pwdhash = null;
      this.token = null;
      this.tokenexpire = null;
      this.privilege = null;
      this.detail = null;
      this.firstname = null;
      this.lastname = null;
    };
  }

  this.importDatabase = (path) => {
    _database = new sqlite3.Database(path);
  };

  this.createDatabase = (path) => {
    _database = new sqlite3.Database(path);
    let expiredate = Utils.DatetoSQL(Utils.addDays(new Date(), 7));
    _database.run('CREATE TABLE users(username text, userid text, displayname text,  pwdhash text, token text, tokenexpire datetime, privilege integer, detail text, firstname text, lastname text, createdate datetime, modifydate datetime)');
  };

  this.getUser = (username, callback) => {
    let err = null;
    if(username== null) {
      callback(true);
    }
    else if(typeof(_cacheduser[username]) == 'undefined') {
      let user = new User(username);
      user.loadsql((err)=>{
        _cacheduser[username] = user;
        callback(err, _cacheduser[username]);
      });
    }
    else {
      callback(err, _cacheduser[username]);
    }
  };

  this.getUserbyId = (userid, callback) => {
    let user = new User();
    user.loadbyUserIdsql(userid, (err)=>{
      if(typeof(_cacheduser[user.username]) == 'undefined') {
          _cacheduser[user.username] = user;
      }
      callback(false, _cacheduser[user.username]);
    });
  };

  this.close = ()=>{
    _cacheduser = null;
    _database.close();
    _database = null;
  };
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

  this.getUserMeta = (username, callback) => {
    try {
      _authdb.getUser(username, (err, user) => {
        let user_meta = {
          firstname: user.firstname,
          lastname: user.lastname,
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
    catch(e) {
      callback(e);
    }
  };

  this.getUserID = (username, callback) => {
    try {
      _authdb.getUser(username, (err, user) => {
        let id = user.userid;
        callback(err, id);
      });
    }
    catch(e) {
      callback(e);
    }

  };

  this.getUsernamebyId = (userid, callback) => {
    try {
      _authdb.getUserbyId(userid, (err, user) => {
        let username = user.username;
        callback(false, username);
      });
    }
    catch(e) {
      callback(e);
    }

  };

  this.getUserExistence = (username, callback) => {
    authdb.getUser(username, (err, user)=>{
      callback(false, user.exisitence);
    });
  };

  this.createUser = (username, displayname, password, privilege, detail, firstname, lastname, callback) => {
    let pwdhash = null;
    username = username.toLowerCase();
    _authdb.getUser(username, (err, user)=>{
      if(user.exisitence == true) {
        let err = new Error("User existed.");
        callback(err);
      }
      else if(Number.isInteger(privilege) == false) {
        let err = new Error("Privilege invalid.");
        callback(err);
      }
      else if(username.length < 5 || username == null || / /.test(username) || !Utils.isEnglish(username)) {
        let err = new Error("Username invalid.");
        callback(err);
      }
      else if(firstname.length < 2 || firstname == null || /\d/.test(firstname)) {
        let err = new Error("First name invalid.");
        callback(err);
      }
      else if(lastname.length < 2 || lastname == null || /\d/.test(lastname)) {
        let err = new Error("Last name invalid.");
        callback(err);
      }
      else if(password == null) {
        let err = new Error("Password invalid.");
        callback(err);
      }
      else if(password.length < 5) {
        let err = new Error("Password must be longer then or equal to 5.");
        callback(err);
      }
      else {
        let expiredate = new Date();
        expiredate = Utils.addDays(expiredate, this.TokenExpirePeriod);
        user.username = username;
        user.displayname = displayname;
        user.pwdhash = crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex');
        user.token = Utils.generateGUID();
        user.tokenexpire = Utils.DatetoSQL(expiredate);
        user.privilege = privilege;
        user.detail = detail;
        user.firstname = firstname;
        user.lastname = lastname;
        user.updatesql(callback);
      }
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
    if(newpassword != null && newpassword.length >= 5) {
      _authdb.getUser(username, (err, user)=>{
        user.pwdhash = crypto.createHmac('sha256', SHA256KEY).update(newpassword).digest('hex');
        user.updatesql((err)=>{
          if(err) {
            callback(err);
          }
          else {
            this.updateToken(username, callback);
          }
        });
      });
    }
    else {
      let err = new Error("Password must be longer then or equal to 5.");
      callback(err);
    }
  };

  this.updatePrivilege = (username, privilege, callback) => {
    _authdb.getUser(username, (err, user)=>{
      if(user.exisitence&&Number.isInteger(parseInt(privilege))) {

        user.privilege = parseInt(privilege);
        user.updatesql(callback);
      }
      else {
        let err = new Error("User not existed or privilege level is not a Int.");
        callback(err);
      }
    });
  };

  this.updateName = (username, firstname, lastname, callback) => {
    if(firstname == null || /\d/.test(firstname)) {
      let err = new Error(firstname+"First name invalid.");
      callback(err);
    }
    else if(lastname == null || /\d/.test(lastname)) {
      let err = new Error("Last name invalid.");
      callback(err);
    }
    else {
      _authdb.getUser(username, (err, user)=>{
        user.firstname = firstname;
        user.lastname = lastname;
        user.updatesql(callback);
      });
    }
  };

  this.PasswordisValid = (username, password, callback) => {
    let isValid = false;
    try{
      _authdb.getUser(username, (err, user) => {
        let pwdhash = user.pwdhash;
        let pwdhashalpha = crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex');
        if(pwdhash == pwdhashalpha) {
          isValid = true;
        }
        callback(false, isValid);
      });
    }
    catch(e) {
      callback(e);
    }
  };

  this.TokenisValid = (username, token, callback) => {
    if(token != null && username!=null && token.length > 10) {
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
    }
    else {
      callback(false, false);
    }
  };

  this.updateToken = (username, callback) => {
    let _token=null;
    _authdb.getUser(username, (err, user)=>{
      let expiredate = new Date();
      expiredate = Utils.addDays(expiredate, this.TokenExpirePeriod);
      user.token = Utils.generateGUID();
      user.tokenexpire = Utils.DatetoSQL(expiredate);
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
              callback(err, token);
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

  this.close = () => {
    _authdb.close();
  };
  // // Authenticity Router
  // this.GTRouter = () => {
  //
  // }

};
module.exports = Authenticity;
