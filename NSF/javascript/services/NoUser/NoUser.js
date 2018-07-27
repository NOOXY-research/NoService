// NoUser.js
// Description:
// "NoUser.js" is a advanced user system for NSF.
// Copyright 2018 NOOXY. All Rights Reserved.


let sqlite3 = require('sqlite3');
let Utils = require('./utilities');

// database obj for accessing database of authenticity.
let NoUserdb = function () {
  let _database = null;
  let _cacheduser = {};

  this.MaxCacheSize = 1000; //Users

  function User(userid) {

    this.loadbyUserIdsql = (userid, next) => {

      // sql statement
      let sql = 'SELECT userid, email, gender, phonenumber, birthday, country, address, aboutme FROM users WHERE userid = ?';

      _database.get(sql, [userid], (err, row) => {
        if(err || typeof(row) == 'undefined') {
          this.userid = userid;
          this.exisitence = false;
        }
        else {
          this.exisitence = true;
          this.userid = row.userid;
          this.email = row.email;
          this.gender = row.gender;
          this.phonenumber = row.phonenumber;
          this.birthday = row.birthday;
          this.country = row.country;
          this.address = row.address;
          this.aboutme = row.aboutme;
        }
        next(false);
      })

    };

    // write newest information of user to database.
    this.updatesql = (callback) => {
      let sql = null;
      let err = null;
      if(typeof(this.userid)=='undefined') {
        callback(new Error('userid undefined.'));
      }
      else {
        let datenow = Utils.DatetoSQL(new Date());
        if(this.exisitence) {
          sql = 'UPDATE users SET userid=?, email=?, gender=?, phonenumber=?, birthday=?, country=?, address=?, aboutme=?, modifydate=? WHERE userid=?';
          _database.run(sql, [this.userid, this.email, this.gender, this.phonenumber, this.birthday, this.country, this.address, this.aboutme, datenow, this.userid], (err) => {
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
          sql = 'INSERT INTO users(userid, email, gender, phonenumber, birthday, country, address, aboutme, modifydate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);'
          _database.run(sql, [this.userid, this.email, this.gender, this.phonenumber, this.birthday, this.country, this.address, this.aboutme, datenow], (err) => {
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
      _database.run('DELETE FROM users WHERE userid=?;', [this.userid], callback)
      this.exisitence = false;
      this.userid = null;
      this.email = null;
      this.gender = null;
      this.phonenumber = null;
      this.birthday = null;
      this.country = null;
      this.address = null;
      this.aboutme = null;
    };
  }

  this.importDatabase = (path) => {
    _database = new sqlite3.Database(path);
  };

  this.createDatabase = (path) => {
    _database = new sqlite3.Database(path);
    let expiredate = Utils.DatetoSQL(Utils.addDays(new Date(), 7));
    _database.run('CREATE TABLE users(userid text, email VARCHAR(320), gender VARCHAR(1), phonenumber VARCHAR(50), birthday date, country VARCHAR(160), address text, aboutme text, modifydate datetime)');
  };

  this.getUserbyId = (userid, callback) => {
    let user = new User();
    user.loadbyUserIdsql(userid, (err)=>{
      if(typeof(_cacheduser[user.userid]) == 'undefined') {
          _cacheduser[userid] = user;
      }
      callback(err, _cacheduser[userid]);
    });
  };

  this.close = ()=>{
    _cacheduser = null;
    _database.close();
    _database = null;
  };
}

// the nouser module
function NoUser() {

  const _nouserdb = new NoUserdb();
  let countries;
  // Declare parameters
  this.TokenExpirePeriod = 7 // Days

  // import database from specified path
  this.importDatabase = (path) => {
    _nouserdb.importDatabase(path);
  };

  // import countries by list
  this.importCountries = (list) => {
    countries = list;
  };

  // create a new database for nouser.
  this.createDatabase = (path) => {
    _nouserdb.createDatabase(path);
  };

  this.getUserMeta = (userid, callback) => {
    _nouserdb.getUserbyId(userid, (err, user) => {
      let user_meta = {
        userid: user.userid,
        email: user.email,
        gender : user.gender,
        phonenumber : user.phonenumber,
        birthday : user.birthday,
        country : user.country,
        address : user.address,
        aboutme : user.aboutme
      }
      try {
        user_meta.gender = user_meta.gender.replace('M', 'male');
        user_meta.gender = user_meta.gender.replace('F', 'female');
        user_meta.gender = user_meta.gender.replace('O', 'other');
      }
      catch(e) {

      }
      callback(false, user_meta);
    });
  };

  this.updateUser = (userid, jsondata, callback) => {
    let pwdhash = null;
    try {
      jsondata.gender = jsondata.gender.replace('female', 'F');
      jsondata.gender = jsondata.gender.replace('male', 'M');
      jsondata.gender = jsondata.gender.replace('other', 'O');
    }
    catch (e) {

    }
    try{
      if(!Utils.validateEmail(jsondata.email)) {
        let err = new Error("Email invalid.");
        callback(err);
      }
      else if(jsondata.gender!='M'&&jsondata.gender!='F'&&jsondata.gender!='O') {
        let err = new Error("Gender invalid.");
        callback(err);
      }
      else if(isNaN(Date.parse(jsondata.birthday))) {
        let err = new Error("Birthday invalid.");
        callback(err);
      }
      else if(!countries.includes(jsondata.country)) {
        let err = new Error("Country invalid.");
        callback(err);
      }
      else {
        _nouserdb.getUserbyId(userid, (err, user)=>{
          let expiredate = new Date();
          expiredate = Utils.addDays(expiredate, this.TokenExpirePeriod);
          user.email = jsondata.email;
          user.gender = jsondata.gender;
          user.phonenumber = jsondata.phonenumber;
          user.birthday = jsondata.birthday;
          user.country = jsondata.country;
          user.address = jsondata.address;
          user.aboutme = jsondata.aboutme;
          user.updatesql(callback);
        });
      }
    }
    catch (e) {
      callback(e);
    }
  };

  this.deleteUser = (userid, callback) => {
      _nouserdb.getUserbyId(userid, (err, user) => {
        user.delete();
        callback(false);
      });
  };

  this.close = () => {
    _nouserdb.close();
  };

};
module.exports = NoUser;
