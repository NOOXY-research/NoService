function start(api) {
  api.Sniffer.onRouterJSON((err, Json)=>{
    api.Utils.tagLog('DEGUG', 'Received a Json.');
    api.Utils.tagLog('DEGUG', Json);
  })
}

module.exports = {
  start: start
}
