// NoTalk.js
// Description:
// "NoTalk.js" NOOXY Talk Service.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';
let models_dict = require('./models.json')

function NoTalk(Me, NoService) {
  let _models;



  this.launch = (callback)=> {
    NoService.Database.Model.doBatchSetup(models_dict, (err, models)=> {
      _models = models;
      if(callback)
        callback(err);
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
    _models.User.update({
      UserId: userid,
      Bio: meta.b
    }, callback);
  }
};

module.exports = NoTalk;
