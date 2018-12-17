// NoService/services/youservice/entry.js
// Description:
// "youservice/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

let NoUser = require('./NoUser');
let fs = require('fs');

function Service(Me, api) {
  // Your service entry point
  // Get the service socket of your service
  let ss = api.Service.ServiceSocket;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not API provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by api.SafeCallback.
  // E.g. setTimeout(api.SafeCallback(callback), timeout)
  let safec = api.SafeCallback;
  // Your settings in manifest file.
  let settings = Me.Settings;

  let country_list = Me.Settings.country_list;
  let nouser = new NoUser();

  nouser.importModel(api.Database.Model, (err)=> {
  });
  nouser.importUtils(api.Utils);
  nouser.importCountries(country_list);


  // Your service entry point
  this.start = ()=> {
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
        api.Authenticity.createUser(json.un, json.dn, json.pw, 1, json.dt, json.fn, json.ln, (err)=>{
          if(err) {
            json_be_returned.e = true;
            json_be_returned.s = err.toString();
          }
          returnJSON(false, json_be_returned);
        });
      }
    });

    ss.def('returnUserMeta', (json, entityID, returnJSON)=>{
      api.Service.Entity.getEntityOwner(entityID, (err, username)=> {
        api.Authorization.Authby.Token(entityID, (err, valid)=>{
          if(valid) {
            api.Authenticity.getUserMeta(username, (err, meta1)=>{
              api.Authenticity.getUserID(username, (err, userid) => {
                nouser.getUserMeta(userid, (err, meta2)=>{
                  returnJSON(false, Object.assign({}, meta1, meta2));
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

    // JSONfunction is a function that can be defined, which others entities can call.
    // It is a NOOXY Service Framework Standard
    ss.def('updateUser', (json, entityID, returnJSON)=>{
      api.Service.Entity.getEntityOwner(entityID, (err, username)=> {
        let json_be_returned = {
          s: 'Succeessfully updated.'
        }
        api.Authorization.Authby.Password(entityID, (err, valid)=>{
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
              api.Authenticity.updatePassword(username, json.pw, (err)=>{
                if(err&&json.pw!=null) {
                  json_be_returned.e = true;
                  json_be_returned.s = err.toString();
                  returnJSON(false, json_be_returned);
                }
                else {
                  if(json.firstname != null && json.lastname!= null) {
                    api.Authenticity.updateName(username, json.firstname, json.lastname, (err)=>{
                      if(err) {
                        json_be_returned.e = true;
                        json_be_returned.s = err.toString();
                        returnJSON(false, json_be_returned);
                      }
                      else {
                        api.Authenticity.getUserID(username, (err, userid) => {
                          nouser.updateUser(userid, json, (err)=>{
                            if(err) {
                              json_be_returned.e = true;
                              json_be_returned.s = err.toString();
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
            json_be_returned.e = true;
            json_be_returned.s = 'Error: Auth failed.';
            returnJSON(false, json_be_returned);
          }
        });
      });

    });

    ss.on('close', (entityID, callback) => {callback(false)});
  }

  // If the daemon stop, your service recieve close signal here.
  this.close = ()=> {
    nouser.close();
  }
}

// Export your work for system here.
module.exports = Service;
