function start(api) {
  let ss = api.Service.ServiceSocket;
  // send command
  ss.def('sendC', (Json)=>{
    let cmd = Json.c;
    let returnjson = {};
    returnjson.r = "NoShell return. "+cmd;
    return returnjson;
  });


  // welcome msg
  ss.def('welcome', (json, entityID)=>{
    let emeta = api.Service.Entity.returnEntityMetaData(entityID);
    let settings = api.Daemon.Settings;
    let msg = '\n'+emeta.owner+'. Welcome accessing NoShell of Server "'+settings.daemon_name+'"\n';
    msg = msg + settings.description+'\n';
    msg = msg + 'Your entityMetaData(entityID: '+entityID+'): \n';
    msg = msg + JSON.stringify(emeta, null, 2);

    return msg;
  });
}

module.exports = {
  start: start
}
