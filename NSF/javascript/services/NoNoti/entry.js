// NSF/services/NoNoti/entry.js
// Description:
// "NoNoti/entry.js" is a NSF Notification service.
// Copyright 2018 NOOXY. All Rights Reserved.

function start(api) {
  api.Sniffer.onRouterJSON((err, Json)=>{
    api.Utils.tagLog('DEGUG', 'Received a Json.');
    api.Utils.tagLog('DEGUG', Json);
  })
}

module.exports = {
  start: start
}
