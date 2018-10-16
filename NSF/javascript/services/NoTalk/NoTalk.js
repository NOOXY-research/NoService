// NoTalk.js
// Description:
// "NoTalk.js" NOOXY Talk Service.
// Copyright 2018 NOOXY. All Rights Reserved.


let sqlite3 = require('sqlite3');

function NoTalkDB() {
  let _database = null;

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
