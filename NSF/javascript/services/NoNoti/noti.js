let sqlite3 = require('sqlite3');

generateGUID = function() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +s4() + '-' + s4() + s4() +
   s4();
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

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
      let sql = 'SELECT userid, userchannel, queuenotis, channels FROM users WHERE userid = ?';

      _database.get(sql, [UserID], (err, row) => {
        if(err || typeof(row) == 'undefined') {
          this.userid = UserID;
          this.exisitence = false;
        }
        else {
          this.exisitence = true;
          this.userid = row.userid;
          this.userchannel = row.userchannel;
          this.queuenotis = row.queuenotis;
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
          sql = 'UPDATE users SET userid=?, userchannel=?, queuenotis=?, channels=? WHERE userid = ?';
        }
        else {
          sql = 'INSERT INTO users(userid, userchannel, queuenotis, channels) VALUES (?, ?, ?, ?);'
        }
        _database.run(sql, [this.userid, this.userchannel, this.queuenotis, this.channels], (err) => {
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
      this.queuenotis = null;
      this.channels = null;
    };
  }

  function Noti(NotiID) {

    this.loadsql = (next) => {

      // sql statement
      let sql = 'SELECT id, channel, title, content, date FROM notis WHERE id = ?';

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
          this.date = row.date;
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
          sql = 'UPDATE notis SET id=?, channel=?, title=?, content=? date=? WHERE id = ?';
        }
        else {
          sql = 'INSERT INTO notis(id, channel, title, content, date) VALUES (?, ?, ?, ?, ?);'
        }
        _database.run(sql, [this.id, this.channel, this.title, this.content, this.date], (err) => {
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
      this.date = null;
    };
  }

  this.importDatabase = (path) => {
    _database = new sqlite3.Database(path);
  };

  this.createDatabase = (path) => {
    _database = new sqlite3.Database(path);

    _database.run('CREATE TABLE channels(id text, displayname text, description text, subscribers text');
    _database.run('CREATE TABLE users(userid text, userchannel text, queuenotis text, channels text');
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
  let _notificationdb = new NotificationDataBase();
  let _online_users = {};
  let _activated_channels = {};

  let _sendNotisCallback = (userid , Notis) => {
    this.onNotis(userid , Notis);
  }

  function User(userid) {
    let _userchannelid = null;
    let _queuenotis = [];
    let _channels = [];

    this.sendNotis = (notis) => {
      let notislist = [];
      for(let i in notis) {

      }
      _sendNotisCallback(userid, notislist);
    };

    this.removeQueueNoti = (queuenotis) => {
      for(let qnotiid in queuenotis) {
        let index = _queuenotis.indexOf(qnotiid);
        if (index > -1) {
          _queuenotis.splice(qnotiid, 1);
        }
      }
      _notificationdb.getUser(userid, (err, userdb)=> {
        userdb.queuenotis = JSON.stringify(_queuenotis);
      });
    };

    this.addQueueNoti = (queuenotis) => {
      _queuenotis = _queuenotis.concat(queuenotis);
      _notificationdb.getUser(userid, (err, userdb)=> {
        userdb.queuenotis = JSON.stringify(_queuenotis);
      });
    };

    this.returnQueueNoti = () => {
      return _queuenotis;
    };

    this.addChannel = (channelid) => {
      if(!_channels.includes(channelid)) {
        _channels.push(_channels.push);
        _notificationdb.getUser(userid, (err, userdb)=> {
          userdb.userchannel = JSON.stringify(_channels);
        });
      }
    };

    this.removeChannel = (channelid) => {
      if(channel != _userchannelid) {
        if(_channels.includes(channelid)) {
          let index = _channels.indexOf(channelid);
          if (index > -1) {
            _channels.splice(index, 1);
          }
          _notificationdb.getUser(userid, (err, userdb)=> {
            userdb.userchannel = JSON.stringify(_channels);
          });
        }
      }
    }

    this.loaddb = (callback) => {
      _notificationdb.getUser(userid, (err, userdb)=> {
        if(userdb.exisitence == false) {
          userdb.userchannel = generateGUID();
          userdb.userid = userid;
          userdb.queuenotis = JSON.stringify([]);
          userdb.channels = JSON.stringify([]);
          let c = new Channel(userdb.userchannel);
          c.addUser(userid);
          delete c;
          userdb.updatesql((err)=>{
            _userchannelid = userdb.userchannel;
            _queuenotis = JSON.stringify(userdb.queuenotis);
            _channels = JSON.stringify(userdb.channels);
            callback(err);
          });
        }
        else {
          _userchannelid = userdb.userchannel;
          _queuenotis = JSON.stringify(userdb.queuenotis);
          _channels = JSON.stringify(userdb.channels);
          callback(false);
        }
      });
    };
  }

  function Channel(channelid) {
    let _subscriber = [];
    let _display_name = null;
    let _description = null;

    this.loaddb = (callback) => {
      _notificationdb.getChannel(channelid, (err, channeldb)=> {
        if(channeldb.exisitence == false) {
          channeldb.id = channelid;
          channeldb.displayname = null;
          channeldb.description = null;
          channeldb.subscribers = JSON.stringify([]);

          channeldb.updatesql((err)=>{
            subscribers = JSON.parse(channeldb.subscribers);
            _display_name = channeldb.displayname;
            _description = channeldb.description;
            callback(err);
          });
        }
        else {
          _subscriber = JSON.parse(channeldb.subscribers);
          _display_name = channeldb.displayname;
          _description = channeldb.description;
          callback(false);
        }
      });
    };

    this.updateDescription = (description, callback) => {
      _description = description;
      _notificationdb.getChannel(channelid, (err, channeldb)=> {
        channeldb.description = JSON.stringify(_subscriber);
        channeldb.updatesql(callback);
      });
    }

    this.addSubscriber = (userid, callback) => {
      if(!_users.includes(userid)) {
        _subscriber.push(userid);
        _notificationdb.getChannel(channelid, (err, channeldb)=> {
          channeldb.subscribers = JSON.stringify(_subscriber);
          channeldb.updatesql((err)=>{
            if(_online_users[userid] != null) {
              _online_users[userid].addChannel(channelid);
              callback(err);
            }
            else {
              let _user = new User(userid);
              _user.loaddb((err2)=>{
                _user.addChannel(channelid);
                callback(err2);
              });
            }
          });
        });
      }
    };

    this.removeSubscriber = (userid, callback) => {
      if(_users.includes(userid)) {
        let index = _users.indexOf(userid);
        if (index > -1) {
          _users.splice(index, 1);
        }
        _notificationdb.getChannel(channelid, (err, channeldb)=> {
          channeldb.subscribers = JSON.stringify(_subscriber);
          channeldb.updatesql((err)=>{
            if(_online_users[userid] != null) {
              _online_users[userid].removeChannel(channelid);
              callback(err);
            }
            else {
              let _user = new User(userid);
              _user.loaddb((err2)=>{
                _user.removeChannel(channelid);
                callback(err2);
              });
            }
          });
        });
      }
    };

    this.sendInstantNotis = (notis) => {
      for(let userid in _online_users) {
        if(_subscriber.includes(_online_users[userid])) {
          _online_users[userid].sendNotis(notis);
        };
      };
    };

    this.addQueueNotis = (notis, callback) => {
      this.sendInstantNotis(notis);
      for(let userid in _subscriber) {
        let _user = new User(userid);
        _user.loaddb((err)=> {
          _user.addQueueNoti(notis, callback);
        });
      }
    };
  }


  this.addOnlineUser = (userid) => {
    let _user = new User(userid);
    _online_users[userid] = _user;
    _notidb.getUser(userid, (userdb)=> {
      let queuenotis = JSON.parse(userdb.queuenotis);
      let notis = [];
      let i = 0;
      let loop = () => {
        _notidb.getNoti(queuenotis[i], (notidb)=> {
          let Noti_json = {
            t:notidb.title,
            c:notidb.content,
            i:notidb.id
          };
          queuenotis.push(Noti);
          if(i<queuenotis.length) {
            loop();
          }
        });
      }
      loop();
      _user.sendNotis(notis);
    });

  };

  this.createChannel = (name, description, callback) => {
    callback(false, channelid);
  };

  this.deleteOnlineUser = (userid) => {
    delete _online_users[userid];
  };

  this.addUsertoChannel = (userid, channelid) => {

  };

  this.deleteNotisofUser = (userid, notisid) => {

  };

  this.addUsertoChannel = (userid) => {

  };

  this.deleteUserfromChannel = (userid) => {

  };

  this.addQueueNotistoChannel = (userid) => {

  };

  this.sendInstantNotitoChannel = (userid) => {

  };

  this.onNotis = (userid , Notis) => {
    api.Utils.tagLog('*ERR*', 'onNotis not implemented.');
  }

  this.activateChannel = () => {

  };

  this.importDatabase = () => {

  };
}


module.exports =  Notification;
