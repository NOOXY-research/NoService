// NSF/services/youservice/entry.js
// Description:
// "youservice/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.
var fs = require('fs');

let files_path;
let queue_noti = [];

function savenoti(filename) {
  fs.writeFileSync(files_path+filename, JSON.stringify(queue_noti), 'utf8');
}

function loadnoti(filename) {
  try{
    let contents = fs.readFileSync(files_path+filename, 'utf8');
    queue_noti = JSON.parse(contents);
  } catch(e) {
    console.log('Load Noti failed. Skipped')
  }
}

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

  // load history
  loadnoti('notis.json')

  // Safe define a Instant noti.
  ss.sdef('sendInoti', (json, entityID, returnJSON)=>{
    ss.sendData(json.i, [json.n]);
    returnJSON(false, false);
  },
  // In case fail.
  ()=>{
    console.log('Auth Failed.');
  }
  );

  // Safe define a Instant noti.
  ss.sdef('addInoti', (json, entityID, returnJSON)=>{
    ss.broadcastData([json]);
    returnJSON(false, false);
  },
  // In case fail.
  ()=>{
    console.log('Auth Failed.');
  }
  );

  // Safe define a Queue noti.
  ss.sdef('addQnoti', (json, entityID, returnJSON)=>{
    queue_noti.push(json);
    ss.broadcastData([json]);
    returnJSON(false, false);
  },
  // In case fail.
  ()=>{
    console.log('Auth Failed.');
  }
  );

  // Safe define a del Queue noti.
  ss.sdef('delQnoti', (json, entityID, returnJSON)=>{
    queue_noti.splice(json, 1);
    // First parameter for error, next is JSON to be returned.
    returnJSON(false, false);
  },
  // In case fail.
  ()=>{
    console.log('Auth Failed.');
  }
  );

  // ServiceSocket.onConnect, in case on new connection.
  ss.onConnect = (entityID, callback) => {
    let username = api.Service.Entity.returnEntityOwner(entityID);
    let notibesent = [];
    if(username==null) {
      username = 'guest';
      notibesent.push('Welcome! '+username+'. Your entityID ('+entityID+'). <a style="color:#2196f3;" href="https://www.nooxy.tk/static/nsf/login.html?conn_method=WebSocketSecure&remote_ip=www.nooxy.tk&port=1487&redirect=https://www.nooxy.tk">login</a>');
    }
    else {
      notibesent.push('Welcome! '+username+'. Your entityID ('+entityID+').');
    }
    ss.sendData(entityID, notibesent.concat(queue_noti));
    // Do something.
    // report error
    callback(false);
  }
  // ServiceSocket.onClose, in case connection close.
  ss.onClose = (entityID, callback) => {
    callback(false);
  }
}

// If the daemon stop, your service recieve close signal here.
function close() {
  console.log('SimpleNoti closed');
  savenoti('notis.json');
}

// Export your work for system here.
module.exports = {
  start: start,
  close: close
}
