// NoService/services/youservice/entry.js
// Description:
// "youservice/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

function Service(Me, api) {
  // Your service entry point
  // Get the service socket of your service
  let ss = api.Service.ServiceSocket;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not API provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by api.SafeCallback.
  // E.g. setTimeout(api.SafeCallback(callback), timeout)
  let safec = api.SafeCallback;
  // Please save and manipulate your files in this directory
  let files_path = Me.FilesPath;
  // Your settings in manifest file.
  let settings = Me.Settings;


  let log = (obj)=>{
    console.log('< NOOXY TESTER > ', obj);
  }
  // Your service entry point
  this.start = ()=> {
    log(Me);

    // JSONfunction is a function that can be defined, which others entities can call.
    // It is a NOOXY Service Framework Standard
    log('ServiceSocket Test');
    ss.def('jfunc1', (json, entityID, returnJSON)=>{
      api.Authorization.Authby.Token(entityID, (err, pass)=>{
        log('Auth status: '+pass)
        log(json);
        // Code here for JSONfunciton
        // Return Value for JSONfunction call. Otherwise remote will not recieve funciton return value.
        let json_be_returned = {
          d: 'Hello! Jfunc return from service!'
        }
        // First parameter for error, next is JSON to be returned.
        returnJSON(false, json_be_returned);
      });
    });

    // Access another service on this daemon
    api.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoTester', (err, activitysocket)=> {
      activitysocket.on('data', (err, data)=> {
        log('Received data from service.')
        log(data)
      });
      activitysocket.sendData('A sent data from activity.');
      activitysocket.call('jfunc1', {d:'Hello! Jfunc call from client!'}, (err, json)=> {
        log(json);
        activitysocket.close();
      });
      // accessing other service
    });

    // Safe define a JSONfunction.
    ss.sdef('SafeJSONfunction', (json, entityID, returnJSON)=>{
      // Code here for JSONfunciton
      // Return Value for JSONfunction call. Otherwise remote will not recieve funciton return value.
      let json_be_returned = {
        d: 'Hello! NOOXY Service Framework!'
      }
      // First parameter for error, next is JSON to be returned.
      returnJSON(false, json_be_returned);
    },
    // In case fail.
    ()=>{
      log('Auth Failed.');
    });

    // ServiceSocket.onData, in case client send data to this Service.
    // You will need entityID to Authorize remote user. And identify remote.
    ss.on('data', (entityID, data) => {
      // Get Username and process your work.
      api.Service.Entity.getEntityOwner(entityID, (err, username)=>{
        // To store your data and associated with userid INSEAD OF USERNAME!!!
        // Since userid can be promised as a unique identifer!!!
        let userid = null;
        // Get userid from API
        api.Authenticity.getUserID(username, (err, id) => {
          userid = id;
        });
        // process you operation here
        log('Recieved a data from activity.');
        log(data);
      });
    });
    // ServiceSocket.onConnect, in case on new connection.
    ss.on('connect', (entityID, callback) => {
      log('Activty "'+entityID+'" connected.');
      // Send data to client.
      ss.sendData(entityID, 'A sent data from service.');
      // Do something.
      // report error;
      callback(false);
    });
    // ServiceSocket.onClose, in case connection close.
    ss.on('close', (entityID, callback) => {
      // Get Username and process your work.
      api.Service.Entity.getEntityOwner(entityID, (err, username)=>{
        // To store your data and associated with userid INSEAD OF USERNAME!!!
        // Since userid can be promised as a unique identifer!!!
        let userid = null;
        // Get userid from API
        api.Authenticity.getUserID(username, (err, id) => {
          userid = id;
        });
        // process you operation here
        log('ServiceSocket closed properly.');
        // report error;
        callback(false);
      });
    });

    // Test Object Model
    log('Object Model Test.');
    api.Database.Model.define('ObjectTest', {
      model_type: "Object",
      do_timestamp: true,
      model_key: "key",
      structure: {
        key: 'INTEGER',
        property1: 'TEXT',
        property2: 'INTERGER'
      }
    }, (err, model)=>{
      if(err) {
        log(err)
      }
      else {
        log('Object Model Create.');
        model.create({
          key: 0,
          property1: 'HAHA',
          property2: 0
        }, (err)=> {
          if(err) {
            log(err)
          }
          else {
            log('Object Model Get.');
            model.get(0, (err, instance)=> {
              if(err) {
                log(err)
              }
              else {
                log(instance);
                log('Object Model Get.');
                model.replace({
                  key: 0,
                  property1: 'HAHARPLACE',
                  property2: 0
                }, (err)=> {
                  if(err) {
                    log(err)
                  }
                  else {
                    model.get(0, (err, instance)=> {
                      log(instance);
                      api.Database.Model.remove('ObjectTest', (err)=>{
                        if(err) {
                          log(err);
                        }
                        else {
                          log('Object Model PASS.');
                        }
                      });
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  // If the daemon stop, your service recieve close signal here.
  this.close = ()=> {
    log('Service Closed');
    // Saving state of you service.
    // Please save and manipulate your files in this directory
  }
}

// Export your work for system here.
module.exports = Service;
