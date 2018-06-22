// NSF/services/NoNoti/entry.js
// Description:
// "NoNoti/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.

let Notification = require('./noti');
// service entry point
function start(api) {
  let ss = api.Service.ServiceSocket;
  let safec = api.SafeCallback;
  let files_path = api.Me.FilesPath;
  let _online_users = {};

  // Access another service on this daemon
  let admin_daemon_asock = api.Servcie.ActivitySocket.createDefaultAdminDeamonSocket('Another Service', (err, activitysocket)=> {
    // accessing other service
  });

  Notification.onNotis = (userid , Notis) => {
    let entitiesID = _online_users[userid];
    for(let i in entitiesID) {
      ss.sendData(entitiesID, {
        n: Notis
      });
    }
  }

  // for server
  ss.def('broadcast', (json, entityID, returnJSON)=>{
    let json_be_returned = {}
    returnJSON(false, json_be_returned);
  });

  // for server
  ss.def('createChannel', (json, entityID, returnJSON)=>{
    Notification.createChannel(json.name, json.description, (err, channelid)=>{
      let json_be_returned = {
        i: channelid
      }
      returnJSON(false, json_be_returned);
    });
  });

  // for server
  ss.def('sendUser', (json, entityID, returnJSON)=>{
    Notification.sendInstantNotitoUser(json.userid, json.notis);
    let json_be_returned = {}
    returnJSON(false, json_be_returned);
  });

  // for server
  ss.def('removeUserQnotis', (json, entityID, returnJSON)=>{
    let type = json.type;

    let json_be_returned = {}
    returnJSON(false, json_be_returned);
  });

  // for server
  ss.def('broadcastChannel', (json, entityID, returnJSON)=>{
    let type = json.type;

    let json_be_returned = {}
    returnJSON(false, json_be_returned);
  });

  ss.onConnect = (entityID) => {
    // Get Username and process your work.
    let username = api.Service.Entity.returnEntityValue('owner');

    api.Authenticity.getUserID(username, (err, id) => {
      let list = _online_users[id];
      if(list != null) {
        list = list.concat([entityID]);
      }
      else {
        list = [entityID];
      }
      _online_users[id] = list;
      Notification.addOnlineUser(id);
    });
  };

  ss.onClose = (entityID) => {
    // Get Username and process your work.
    let username = api.Service.Entity.returnEntityValue('owner');

    api.Authenticity.getUserID(username, (err, id) => {
      let list = _online_users[id];
      if(list.length != 1) {
        let index = list.indexOf(entityID);
        if (index > -1) {
          list.splice(entityID, 1);
        }
      }
      else {
        list = null;
        Notification.deleteOnlineUser(id);
      }
      _online_users[id] = list;
    });
  }

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
