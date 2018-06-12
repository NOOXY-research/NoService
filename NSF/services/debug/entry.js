function start(api) {
  console.log('DEBUG service started');
  // console.log(api);
  api.Service.ServiceSocket.onData((entityID, data)=>{
    console.log(entityID);
    console.log(data);
  });
  // console.log(api);
  api.Service.ActivitySocket.createSocket('Local', 'LOCALIP', 'LOCALPORT', 'debug', (as) => {

    as.send('test');

  });
}

module.exports = {
  start: start
}
