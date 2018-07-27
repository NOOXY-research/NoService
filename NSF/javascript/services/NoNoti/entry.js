// NSF/services/NoNoti/entry.js
// Description:
// "NoNoti/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.

let Notification = require('./noti');
let Notisys = new Notification();

// service entry point
function start(api) {
  let ss = api.Service.ServiceSocket;
  let safec = api.SafeCallback;
  let files_path = api.Me.FilesPath;
  Notisys.importDatabase(files_path+'test.sqlite3');
  let _online_users = {};

  // Access another service on this daemon
  // let admin_daemon_asock = api.Service.ActivitySocket.createDefaultAdminDeamonSocket('Another Service', (err, activitysocket)=> {
  //   // accessing other service
  // });

  Notisys.onNotis = (userid , Notis) => {
    let entitiesID = _online_users[userid];
    for(let i in entitiesID) {
      ss.sendData(entitiesID[i], {
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
    console.log(json);
    console.log(typeof(json));
    Notisys.createChannel(json.name, json.description, (err, channelid)=>{
      let json_be_returned = {
        i: channelid
      }
      returnJSON(err, json_be_returned);
    });
  });

  // for server
  ss.def('sendUser', (json, entityID, returnJSON)=>{
    Notisys.sendInstantNotitoUser(json.userid, json.notis);
    let json_be_returned = {}
    returnJSON(false, json_be_returned);
  });

  // for server
  ss.def('removeUserQnotis', (json, entityID, returnJSON)=>{
    Notisys.sendInstantNotitoUser(json.userid, json.notis);
    let json_be_returned = {}
    returnJSON(false, json_be_returned);
  });

  // for server
  ss.def('broadcastChannel', (json, entityID, returnJSON)=>{
    let type = json.type;

    let json_be_returned = {}
    returnJSON(false, json_be_returned);
  });

  ss.onConnect = (entityID, callback) => {
    // Get Username and process your work.
    let username = api.Service.Entity.returnEntityOwner(entityID);
    api.Authenticity.getUserID(username, (err, id) => {
      let list = _online_users[id];
      if(list != null) {
        list = list.concat([entityID]);
      }
      else {
        list = [entityID];
      }
      _online_users[id] = list;
      Notisys.addOnlineUser(id);
    });
    callback(false);
  };

  ss.onClose = (entityID, callback) => {
    // Get Username and process your work.
    let username = api.Service.Entity.returnEntityOwner(entityID);
    console.log(entityID);
    api.Authenticity.getUserID(username, (err, id) => {

      let list = _online_users[id];
      if(list.length > 1) {
        let index = list.indexOf(entityID);
        if (index > -1) {
          list.splice(entityID, 1);
        }
      }
      else {
        list = null;
        Notisys.deleteOnlineUser(id);
      }
      _online_users[id] = list;
    });
    callback(false);
  }

  // ServiceSocket.onData, in case client send data to this Service.
  // You will need entityID to Authorize remote user. And identify remote.
  ss.onData = (entityID, data) => {
    // Get Username and process your work.
    let username = api.Service.Entity.returnEntityOwner(entityID);
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
