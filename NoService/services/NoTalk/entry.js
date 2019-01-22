// NoService/services/youservice/entry.js
// Description:
// "youservice/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.

let fs = require('fs');
const USERID_PREFIX = "UserId_";
const CHID_PREFIX = "ChId_";

function Service(Me, NoService) {
  // Your service entry point
  // Get the service socket of your service
  let ss = NoService.Service.ServiceSocket;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not API provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by NoService.SafeCallback.
  // E.g. setTimeout(NoService.SafeCallback(callback), timeout)
  let safec = NoService.SafeCallback;
  // Please save and manipulate your files in this directory
  let files_path = Me.FilesPath;
  // Your settings in manifest file.
  let settings = Me.Settings;

  let NoTalk = new (require('./NoTalk'))(Me, NoService);


  // Your service entry point
  this.start = ()=> {
    NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoUser', (err, NoUser)=> {
      NoTalk.on('message', (err, channelid, meta)=> {
        ss.emitToGroups([CHID_PREFIX+channelid], 'Message', {i:channelid, r:meta});
      });

      // NoTalk.on('channelcreated', (err, new_meta)=> {
      //   ss.emitToGroups([USERID_PREFIX+userid], 'AddedToChannel', {i:meta.ChId, r:meta});
      // });

      NoTalk.on('addedtochannel', (err, userid, meta)=> {
        ss.emitToGroups([USERID_PREFIX+userid], 'AddedToChannel', {i:meta.ChId, r:meta});
      });

      NoTalk.on('addedcontacts', (err, userid, contacts)=> {
        ss.emitToGroups([USERID_PREFIX+userid], 'AddedContacts', {r:contacts});
      });

      NoTalk.launch((err)=> {
        if(err) {
          console.log(err);
        }
        else {
          ss.on('connect', (entityId, callback)=> {
            NoService.Authorization.Authby.Token(entityId, (err, valid)=> {
              if(valid) {
                NoService.Service.Entity.getEntityOwnerId(entityId, (err, id)=>{
                  NoService.Service.Entity.addEntityToGroups(entityId, [USERID_PREFIX+id], (err)=> {
                    callback(err);
                  });
                });
              }
              else {
                callback(false);
              }
            });
          });

          ss.def('createCh', (json, entityId, returnJSON)=> {
            NoService.Authorization.Authby.Token(entityId, (err, valid)=> {
              if(valid) {
                NoService.Service.Entity.getEntityOwnerId(entityId, (err, id)=>{
                  json.c = id;
                  NoTalk.createChannel(json, (err, chid)=> {
                    if(err) {
                      returnJSON(false, {e: err.stack, s:err.toString()});
                    }
                    else {
                      returnJSON(false, {s: "OK", i:chid});
                    }

                  });
                });
              }
              else {
                returnJSON(false, {s: "Auth failed"});
              }
            });
          });

          ss.def('addConts', (json, entityId, returnJSON)=> {
            NoService.Authorization.Authby.Token(entityId, (err, valid)=> {
              if(valid) {
                NoService.Service.Entity.getEntityOwnerId(entityId, (err, id)=>{
                  json.i = id;
                  // json.c to
                  NoTalk.addContacts(json, (err)=> {
                    if(err) {
                      returnJSON(false, {e: err.stack, s:err.toString()});
                    }
                    else {
                      returnJSON(false, {s: "OK"});
                    }
                  });
                });
              }
              else {
                returnJSON(false, {s: "Auth failed"});
              }
            });
          });

          ss.def('addUsersToCh', (json, entityId, returnJSON)=> {
            NoService.Authorization.Authby.Token(entityId, (err, valid)=> {
              if(valid) {
                NoService.Service.Entity.getEntityOwnerId(entityId, (err, adderId)=>{
                  NoTalk.addUsersToChannel(adderId, json.c, json.i, (err)=> {
                    if(err) {
                      returnJSON(false, {e: err.stack, s:err.toString()});
                    }
                    else {
                      returnJSON(false, {s: "OK"});
                    }
                  });
                });
              }
              else {
                returnJSON(false, {s: "Auth failed"});
              }
            });
          });

          ss.def('getMyConts', (json, entityId, returnJSON)=> {
            NoService.Authorization.Authby.Token(entityId, (err, valid)=> {
              if(valid) {
                NoService.Service.Entity.getEntityOwnerId(entityId, (err, id)=>{
                  NoTalk.getContacts(id, (err, contacts_list)=> {
                    if(err) {
                      returnJSON(false, {e: err.stack});
                    }
                    else {
                      returnJSON(false, {r:contacts_list});
                    }
                  });
                });
              }
              else {
                returnJSON(false, {s: "Auth failed"});
              }
            });
          });

          ss.def('getMsgs', (json, entityId, returnJSON)=> {
            NoService.Authorization.Authby.Token(entityId, (err, valid)=> {
              if(valid) {
                NoService.Service.Entity.getEntityOwnerId(entityId, (err, id)=>{
                  NoTalk.getMessages(id, json.i, json, (err, result)=> {
                    if(err) {
                      returnJSON(false, {e: err.stack, s:err.toString()});
                    }
                    else {
                      returnJSON(false, {s: "OK", r:result});
                    }
                  });
                });
              }
              else {
                returnJSON(false, {s: "Auth failed"});
              }
            });
          });

          ss.def('sendMsg', (json, entityId, returnJSON)=> {
            NoService.Authorization.Authby.Token(entityId, (err, valid)=> {
              if(valid) {
                NoService.Service.Entity.getEntityOwnerId(entityId, (err, id)=>{
                  // console.log(json);
                  NoTalk.sendMessage(id, json.i, json.c, (err)=> {
                    if(err) {
                      returnJSON(false, {e: err.stack, s:err.toString()});
                    }
                    else {
                      returnJSON(false, {s: "OK"});
                    }
                  });
                });
              }
              else {
                returnJSON(false, {s: "Auth failed"});
              }
            });
          });

          ss.def('bindChs', (json, entityId, returnJSON)=> {
            NoService.Authorization.Authby.Token(entityId, (err, valid)=> {
              if(valid) {
                NoService.Service.Entity.addEntityToGroups(entityId, json.i.map(id=>{return(CHID_PREFIX+id)}), (err)=> {
                    returnJSON(false, {s: "OK"});
                });
              }
              else {
                returnJSON(false, {e:true, s: "Auth failed"});
              }
            });
          });

          ss.def('getMyChs', (json, entityId, returnJSON)=> {
            NoService.Authorization.Authby.Token(entityId, (err, valid)=> {
              if(valid) {
                  NoService.Service.Entity.getEntityOwnerId(entityId, (err, id)=>{
                    NoTalk.getUserChannels(id, (err, channels)=> {
                      returnJSON(false, channels);
                    });
                  });
              }
              else {
                returnJSON(false, {});
              }
            });
          });



          ss.def('getUserMeta', (json, entityId, returnJSON)=> {
            NoService.Authorization.Authby.Token(entityId, (err, valid)=> {
              if(valid) {
                NoUser.call("getUserMetaByUserId", json, (err, nousermeta)=> {
                  NoService.Service.Entity.getEntityOwner(entityId, (err, name)=>{
                    NoService.Service.Entity.getEntityOwnerId(entityId, (err, id)=>{
                      NoTalk.getUserMeta(json.i, (err, meta)=> {
                        meta.n = name;
                        returnJSON(false, Object.assign({}, nousermeta, meta));
                      });
                    });
                  });
                });

              }
              else {
                returnJSON(false, {});
              }
            });
          });

          ss.def('getMyMeta', (json, entityId, returnJSON)=> {
            NoService.Authorization.Authby.Token(entityId, (err, valid)=> {
              if(valid) {
                NoService.Service.Entity.getEntityOwner(entityId, (err, name)=>{
                  NoService.Service.Entity.getEntityOwnerId(entityId, (err, id)=>{
                    NoTalk.getUserMeta(id, (err, meta)=> {
                      meta.n = name;
                      returnJSON(false, meta);
                    });
                  });
                });
              }
              else {
                returnJSON(false, {});
              }
            });
          });

          ss.def('updateMyMeta', (json, entityId, returnJSON)=> {
            NoService.Authorization.Authby.Token(entityId, (err, valid)=> {
              if(valid) {
                NoService.Service.Entity.getEntityOwnerId(entityId, (err, id)=>{
                  NoTalk.updateUserMeta(id, json, (err)=> {
                    if(err) {
                      returnJSON(false, {s:err});
                    }
                    else {
                      ss.emitToGroups([USERID_PREFIX+id], 'MyMetaUpdated', json);
                      returnJSON(false, {s:'OK'});
                    }
                  });
                });
              }
              else {
                returnJSON(false, {s: 'Auth failed'});
              }
            });
          });
        }
      });
    });
  }

  // If the daemon stop, your service recieve close signal here.
  this.close = ()=> {

  }
}

// Export your work for system here.
module.exports = Service;
