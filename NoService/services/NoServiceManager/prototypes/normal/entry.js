// NoService/services/{{ servicename }}/entry.js
// Description:
// "{{ servicename }}/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

function Service(Me, NoService) {
  // Initialize your service here synchronous. Do not use async here!

  // Get the service socket of your service
  let ss = NoService.Service.ServiceSocket;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not NoService provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by NoService.SafeCallback.
  // E.g. setTimeout(NoService.SafeCallback(callback), timeout)
  let safec = NoService.SafeCallback;
  // Your settings in manifest file.
  let settings = Me.Settings;

  // ServiceFunction is a function that can be defined, which others entities can call.
  // It is a NOOXY Service Framework Standard
  ss.def('ServiceFunction', (json, entityID, returnJSON)=> {
    // Code here for JSONfunciton
    // Return Value for ServiceFunction call. Otherwise remote will not recieve funciton return value.
    let json_be_returned = {
      d: 'Hello! NOOXY Service Framework!'
    }
    // First parameter for error, next is JSON to be returned.
    returnJSON(false, json_be_returned);
  });

  // Safe define a ServiceFunction.
  ss.sdef('SafeServiceFunction', (json, entityID, returnJSON)=> {
    // Code here for JSONfunciton
    // Return Value for ServiceFunction call. Otherwise remote will not recieve funciton return value.
    let json_be_returned = {
      d: 'Hello! NOOXY Service Framework!'
    }
    // First parameter for error, next is JSON to be returned.
    returnJSON(false, json_be_returned);
  },
  // In case fail.
  ()=>{
    console.log('Auth Failed.');
  });

  // ServiceSocket.onData, in case client send data to this Service.
  // You will need entityID to Authorize remote user. And identify remote.
  ss.on('data', (entityID, data) => {
    // Get Username and process your work.
    NoService.Service.Entity.getEntityOwner(entityID, (err, username)=> {
      // To store your data and associated with userid INSEAD OF USERNAME!!!
      // Since userid can be promised as a unique identifer!!!
      let userid = null;
      // Get userid from NoService
      NoService.Authenticity.getUserIdByUsername(username, (err, id) => {
        userid = id;
      });
      // process you operation here
      console.log('recieved a data');
      console.log(data);
    });
  });
  // Send data to client.
  ss.sendData('A entity ID', 'My data to be transfer.');
  // ServiceSocket.onConnect, in case on new connection.
  ss.on('connect', (entityID, callback) => {
    // Do something.
    // report error;
    callback(false);
  });
  // ServiceSocket.onClose, in case connection close.
  ss.on('close', (entityID, callback) => {
    // Get Username and process your work.
    NoService.Service.Entity.getEntityOwner(entityID, (err, username)=> {
      // To store your data and associated with userid INSEAD OF USERNAME!!!
      // Since userid can be promised as a unique identifer!!!
      let userid = null;
      // Get userid from NoService
      NoService.Authenticity.getUserIdByUsername(username, (err, id) => {
        userid = id;
      });
      // process you operation here
      console.log('ServiceSocket closed');
      // report error;
      callback(false);
    });
  });

  // Here is where your service start
  this.start = ()=> {
    // Access another service on this daemon
    NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('Another Service', (err, activitysocket)=> {
      // accessing other service
    });
  }

  // If the daemon stop, your service recieve close signal here.
  this.close = ()=> {
    // Close your service here synchronous. Do not use async here!
    // Saving state of you service.
    // Please save and manipulate your files in this directory
  }
}

// Export your work for system here.
module.exports = Service;
