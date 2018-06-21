let sqlite3 = require('sqlite3');

// database obj for accessing database of authenticity.
let NotificationDataBase = function () {
  let _database = null;
  let _cachedchannel = {};
  let _cachedusers = {};

  this.MaxCacheSize = 1000; // Channels Users

  function Channel(ChannelID) {

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
    // types: "instant", "queue"
    _database.run('CREATE TABLE channels(channelid text, displayname text,  type text, subscriber text, history datetime, privilege text, detail text)');
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

function Notification() {
  let _online_users = {};
  
  function User() {

  }


  this.addOnlineUser = (username) => {

  }

  this.deleteOnlineUser = (username) => {

  }

  this.addUsertoChannel = (username) => {

  }

  this.deleteNotiofUser = (username) => {

  }

  this.addUsertoChannel = (username) => {

  }

  this.deleteUserfromChannel = (username) => {

  }

  this.addQueueNotitoChannel = (username) => {

  }

  this.deleteQueueNotifromChannel = (username) => {

  }

  this.onNotis = (username , Notis) => {

  }
}


module.exports =  Notification;
