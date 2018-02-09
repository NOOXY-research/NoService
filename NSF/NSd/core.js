// NSF/NSd/core.js
// Description:
// "core.js" control main behavior of deamon.
// Copyright 2018 NOOXY. All Rights Reserved.


var fs = require('fs');
var crypto = require('crypto');

function

function Client() {
  let _ws = null;
  let _user = null;
}

function User() {
  let _username = null;
  let _password = null; // hashed
  let _email = null;

  this.setusername = function() {

  };

  this.setpassword = function(password) {
    hash = crypto.createHash('sha256').update(password).digest('base64');
    _password = hash;
  };

  this.getusername = function() {
    return _username;
  }
}

objectSearch = function(object, value) {
    for (var prop in object) {
        if (object.hasOwnProperty(prop)) {
             if (object[prop] === value) {
                 return prop;
             }
        }
    }
};

//  TEST
//  test code

user1 = new User().setusername('user1').setpassword('user1');
user2 = new User().setusername('user2').setpassword('user2');
user3 = new User().setusername('user3').setpassword('user3');
users = {user1, user2, user3};

getuser = function(username) {
  for(let user in users) {
    if(user.getusername() == username) {
      return user;
    }
  }
}
//  TEST END

function launch() {
  // initialize
  console.log('launching server...')
  if (isinitialized() == false) {
    initialize();
  };

  // launch
  let WSS = require('ws').Server;
  let wss = new WSS({port: 8000});
  let clients = {};

  wss.on('connection', function(ws) {

      var originDomain = URL.parse(ws.upgradeReq.headers.origin).hostname;

      // if (configuration.origins.indexOf(originDomain) < 0) {
      //     ws.send(JSON.stringify({
      //         method : 'notify',
      //         session : 'req',
      //         data : 'Connection from unknown source refused.'
      //     }));
      //
      //     ws.close();
      //     return;
      // }

      ws.on('message', function(message) {
          var msg = JSON.parse(message);

          if (!('action' in msg)) {
              ws.close();
              return;
          }

          if (msg.action == 'login') {

          }

          if (typeof objectSearch(users, ws) === 'undefined') {
              return;
          }

          if (msg.message.charAt(0) === '/') {

              return;
          }

          WebSocket.broadcast(JSON.stringify({
              sudoer: ws.sudo,
              type: 'message',
              name: ws.name,
              message: msg.message
          }));
      });

      ws.on('error', function(error) {
          console.log('[ERROR] %s', error);
          ws.close();
      });

      ws.on('close', function() {
          var user = objectSearch(users, ws);

          delete clinets[user];
      });

  });


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
