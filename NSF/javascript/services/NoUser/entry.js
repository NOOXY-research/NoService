// NSF/services/youservice/entry.js
// Description:
// "youservice/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.
let NoUser = require('./NoUser');
let fs = require('fs');

let files_path;
let nouser = new NoUser();
// Your service entry point
function start(api) {
  // Get the service socket of your service
  let ss = api.Service.ServiceSocket;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not API provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by api.SafeCallback.
  // E.g. setTimeout(api.SafeCallback(callback), timeout)
  let safec = api.SafeCallback;
  // Please save and manipulate your files in this directory
  files_path = api.Me.FilesPath;

  // // Access another service on this daemon
  // let admin_daemon_asock = api.Service.ActivitySocket.createDefaultAdminDeamonSocket('Another Service', (err, activitysocket)=> {
  //   // accessing other service
  // });

  let country_list = api.Me.Settings.country_list;

  if (fs.existsSync(files_path+'NoUser.sqlite3')) {
    nouser.importDatabase(files_path+'NoUser.sqlite3');
  }
  else {
    nouser.createDatabase(files_path+'NoUser.sqlite3');
  }

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
    let username = api.Service.Entity.returnEntityOwner(entityID);
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
  });

  // JSONfunction is a function that can be defined, which others entities can call.
  // It is a NOOXY Service Framework Standard
  ss.def('updateUser', (json, entityID, returnJSON)=>{
    let username = api.Service.Entity.returnEntityOwner(entityID);
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

  // Safe define a JSONfunction.
  ss.sdef('SafeJSONfunction', (json, entityID, returnJSON)=>{
  //   // Code here for JSONfunciton
  //   // Return Value for JSONfunction call. Otherwise remote will not recieve funciton return value.
  //   let json_be_returned = {
  //     d: 'Hello! NOOXY Service Framework!'
  //   }
  //   // First parameter for error, next is JSON to be returned.
  //   returnJSON(false, json_be_returned);
  // },
  // // In case fail.
  // ()=>{
  //   console.log('Auth Failed.');
  });

  // ServiceSocket.onData, in case client send data to this Service.
  // You will need entityID to Authorize remote user. And identify remote.
  ss.onData = (entityID, data) => {
    // // Get Username and process your work.
    // let username = api.Service.Entity.returnEntityOwner(entityID);
    // // To store your data and associated with userid INSEAD OF USERNAME!!!
    // // Since userid can be promised as a unique identifer!!!
    // let userid = null;
    // // Get userid from API
    // api.Authenticity.getUserID(username, (err, id) => {
    //   userid = id;
    // });
    // // process you operation here
    // console.log('recieve a data');
    // console.log(data);
  }
  // ServiceSocket.onConnect, in case on new connection.
  ss.onConnect = (entityID, callback) => {
    // Do something.
    // report error;
    callback(false);
  }
  // ServiceSocket.onClose, in case connection close.
  ss.onClose = (entityID, callback) => {
    // // Get Username and process your work.
    // let username = api.Service.Entity.returnEntityOwner(entityID);
    // // To store your data and associated with userid INSEAD OF USERNAME!!!
    // // Since userid can be promised as a unique identifer!!!
    // let userid = null;
    // // Get userid from API
    // api.Authenticity.getUserID(username, (err, id) => {
    //   userid = id;
    // });
    // // process you operation here
    // console.log('ServiceSocket closed');
    // // report error;
    callback(false);
  }
}

// If the daemon stop, your service recieve close signal here.
function close() {
  nouser.close();
  // Saving state of you service.
  // Please save and manipulate your files in this directory
}

// Export your work for system here.
module.exports = {
  start: start,
  close: close
}
