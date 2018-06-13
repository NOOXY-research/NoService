function start(api) {
  console.log('DEBUG service started');
  // console.log(api);
  api.Service.ServiceSocket.onData = (entityID, data)=>{
    api.Service.Entity.getEntityMetaData(entityID, (meta) => {
      console.log(meta);
    });
    console.log(data);
  };
  // console.log(api);
  api.Service.ActivitySocket.createSocket('Local', 'LOCALIP', 'LOCALPORT', 'debug', (as) => {
    as.sendData('data from activity socket');

  });
}

module.exports = {
  start: start
}
