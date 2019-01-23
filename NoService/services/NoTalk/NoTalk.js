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
    "addedtochannel": ()=> {},
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

  this.addContacts = (meta, callback)=> {
    let index = 0;
    let result = [];
    let op = ()=> {
      if(index<meta.c.length) {
        if(meta.i&&meta.c[index]) {
          result.push({UserId: meta.i, ToUserId: meta.c[index], Type: meta.t});
          _models.UserRel.getByPair([meta.i, meta.c[index]], (err, [row])=> {
            if(row) {
              _models.UserRel.update({UserId: meta.i, ToUserId: meta.c[index], Type: meta.t}, (err)=> {
                if(err) {
                  callback(err);
                }
                else {
                  index++;
                  op();
                }
              });
            }
            else {
              _models.UserRel.create({UserId: meta.i, ToUserId: meta.c[index], Type: meta.t}, (err)=> {
                if(err) {
                  callback(err);
                }
                else {
                  index++;
                  op();
                }
              });
            }
          });
        }
        else {
          index++;
          op();
        }
      }
      else {
        callback(false);
        _on['addedcontacts'](false, meta.i, result);
      }
    }
    if(meta&&meta.i&&meta.c) {
      op();
    }
    else {
      callback(true);
    }
  }

  this.getContacts = (userid, callback)=> {
    _models.UserRel.getByFirst(userid, callback);
  }

  // create a channel
  this.createChannel = (meta, callback)=> {
    let uuid = NoService.Library.Utilities.generateGUID();
    if(meta.n!=null&&meta.t!=null&&meta.a!=null&&meta.c!=null) {
      let new_meta = {
        ChId: uuid,
        Type: meta.t,
        Description: meta.d,
        AccessLevel: meta.a,
        Displayname: meta.n,
        Status: 0,
        Thumbnail: meta.p, // abrev photo
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
              Role: 0,
              LatestRLn: 0,
              Addedby: meta.c,
              mute: 0
            }, (err)=> {
              if(!err) {
                _on['channelcreated'](err, new_meta);
                _on['addedtochannel'](err, meta.c, new_meta);
                callback(err, uuid);
              }
              else {
                _models.ChMeta.remove(uuid, (e)=> {
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

  // update a channel
  this.updateChannel = (modifyerId, meta, callback)=> {

    if(meta.i!=null) {
      _models.ChUserPair.getByPair([meta.i, modifyerId], (err, [pair])=> {
        if(pair&&pair.Role==0) {
          let new_meta = {
            ChId: meta.i,
            Type: meta.t,
            Description: meta.d,
            AccessLevel: meta.a,
            Displayname: meta.n,
            Thumbnail: meta.p, // abrev photo
          };
          for(let key in new_meta) {
            if(new_meta[key]==null) {
              delete new_meta[key];
            }
          }
          // update metatdata
          _models.ChMeta.update(new_meta, (err)=> {
            if(err) {
              callback(err);
            }
            else {
              callback(err);
              _on["channelupdated"](err, new_meta);
            }
          });
        }
        else {
          callback(new Error('You have no permission to edit this channel.'));
        }
      });
    }
    else {
      callback(new Error('Channel metadata is not complete.'));
    }
  };

  this.addUsersToChannel = (adderId, channelid, usersId, callback)=> {
    _models.ChMeta.get(channelid, (err, chmeta)=> {
      let index = 0;
      let op=()=>{
        if(index<usersId.length) {
          _models.ChUserPair.create({
            UserId: usersId[index],
            ChId: channelid,
            Role: 1,
            LatestRLn: 0,
            Addedby: adderId,
            mute: 0
          }, (err)=> {
            if(!err) {
              _on['addedtochannel'](err, usersId[index], chmeta);
              index++;
              op();
            }
            else {
              callback(err);
            }
          });
        }
        else {
          callback(false);
        }
      }
      op();
    });

  };

  this.getMessages = (userid, channelid, meta, callback)=> {
    let _get = ()=> {
      if(meta.b) {
        _models.Message.getRowsFromTo(channelid, meta.b, meta.b+meta.r-1, (err, rows)=> {
          let result = {};
          for(let i in rows) {
            result[rows[i].Idx] = [rows[i].UserId, rows[i].Type, rows[i].Contain, rows[i].Detail, row[i].modifydate];
          }
          callback(false, result);
        })
      }
      else {
        _models.Message.getLatestNRows(channelid, meta.r, (err, rows)=> {
          let result = {};
          for(let i in rows) {
            result[rows[i].Idx] = [rows[i].UserId, rows[i].Type, rows[i].Contain, rows[i].Detail, rows[i].modifydate];
          }
          callback(false, result);
        })
      }
    };

    if(userid) {
      _models.ChUserPair.getByPair([channelid, userid], (err, [pair])=> {
        if(pair == null || pair.Role == null ||pair.Role>1) {
          _models.ChMeta.get(channelid, (err, chmeta)=> {
            if(chmeta) {
              if(chmeta.AccessLevel>=4) {
                _get();
              }
              else {
                callback(new Error("You have no getMessages permition."));
              }
            }
            else {
              callback(new Error("You have no getMessages permition."));
            }
          });
        }
        else if(pair.Role==0) {
          _get();
        }
        else if(pair.Role==1){
          _get();
        }
      });
    }
    else {
      _models.ChMeta.get(channelid, (err, chmeta)=> {
        if(chmeta) {
          if(chmeta.AccessLevel>=5) {
            _get();
          }
          else {
            callback(new Error("You have no getMessages permition."));
          }
        }
        else {
          callback(new Error("You have no getMessages permition."));
        }
      });
    }
  };

  this.sendMessage = (userid, channelid, meta, callback)=> {
    let _send = ()=> {
      _models.Message.appendRows(channelid, [{Type:meta[0], Contain:meta[1], Detail:meta[2], UserId: userid}], (err)=> {
        if(err) {
          callback(err);
        }
        else {
          _on['message'](err, channelid, [userid, meta[0], meta[1], meta[2], (new Date()).toString()]);
          callback(err);
        }
      });
    };
    if(userid) {
      _models.ChUserPair.getByPair([channelid, userid], (err, [pair])=> {
        if(pair == null || pair.Role == null ||pair.Role>1) {
          _models.ChMeta.get(channelid, (err, chmeta)=> {
            if(chmeta&&chmeta.AccessLevel>=4) {
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
            if(chmeta&&chmeta.AccessLevel>=1) {
              _send();
            }
            else {
              callback(new Error("You have no sendMessage permition."));
            }
          });
        }
        else {

        }
      });
    }
    else {
      _models.ChMeta.get(channelid, (err, chmeta)=> {
        if(chmeta&&chmeta.AccessLevel>=5) {
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

  this.initUserMeta = (userid, callback)=> {
    this.getUserMeta(userid, (err, meta)=> {
      if(meta.i) {
        callback(false);
      }
      else {
        this.updateUserMeta(userid, {a:0}, callback);
      }
    });
  };

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
