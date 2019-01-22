// NoService/services/youservice/entry.js
// Description:
// "youservice/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

let NoUser = require('./NoUser');
let fs = require('fs');
const MAX_USERNAME = 10;

function Service(Me, NoService) {
  // Your service entry point
  // Get the service socket of your service
  let ss = NoService.Service.ServiceSocket;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not API provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by NoService.SafeCallback.
  // E.g. setTimeout(NoService.SafeCallback(callback), timeout)
  let safec = NoService.SafeCallback;
  // Your settings in manifest file.
  let settings = Me.Settings;

  let country_list = Me.Settings.country_list;
  let nouser = new NoUser();


  nouser.importUtils(NoService.Utils);
  nouser.importCountries(country_list);

  // JSONfunction is a function that can be defined, which others entities can call.
  // It is a NOOXY Service Framework Standard
  ss.def('createUser', (json, entityID, returnJSON)=>{
    // Code here for JSONfunciton
    // Return Value for JSONfunction call. Otherwise remote will not recieve funciton return value.
    let json_be_returned = {
      s: 'Succeessfully created.'
    }
    // First parameter for error, next is JSON to be returned.
    if (json.pw != json.cp) {
      json_be_returned.e = true;
      json_be_returned.s = 'Error: password not match.';
      returnJSON(false, json_be_returned);
    }
    else {
      NoService.Authenticity.createUser(json.un, json.dn, json.pw, 1, json.dt, json.fn, json.ln, (err)=>{
        if(err) {
          json_be_returned.e = true;
          json_be_returned.s = err.toString();
        }
        returnJSON(false, json_be_returned);
      });
    }
  });

  ss.def('returnUserMeta', (json, entityID, returnJSON)=>{
    NoService.Service.Entity.getEntityOwner(entityID, (err, username)=> {
      NoService.Authorization.Authby.Token(entityID, (err, valid)=>{
        if(valid) {
          NoService.Authenticity.getUserMetaByUsername(username, (err, meta1)=>{
            NoService.Authenticity.getUserIdByUsername(username, (err, userid) => {
              nouser.getUserMeta(userid, (err, meta2)=>{
                let meta = Object.assign({}, meta1, meta2);
                delete meta['pwdhash'];
                delete meta['token'];
                delete meta['tokenexpire'];
                delete meta['privilege'];

                returnJSON(false, meta);
              })
            });
          })
        }
        else {
          returnJSON(false, {});
        }
      });
    })
  });

  ss.def('getUserMetaByUserId', (json, entityID, returnJSON)=>{
    NoService.Authorization.Authby.Token(entityID, (err, valid)=>{
      if(valid) {
        NoService.Authenticity.getUserMetaByUserId(json.i, (err, meta1)=>{
          nouser.getUserMeta(json.i, (err, meta2)=>{
            let meta = Object.assign({}, meta1, meta2);
            delete meta['pwdhash'];
            delete meta['token'];
            delete meta['tokenexpire'];
            delete meta['privilege'];
            delete meta['detail'];
            delete meta['createdate'];
            delete meta['modifydate'];

            returnJSON(false, meta);
          })
        });

      }
      else {
        returnJSON(false, {});
      }
    });
  });

  ss.def('searchUsersByUsername', (json, entityID, returnJSON)=>{
    NoService.Authorization.Authby.Token(entityID, (err, valid)=>{
      if(valid) {
        if(json.n&&json.n.length>0) {
          NoService.Authenticity.searchUsersByUsernameNRows(json.n+'%', MAX_USERNAME,(err, rows)=>{
              let list = [];
              for(let i in rows) {
                let meta = rows[i];
                delete meta['pwdhash'];
                delete meta['token'];
                delete meta['tokenexpire'];
                delete meta['privilege'];
                delete meta['detail'];
                delete meta['createdate'];
                delete meta['modifydate'];
                list.push(meta);
              }
              returnJSON(false, {e: err, r:list});
          });
        }
        else {
          returnJSON(false, {e: err, r:[]});
        }
      }
      else {
        returnJSON(false, {});
      }
    });
  });



  ss.on('close', (entityID, callback) => {callback(false)});


  // Your service entry point
  this.start = ()=> {
    nouser.importModel(NoService.Database.Model, (err)=> {
      NoService.Daemon.getSettings((err, DaemonSettings)=>{
        // Access another service on this daemon
        NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoMailer', (err, NoMailersocket)=> {
          // JSONfunction is a function that can be defined, which others entities can call.
          // It is a NOOXY Service Framework Standard
          ss.def('updateUser', (json, entityID, returnJSON)=>{
            NoService.Service.Entity.getEntityOwner(entityID, (err, username)=> {
              let json_be_returned = {
                s: 'Succeessfully updated.'
              }
              NoService.Authorization.Authby.Password(entityID, (err, valid)=>{
                if(valid) {

                  for(let i in json) {
                    if(json[i] == '') {
                      json[i] = null;
                    }
                  }
                  // First parameter for error, next is JSON to be returned.
                  if (json.pw != json.cp) {
                    json_be_returned.e = true;
                    json_be_returned.s = 'Error: password not match.';
                    returnJSON(false, json_be_returned);
                  }
                  else {
                    NoService.Authenticity.updatePasswordByUsername(username, json.pw, (err)=>{
                      if(err&&json.pw!=null) {
                        json_be_returned.e = true;
                        json_be_returned.s = err.toString();
                        returnJSON(false, json_be_returned);
                      }
                      else {
                        if(json.firstname != null && json.lastname!= null) {
                          NoService.Authenticity.updateNameByUsername(username, json.firstname, json.lastname, (err)=>{
                            if(err) {
                              json_be_returned.e = true;
                              json_be_returned.s = err.toString();
                              returnJSON(false, json_be_returned);
                            }
                            else {
                              NoService.Authenticity.getUserIdByUsername(username, (err, userid) => {
                                nouser.updateUser(userid, json, (err)=>{
                                  if(err) {
                                    json_be_returned.e = true;
                                    json_be_returned.s = err.toString();
                                  }
                                  else {
                                    NoService.Service.Entity.getEntityMetaData(entityID, (err, emeta)=>{
                                      // accessing other service
                                      NoMailersocket.call('sendMail', {
                                        to: json.email,
                                        subject: DaemonSettings.daemon_display_name+" account security.",
                                        text: 'Hi! '+json.firstname+', your account has been modify.\n\n If you have no idea what happened. Please change your password!\n\nTime:'+(new Date())+'\nEntity detail:\n'+JSON.stringify(emeta, null, 2)+'\n\n'+DaemonSettings.copyright
                                      }, (error, info)=> {
                                        if(error) {
                                          console.log(error);
                                        };
                                      });
                                    });
                                  }
                                  returnJSON(false, json_be_returned);
                                });
                              });
                            }
                          });
                        }
                        else {
                          json_be_returned.e = true;
                          json_be_returned.s = 'Error: Please enter your name.';
                          returnJSON(false, json_be_returned);
                        }
                      }
                    });

                  }
                }
                else {
                  NoService.Service.Entity.getEntityMetaData(entityID, (err, emeta)=>{
                    // accessing other service
                    NoMailersocket.call('sendMail', {
                      to: json.email,
                      subject: DaemonSettings.daemon_display_name+" account security.",
                      text: 'Hi! '+json.firstname+', your account is being modifed by someone.\n\n If you have no idea what happened. Please change your password!\n\nTime:'+(new Date())+'\nEntity detail:\n'+JSON.stringify(emeta, null, 2)+'\n\n'+DaemonSettings.copyright
                    }, (error, info)=> {
                      if(error) {
                        console.log(error);
                      };
                    });
                  });
                  json_be_returned.e = true;
                  json_be_returned.s = 'Error: Auth failed.';
                  returnJSON(false, json_be_returned);
                }
              });
            });
          });
        });
      });
    });
  }

  // If the daemon stop, your service recieve close signal here.
  this.close = ()=> {
    nouser.close();
  }
}

// Export your work for system here.
module.exports = Service;
