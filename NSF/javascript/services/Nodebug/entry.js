// NSF/services/NoDebug/entry.js
// Description:
// "NoDebug/entry.js" is a NSF Debuger.
// Copyright 2018 NOOXY. All Rights Reserved.

function start(api) {
  api.Sniffer.onRouterJSON((err, Json)=>{
    api.Utils.tagLog('DEGUG', 'Received a Json.');
    api.Utils.tagLog('DEGUG', Json);
  })
  // api.Sniffer.onRouterRawData((err, data)=>{
  //   api.Utils.tagLog('DEGUG', 'Received a raw data.');
  //   api.Utils.tagLog('DEGUG', data);
  // })
}

module.exports = {
  start: start
}
