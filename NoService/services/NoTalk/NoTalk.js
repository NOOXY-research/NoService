// NoTalk.js
// Description:
// "NoTalk.js" NOOXY Talk Service.
// Copyright 2018 NOOXY. All Rights Reserved.

const USER_MODEL_NAME = 'User';

function NoTalk(Me, NoService) {
  let _notalk_user_model;

  this.launch = (callback)=> {
    NoService.Database.Model.exist(USER_MODEL_NAME, (err, has_model)=> {
      if(err) {
        callback(err);
      }
      else if(!has_model) {
        NoService.Database.Model.define(USER_MODEL_NAME, {
          model_type: "Object",
          do_timestamp: true,
          model_key: "UserId",
          structure: {
            UserId : 'VARCHAR(255)',
            Bio : 'VARCHAR(320)',
            ShowActive : 'INTEGER',
            LatestOnline : 'DATE'
          }
        }, (err, notalk_user_model)=> {
          _notalk_user_model = notalk_user_model;
          callback(err);
        });
      }
      else {
        NoService.Database.Model.get(USER_MODEL_NAME, (err, notalk_user_model)=> {
          _notalk_user_model = notalk_user_model;
          callback(err);
        });
      }
    });
  };

  // create a channel
  this.createChannel = (meta, callback)=> {
    let uuid = NoService.Library.Utilities.generateGUID();
    // update channel metatdata
    // _notalk_user_model.getChannelbyId(uuid, (err, channel)=> {
    //   channel.ChId = uuid;
    //   channel.Type = meta.t;
    //   channel.Description = meta.d;
    //   channel.Visability = meta.v;
    //   channel.Displayname = meta.n;
    //   channel.Status = 0;
    //   channel.Thumbnail = meta.p; // abrev photo
    //   channel.Lines = 0;
    //   channel.CreatorId = meta.c;
    //   channel.updatesql((err)=> {
    //     if(err) {
    //       callback(err);
    //     }
    //     else {
    //       // add user into channel
    //       let chuserspair = [[meta.c, uuid, 0, 0, meta.c, false]];
    //       for(let key in meta.u) {
    //         // userid, chid, permition, latestrln, addedby, mute
    //         chuserspair.push([meta.u[key], uuid, 1, 0, meta.c, false]);
    //       }
    //       _notalk_user_model.updateChUserPairs(chuserspair, callback);
    //     }
    //   });
    // });
  }

  // get NoUserdb's meta data.
  this.getUserMeta = (userid, callback)=> {
    _notalk_user_model.get(userid, (err, user) => {
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
    _notalk_user_model.update({
      UserId: userid,
      Bio: meta.b
    }, callback);
  }
};

module.exports = NoTalk;
