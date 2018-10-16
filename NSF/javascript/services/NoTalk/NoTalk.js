// NoTalk.js
// Description:
// "NoTalk.js" NOOXY Talk Service.
// Copyright 2018 NOOXY. All Rights Reserved.


let sqlite3 = require('sqlite3');

function NoTalkDB() {
  let _database = null;

  function User(userid) {

    this.loadbyUserIdsql = (userid, next) => {
      // sql statement
      let sql = 'SELECT UserId, Bio, ShowActive, LatestOnline, Joindate FROM User WHERE UserId = ?';

      _database.get(sql, [userid], (err, row) => {
        if(err || typeof(row) == 'undefined') {
          this.UserId = userid;
          this.exisitence = false;
        }
        else {
          this.exisitence = true;
          this.UserId = row.UserId;
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
          sql = 'UPDATE User SET UserId=?, Bio=?, ShowActive=?, LatestOnline WHERE UserId=?';
          _database.run(sql, [this.userid, this.rating, this.wincount, datenow, this.userid], (err) => {
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
          sql = 'INSERT INTO users(userid, rating, wincount, modifydate) VALUES (?, ?, ?, ?);'
          _database.run(sql, [this.userid, this.rating, this.wincount, datenow], (err) => {
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
    };
  }

  this.createDatabase = (path) => {
    _database = new sqlite3.Database(path);
    // Main (Main)
    _database.run('CREATE TABLE Main(LatestChId INT)');
    // User relation (UserRel)
    _database.run('CREATE TABLE UserRel(UserId TEXT, ToUserId TEXT, Type INT)');
    // Channel/user pair (ChUserPair)
    _database.run('CREATE TABLE ChUserPair(UserId TEXT, ChId INT, Permition INT, LatestRLn INT, JoinDate DATE, Addedby TEXT, Mute INT)');
    // Channel meta (ChMeta)
    _database.run('CREATE TABLE ChMeta(ChId INT, Type INT, Description TEXT, Visability INT,'+
    ' CreateDate DATE, ModifyDate DATE, Displayname TEXT, Status INT, Request TEXT,'+
    ' Thumbnail TEXT, Lines INT, CreatorId TEXT)');
    // User (User)
    _database.run('CREATE TABLE User(UserId TEXT, JoinDate DATE, Bio TEXT, ShowActive INT, ClientPreference TEXT, LatestOnline DATE)');
    // Messege(Messege)
    _database.run('CREATE TABLE Messege(ChId INT, Line INT, UserId TEXT, Type INT, Contain TEXT, TimeStamp DATE, Detail TEXT)');
  };

  this.importDatabase = (path) => {
    _database = new sqlite3.Database(path);
  };

  this.close = ()=>{
    _database.close();
    _database = null;
  };
};

function NoTalk() {
  const _nouserdb = new NoTalkDB();
  // import database from specified path
  this.importDatabase = (path) => {
    _nouserdb.importDatabase(path);
  };

  // create a new database for nouser.
  this.createDatabase = (path) => {
    _nouserdb.createDatabase(path);
  };
};

module.exports = NoTalk;
