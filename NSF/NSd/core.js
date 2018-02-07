var fs = require('fs');
var WSS = require('ws').Server;
var WebSocket = new WSS({
    port: 8000
});

WebSocket.on('connection', function(ws) {
  
}

function launch() {
  console.log('launching server...')
  if (isinitialized() == false) {
    initialize();
  };
}

function isinitialized() {
  if (fs.existsSync('./eula.txt')) {
    return true;
  }
  else {
    return false;
  }
}

function initialize() {
  console.log('initializing NSd...')
  console.log('creating eula...')
  fs.writeFile('./eula.txt', '', function(err) {
    if(err) {
        return console.log(err);
    }
  });
  console.log('NSd initilalized.');
}

exports.launch = launch;
