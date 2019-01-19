// NoTalk.js
// Description:
// "NoTalk.js" NOOXY Talk Service.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';
let models_dict = require('./models.json')

function NoTalk(Me, NoService) {
  let _models;
  let _on = {
    "message": ()=> {},
    "channelcreated": ()=> {},
    "channelmemberadded": ()=> {},
  };

  this.on = (event, callback) => {
    _on[event] = callback;
  };

  this.launch = (callback)=> {
    NoService.Database.Model.doBatchSetup(models_dict, (err, models)=> {
      _models = models;
      if(callback)
        callback(err);
    });
  };

  this.getUserChannels = (userid, callback)=> {
    let channels = {};
    _models.ChUserPair.getBySecond(userid, (err, pairs)=> {
      let chs = pairs.map((pair) => {
        return pair.ChId
      });
      let index = 0;
      let op = ()=> {
        _models.ChMeta.get(chs[index], (err, meta)=> {
          channels[chs[index]] = meta;
          index++;
          if(index<chs.length) {
            op();
          }
          else {
            callback(err, channels);
          }
        });
      };
      op();
    });
  };

  // create a channel
  this.createChannel = (meta, callback)=> {
    console.log(meta);
    let uuid = NoService.Library.Utilities.generateGUID();
    if(meta.n!=null&&meta.t!=null&&meta.v!=null&&meta.c!=null) {
      let new_meta = {
        ChId: uuid,
        Type: meta.t,
        Description: meta.d,
        Visability: meta.v,
        Displayname: meta.n,
        Status: 0,
        Thumbnail: meta.p, // abrev photo
        Lines: 0,
        CreatorId: meta.c
      };
      // update metatdata
      _models.ChMeta.create(new_meta, (err)=> {
          if(err) {
            callback(err);
          }
          else {
            _models.ChUserPair.create({
              UserId: meta.c,
              ChId: uuid,
              Permition: 0,
              LatestRLn: 0,
              mute: 0
            }, (err)=> {
              if(!err) {
                _on['channelcreated'](err, new_meta);
                callback(err);
              }
              else {
                _models.ChMeta.remove(uuid, (err)=> {
                  callback(err);
                });
              }
            });
          }
      });
    }
    else {
      callback(new Error('Channel metadata is not complete.'));
    }
  };

  this.addUsersToChannel = (adderId, usersId, callback)=> {

  };

  this.sendMessage = (senderId, channelid, meta, callback)=> {
    let _send = ()=> {
      _models.Message.appendRows(channelid, [{Type:meta[0], Contain:meta[1], Detail:meta[2], UserId: senderId}]);
      callback(false);
    };
    if(senderId) {
      _models.ChUserPair.getByBoth([meta.i, senderId], (err, [pair])=> {

        if(pair == null|| pair.Role>1) {
          _models.ChMeta.get(channelid, (err, chmeta)=> {
            if(chmeta.AccessLevel>=4) {
              _send();
            }
            else {
              callback(new Error("You have no sendMessage permition."));
            }
          });
        }
        else if(pair.Role==0) {
          _send();
        }
        else if(pair.Role==1){
          _models.ChMeta.get(channelid, (err, chmeta)=> {
            if(chmeta.AccessLevel>=1) {
              _send();
            }
            else {
              callback(new Error("You have no sendMessage permition."));
            }
          });
        }
      });
    }
    else {
      _models.ChMeta.get(channelid, (err, chmeta)=> {
        if(chmeta.AccessLevel>=5) {
          _send();
        }
        else {
          callback(new Error("You have no sendMessage permition."));
        }
      });
    }

  };

  // get NoUserdb's meta data.
  this.getUserMeta = (userid, callback)=> {
    _models.User.get(userid, (err, user) => {
      if(user) {
        let user_meta = {
          i: user.UserId,
          b: user.Bio,
          a: user.ShowActive,
          l: user.LatestOnline,
          j: user.createdate
        }
        callback(false, user_meta);
      }
      else {
        callback(false, {});
      }
    });
  }

  // get NoUserdb's meta data.
  this.updateUserMeta = (userid, meta, callback)=> {
    let new_meta = {UserId: userid};
    for(let key in meta) {
      if(key=='b') {
        new_meta.Bio = meta.b;
      }
      else if(key=='a') {
        new_meta.ShowActive = meta.a;
      }
    }
    _models.User.update(new_meta, callback);
  }
};

module.exports = NoTalk;
