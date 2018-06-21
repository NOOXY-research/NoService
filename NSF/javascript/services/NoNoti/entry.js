// NSF/services/NoNoti/entry.js
// Description:
// "NoNoti/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.
let NotificationDataBase = require('./notidb');
// service entry point
function start(api) {
  let ss = api.Service.ServiceSocket;
  let safec = api.SafeCallback;
  let files_path = api.Me.FilesPath;

  // Access another service on this daemon
  let admin_daemon_asock = api.Servcie.ActivitySocket.createDefaultAdminDeamonSocket('Another Service', (err, activitysocket)=> {
    // accessing other service
  });

  // for client
  ss.def('getNoti', (json, entityID, returnJSON)=>{
    let json_be_returned = {
      d: 'Hello! NOOXY Service Framework!'
    }
    returnJSON(false, json_be_returned);
  });

  // for server
  ss.def('broadcast', (json, entityID, returnJSON)=>{
    let json_be_returned = {
      d: 'Hello! NOOXY Service Framework!'
    }
    returnJSON(false, json_be_returned);
  });

  // for server
  ss.def('createChannel', (json, entityID, returnJSON)=>{
    let type = json.type;

    let json_be_returned = {
      d: 'Hello! NOOXY Service Framework!'
    }
    returnJSON(false, json_be_returned);
  });

  // for server
  ss.def('sendUser', (json, entityID, returnJSON)=>{
    let type = json.type;

    let json_be_returned = {
      d: 'Hello! NOOXY Service Framework!'
    }
    returnJSON(false, json_be_returned);
  });

  // for server
  ss.def('clearUser', (json, entityID, returnJSON)=>{
    let type = json.type;

    let json_be_returned = {
      d: 'Hello! NOOXY Service Framework!'
    }
    returnJSON(false, json_be_returned);
  });

  // for server
  ss.def('broadcastChannel', (json, entityID, returnJSON)=>{
    let type = json.type;

    let json_be_returned = {
      d: 'Hello! NOOXY Service Framework!'
    }
    returnJSON(false, json_be_returned);
  });

  // ServiceSocket.onData, in case client send data to this Service.
  // You will need entityID to Authorize remote user. And identify remote.
  ss.onData = (entityID, data) => {
    // Get Username and process your work.
    let username = api.Service.Entity.returnEntityValue('owner');
    // process you operation here
    console.log('recieve a data');
    console.log(data);
  }
}

// If the daemon stop, your service recieve close signal here.
function close(api) {
  // Saving state of you service.
}

// Export your work for system here.
module.exports = {
  start: start,
  close: close
}
