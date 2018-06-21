let sqlite3 = require('sqlite3');

// database obj for accessing database of authenticity.
let NotificationDataBase = function () {
  let _database = null;
  let _cachedchannels = {};
  let _cachedusers = {};
  let _cachednotis = {};

  this.MaxCacheSize = 1000;

  function Channel(ChannelID) {

    this.loadsql = (next) => {

      // sql statement
      let sql = 'SELECT id, displayname, description, subscribers FROM channels WHERE id = ?';

      _database.get(sql, [ChannelID], (err, row) => {
        if(err || typeof(row) == 'undefined') {
          this.id = ChannelID;
          this.exisitence = false;
        }
        else {
          this.exisitence = true;
          this.id = row.id;
          this.displayname = row.displayname;
          this.description = row.description;
          this.subscribers = row.subscribers;
        }
        _database.close();
        next(false);
      })

    };

    // write newest information of user to database.
    this.updatesql = (callback) => {
      let sql = null;
      let err = null;
      if(typeof(this.id) == 'undefined') {
        throw 'Channel id undefined.';
      }
      else {
        if(this.exisitence) {
          sql = 'UPDATE channels SET id=?, displayname=?, description=?, subscribers=? WHERE id = ?';
        }
        else {
          sql = 'INSERT INTO channels(id, displayname, description, subscribers) VALUES (?, ?, ?, ?);'
        }
        _database.run(sql, [this.id, this.displayname, this.description, this.subscribers], (err) => {
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
      _database.run('DELETE FROM users WHERE id=?;', [this.id])
      this.exisitence = false;
      this.id = null;
      this.displayname = null;
      this.description = null;
      this.subscribers = null;
    };
  }

  function User(UserID) {

    this.loadsql = (next) => {

      // sql statement
      let sql = 'SELECT userid, userchannel, queuenoti, channels FROM users WHERE userid = ?';

      _database.get(sql, [UserID], (err, row) => {
        if(err || typeof(row) == 'undefined') {
          this.userid = UserID;
          this.exisitence = false;
        }
        else {
          this.exisitence = true;
          this.userid = row.userid;
          this.userchannel = row.userchannel;
          this.queuenoti = row.queuenoti;
          this.channels = row.channels;
        }
        _database.close();
        next(false);
      })

    };

    // write newest information of user to database.
    this.updatesql = (callback) => {
      let sql = null;
      let err = null;
      if(typeof(this.userid) == 'undefined') {
        throw 'User id undefined.';
      }
      else {
        if(this.exisitence) {
          sql = 'UPDATE users SET userid=?, userchannel=?, queuenoti=?, channels=? WHERE userid = ?';
        }
        else {
          sql = 'INSERT INTO users(userid, userchannel, queuenoti, channels) VALUES (?, ?, ?, ?);'
        }
        _database.run(sql, [this.userid, this.userchannel, this.queuenoti, this.channels], (err) => {
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
      _database.run('DELETE FROM users WHERE userid=?;', [this.userid])
      this.exisitence = false;
      this.userid = null;
      this.userchannel = null;
      this.queuenoti = null;
      this.channels = null;
    };
  }

  function Noti(NotiID) {

    this.loadsql = (next) => {

      // sql statement
      let sql = 'SELECT id, channel, title, content FROM notis WHERE id = ?';

      _database.get(sql, [NotiID], (err, row) => {
        if(err || typeof(row) == 'undefined') {
          this.id = NotiID;
          this.exisitence = false;
        }
        else {
          this.exisitence = true;
          this.id = row.id;
          this.channel = row.channel;
          this.title = row.title;
          this.content = row.content;
        }
        _database.close();
        next(false);
      })

    };

    // write newest information of user to database.
    this.updatesql = (callback) => {
      let sql = null;
      let err = null;
      if(typeof(this.id) == 'undefined') {
        throw 'User id undefined.';
      }
      else {
        if(this.exisitence) {
          sql = 'UPDATE notis SET id=?, channel=?, title=?, content=? WHERE id = ?';
        }
        else {
          sql = 'INSERT INTO notis(id, channel, title, content) VALUES (?, ?, ?, ?);'
        }
        _database.run(sql, [this.id, this.channel, this.title, this.content], (err) => {
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
      _database.run('DELETE FROM notis WHERE id=?;', [this.id])
      this.exisitence = false;
      this.id = null;
      this.channel = null;
      this.title = null;
      this.content = null;
    };
  }

  this.importDatabase = (path) => {
    _database = new sqlite3.Database(path);
  };

  this.createDatabase = (path) => {
    _database = new sqlite3.Database(path);

    _database.run('CREATE TABLE channels(id text, displayname text, description text, subscribers text');
    _database.run('CREATE TABLE users(userid text, userchannel text, queuenoti text, channels text');
    _database.run('CREATE TABLE notis(id text, channel text, title text, content text');
  };

  this.getChannel = (channelid, callback) => {
    let err = null;
    if(typeof(_cachedchannel[channelid]) == 'undefined') {
      let channel = new Channel(channelid);
      channel.loadsql((err)=>{
        _cachedchannel[channelid] = channel;
        callback(err, _cachedchannel[channelid]);
      });
    }
    else {
      callback(err, _cachedchannel[channelid]);
    }
  }

  this.getUser = (userid, callback) => {
    let err = null;
    if(typeof(_cachedusers[userid]) == 'undefined') {
      let user = new User(userid);
      user.loadsql((err)=>{
        _cachedusers[userid] = user;
        callback(err, _cachedusers[userid]);
      });
    }
    else {
      callback(err, _cachedusers[userid]);
    }
  }

  this.getNoti = (notiid, callback) => {
    let err = null;
    if(typeof(_cachednotis[notiid]) == 'undefined') {
      let noti = new Noti(notiid);
      noti.loadsql((err)=>{
        _cachednotis[notiid] = noti;
        callback(err, _cachednotis[notiid]);
      });
    }
    else {
      callback(err, _cachednotis[notiid]);
    }
  }
}

function Notification() {
  let _notidb = new NotificationDataBase();
  let _online_users = {};

  function User(_sendNotisCallback) {
    this.sendNotis = (Notis_json) => {

    }; //
  }

  function Channel() {
    this.
  }


  this.addOnlineUser = (userid) => {

  }

  this.deleteOnlineUser = (userid) => {

  }

  this.addUsertoChannel = (userid) => {

  }

  this.deleteNotiofUser = (userid) => {

  }

  this.addUsertoChannel = (userid) => {

  }

  this.deleteUserfromChannel = (userid) => {

  }

  this.addQueueNotitoChannel = (userid) => {

  }

  this.addInstantNotitoChannel = (userid) => {

  }

  this.deleteQueueNotifromChannel = (userid) => {

  }

  this.onNotis = (userid , Notis) => {
    api.Utils.tagLog('*ERR*', 'onNotis not implemented.');
  }

  this.importDatabase = () => {

  }
}


module.exports =  Notification;
