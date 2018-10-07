// NSF/services/youservice/entry.js
// Description:
// "youservice/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

let files_path;
let settings;
const fs = require('fs');
// Your service entry point
function start(Me, api) {
  // Get the service socket of your service
  let ss = api.Service.ServiceSocket;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not API provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by api.SafeCallback.
  // E.g. setTimeout(api.SafeCallback(callback), timeout)
  let safec = api.SafeCallback;
  // Please save and manipulate your files in this directory
  files_path = Me.FilesPath;
  // Your settings in manifest file.
  settings = Me.Settings;

  let user_entities = {};
  // Access another service on this daemon
  // let admin_daemon_asock = api.Service.ActivitySocket.createDefaultAdminDeamonSocket('Another Service', (err, activitysocket)=> {
  //   // accessing other service
  // });
  api.Daemon.getSettings((err, daemon_setting)=>{
    if(daemon_setting.debug) {
      api.Sniffer.onRouterJSON((err, Json)=>{
        api.Utils.tagLog('DEGUG', 'Received a Json.');
        api.Utils.tagLog('DEGUG', Json);
      })
    }
  });
  if(settings.protocol_log) {
    api.Sniffer.onRouterJSON((err, Json)=>{
      let date = new Date();
      date = date.toISOString().replace(/T/, ' ').replace(/\..+/, '') ;
      fs.appendFile(files_path+'protocol.log', '['+date+'] '+JSON.stringify(Json, null, 0)+'\n', safec((err)=> {
        if (err) throw err;
      }));
    });
  }

  api.Service.Entity.on('EntityCreated', (entityID, entitymeta)=>{
    // record user
    if(user_entities[entitymeta.owner]==null) {
      user_entities[entitymeta.owner] = {};
      user_entities[entitymeta.owner].c = 1;
    }
    else {
      user_entities[entitymeta.owner].c = user_entities[entitymeta.owner].c+1;
    }

    if(user_entities[entitymeta.owner][entitymeta.service]==null) {
      user_entities[entitymeta.owner][entitymeta.service] = {};
    }

    user_entities[entitymeta.owner][entitymeta.service][entityID] = entitymeta;
    // save logs
    if(settings.entity_log) {
      let date = new Date();
      date = date.toISOString().replace(/T/, ' ').replace(/\..+/, '') ;
      let meta = [];
      if(settings.entity_log_simplify) {
        for(let key in entitymeta) {
          meta.push(entitymeta[key]);
        }
      }
      else {
        meta = entitymeta;
      }
      fs.appendFile(files_path+'entity.log', '['+date+'] '+entityID+' '+JSON.stringify(meta, null, 0)+'\n', safec((err)=> {
        if (err) throw err;
      }));
    };
  });

  api.Service.Entity.on('EntityDeleted', (entityID, entitymeta)=>{
    user_entities[entitymeta.owner].c = user_entities[entitymeta.owner].c-1;
    delete user_entities[entitymeta.owner][entitymeta.service][entityID];
    if(Object.keys(user_entities[entitymeta.owner][entitymeta.service]).length==0) {
      delete user_entities[entitymeta.owner][entitymeta.service];
    }
    if(user_entities[entitymeta.owner].c==0) {
      delete user_entities[entitymeta.owner];
    }
    if(settings.entity_log) {
      let date = new Date();
      date = date.toISOString().replace(/T/, ' ').replace(/\..+/, '') ;
      fs.appendFile(files_path+'entity.log', '['+date+'] '+entityID+' closed\n', safec((err)=> {
        if (err) throw err;
      }));
    }
  });

  // Safe define a JSONfunction.
  ss.sdef('getActivity', (json, entityID, returnJSON)=>{
    // Code here for JSONfunciton
    // Return Value for JSONfunction call. Otherwise remote will not recieve funciton return value.
    let json_be_returned = {
      c: user_entities[json.u].c,
      d: user_entities[json.u]
    }
    // First parameter for error, next is JSON to be returned.
    returnJSON(false, json_be_returned);
  },
  // In case fail.
  ()=>{
    console.log('Auth Failed.');
  });

  // Safe define a JSONfunction.
  ss.sdef('getOnline', (json, entityID, returnJSON)=>{
    // Code here for JSONfunciton
    // Return Value for JSONfunction call. Otherwise remote will not recieve funciton return value.
    let json_be_returned = {
      d: Object.keys(user_entities)
    }
    // First parameter for error, next is JSON to be returned.
    returnJSON(false, json_be_returned);
  },
  // In case fail.
  ()=>{
    console.log('Auth Failed.');
  });

  // JSONfunction is a function that can be defined, which others entities can call.
  // It is a NOOXY Service Framework Standard
  ss.def('JSONfunction', (json, entityID, returnJSON)=>{
    // Code here for JSONfunciton
    // Return Value for JSONfunction call. Otherwise remote will not recieve funciton return value.
    let json_be_returned = {
      d: 'Hello! NOOXY Service Framework!'
    }
    // First parameter for error, next is JSON to be returned.
    returnJSON(false, json_be_returned);
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
    console.log('Auth Failed.');
  });

  // ServiceSocket.onData, in case client send data to this Service.
  // You will need entityID to Authorize remote user. And identify remote.
  ss.onData = (entityID, data) => {
    // Get Username and process your work.
    let username = api.Service.Entity.returnEntityOwner(entityID);
    // To store your data and associated with userid INSEAD OF USERNAME!!!
    // Since userid can be promised as a unique identifer!!!
    let userid = null;
    // Get userid from API
    api.Authenticity.getUserID(username, (err, id) => {
      userid = id;
    });
    // process you operation here
    console.log('recieve a data');
    console.log(data);
  }
  // Send data to client.
  // ss.sendData('A entity ID', 'My data to be transfer.');
  // ServiceSocket.onConnect, in case on new connection.
  ss.onConnect = (entityID, callback) => {
    // Do something.
    // report error;
    callback(false);
  }
  // ServiceSocket.onClose, in case connection close.
  ss.onClose = (entityID, callback) => {
    // Get Username and process your work.
    let username = api.Service.Entity.returnEntityOwner(entityID);
    // To store your data and associated with userid INSEAD OF USERNAME!!!
    // Since userid can be promised as a unique identifer!!!
    let userid = null;
    // Get userid from API
    api.Authenticity.getUserID(username, (err, id) => {
      userid = id;
    });
    // process you operation here
    // report error;
    callback(false);
  }
}

// If the daemon stop, your service recieve close signal here.
function close() {
  // Saving state of you service.
  // Please save and manipulate your files in this directory
}

// Export your work for system here.
module.exports = {
  start: start,
  close: close
}
