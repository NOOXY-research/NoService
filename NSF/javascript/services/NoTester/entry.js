function start(api) {
  //
  api.Utils.tagLog('TESTER', 'Listing Servers.');
  api.Connection.getServers((err, servers) => {
    api.Utils.tagLog('TESTER', servers);
  });
  // define a JSONfunction
  api.Service.ServiceSocket.def('test', (Json)=>{
    console.log(Json);
    Json.c = 'c';
    return Json;
  });

  // console.log(api);
  api.Service.ServiceSocket.onData = (entityID, data)=>{
    api.Utils.tagLog('TESTER', 'ServiceSocket onData receive.');
    api.Utils.tagLog('TESTER', 'Data:');
    api.Utils.tagLog('TESTER', ''+data);
    api.Service.Entity.getEntityMetaData(entityID, (err, meta) => {
      api.Utils.tagLog('TESTER', 'Remote(Activity) meta data.');
      api.Utils.tagLog('TESTER', meta);
    });
  };
  // console.log(api);
  api.Utils.tagLog('TESTER', 'Creating ActivitySocket.');
  api.Service.ActivitySocket.createSocket('Local', 'LOCALIP', 'LOCALPORT', 'tester', (err, as) => {
    if(err) {
      api.Utils.tagLog('*ERR*', 'ActivitySocket failed.');
    }
    else {
      api.Utils.tagLog('TESTER', 'ActivitySocket Created.');
      as.sendData('data from activity socket1');
      api.Utils.tagLog('TESTER', 'ActivitySocket sendData sent.');
    }
  });
  api.Service.ActivitySocket.createSocket('Local', 'LOCALIP', 'LOCALPORT', 'tester', (err, as) => {
    if(err) {
      api.Utils.tagLog('*ERR*', 'ActivitySocket failed.');
    }
    else {
      api.Utils.tagLog('TESTER', 'ActivitySocket Created.');
      as.sendData('data from activity socket2');
      api.Utils.tagLog('TESTER', 'ActivitySocket sendData sent.');
    }
  });
  api.Service.ActivitySocket.createSocket('WebSocket', '0.0.0.0', '1268', 'tester', (err, as) => {
    if(err) {
      api.Utils.tagLog('*ERR*', 'ActivitySocket failed.');
    }
    else {
      api.Utils.tagLog('TESTER', 'ActivitySocket Created.');
      as.sendData('data from activity socket3');
      api.Utils.tagLog('TESTER', 'ActivitySocket sendData sent.');
    }
    as.call('test', {a:'a', b:'b'}, (err, returnvalue)=> {
      console.log(returnvalue);
    });
  });
  api.Utils.tagLog('TESTER', 'Entities count in daemon. '+api.Service.Entity.returnCount());
  setTimeout(()=> {
    api.Service.Entity.getEntities((err, e)=>{
      api.Utils.tagLog('TESTER', 'Entities list.');
      api.Utils.tagLog('TESTER', e);
    });
  }, 500);
  api.Utils.tagLog('TESTER', 'Entities count in daemon. '+api.Service.Entity.returnCount());
}

module.exports = {
  start: start
}
