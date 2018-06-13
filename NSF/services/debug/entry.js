function start(api) {
  //
  api.Utils.tagLog('TEST', 'Listing Servers.');
  api.Connection.getServers((err, servers)=>{
    console.log(servers);
  });


  // console.log(api);
  api.Service.ServiceSocket.onData = (entityID, data)=>{
    api.Utils.tagLog('TEST', 'ServiceSocket onData receive.');
    api.Utils.tagLog('TEST', 'Data:');
    api.Utils.tagLog('TEST', ''+data);
    api.Service.Entity.getEntityMetaData(entityID, (meta) => {
      api.Utils.tagLog('TEST', 'Remote(Activity) meta data.');
      api.Utils.tagLog('TEST', JSON.stringify(meta, null, 2));
    });
  };
  // console.log(api);
  api.Utils.tagLog('TEST', 'Creating ActivitySocket.');
  api.Service.ActivitySocket.createSocket('Local', 'LOCALIP', 'LOCALPORT', 'debug', (err, as) => {
    if(err) {
      api.Utils.tagLog('*ERR*', 'ActivitySocket failed.');
    }
    else {
      api.Utils.tagLog('TEST', 'ActivitySocket Created.');
      as.sendData('data from activity socket1');
      api.Utils.tagLog('TEST', 'ActivitySocket sendData sent.');
    }
  });
  api.Service.ActivitySocket.createSocket('Local', 'LOCALIP', 'LOCALPORT', 'debug', (err, as) => {
    if(err) {
      api.Utils.tagLog('*ERR*', 'ActivitySocket failed.');
    }
    else {
      api.Utils.tagLog('TEST', 'ActivitySocket Created.');
      as.sendData('data from activity socket2');
      api.Utils.tagLog('TEST', 'ActivitySocket sendData sent.');
    }
  });
  api.Service.ActivitySocket.createSocket('WebSocket', '0.0.0.0', '1268', 'debug', (err, as) => {
    if(err) {
      api.Utils.tagLog('*ERR*', 'ActivitySocket failed.');
    }
    else {
      api.Utils.tagLog('TEST', 'ActivitySocket Created.');
      as.sendData('data from activity socket3');
      api.Utils.tagLog('TEST', 'ActivitySocket sendData sent.');
    }
  });
  api.Utils.tagLog('TEST', 'Entities count in daemon. '+api.Service.Entity.returnCount());
  setTimeout(()=> {
    api.Service.Entity.getEntities((err, e)=>{
      api.Utils.tagLog('TEST', 'Entities list.');
      console.log(e);
    });
  }, 1000);


}

module.exports = {
  start: start
}
