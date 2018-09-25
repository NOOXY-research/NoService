// NSF/NSd/router.js
// Description:
// "router.js" provide routing functions.
// Copyright 2018 NOOXY. All Rights Reserved.

function Router() {
  let _coregateway = null;

  // in case of wrong session of the position
  let _sessionnotsupport = function() {
    console.log('session not support');
  }

  // a convinient function fo sending data
  let _senddata = function(connprofile, method, session, data) {
    var wrapped = {
      m : method,
      s : session,
      d : data,
    };

    // finally sent the data through the connection.
    _coregateway.conn.sendJSON(connprofile, wrapped);
  }

  // implements of NOOXY Service Protocol methods
  let methods = {
    // nooxy service protocol implement of "create Activity Entity"
    CA: {

    },

    // nooxy service protocol implement of "signup"
    SU: {

    },

    // nooxy service protocol implement of "get token"
    GT: {
      emitter : (connprofile, username, password) => {
        _senddata('GT', 'rq', {username : username, password : password});
      },

      handler : (connprofile, session, data, coregateway) => {
        let rq_rs_pos = {
          rq: "Client",
          rs: "Server"
        }

        let actions = {
          rq : function(connprofile, data) {
            let responsedata = {};
              _coregateway.authorization.getToken(data.username, data.password, (token)=>{
                responsedata['t'] = token;
                _senddata(connprofile, 'GT', 'rs', responsedata);
              });
            });
          },

          rs : function(connprofile, data) {

          }
        }
        connprofile.getPosition((pos)=> {
          if(rq_rs_pos[session] == pos) {
            actions[session](connprofile, data);
          }
          else {
            _sessionnotsupport();
          }
        })
      }
    },

    // nooxy service protocol implement of "kill token"
    KT: {

    },

    // nooxy service protocol implement of "Authorization"
    AU: {
      emitter : (connprofile, data) => {
        _senddata('GT', 'rq', data);
      },

      handler : (connprofile, session, data, coregateway) => {
        let rq_rs_pos = {
          rq: "Server",
          rs: "Client"
        }

        let actions = {
          rq : "Client side implement";

          rs : _coregateway.authenticity.onConnect(connprofile, data);
        }
        connprofile.getPosition((pos)=> {
          if(rq_rs_pos[session] == pos) {
            actions[session](connprofile, data);
          }
          else {
            _sessionnotsupport();
          }
        })
      }
    },

    // nooxy service protocol implement of "Service Call"
    SC: {

    },

    // nooxy service protocol implement of "Activity Call"
    AC: {

    }
  }

  // emit specified method.
  this.emit = (connprofile, method, data) => {methods[method].emitter(connprofilem data)};

  // import the accessbility of core resource
  this.setup = function(coregateway) {
    _coregateway = coregateway;
  };

  // start this router
  this.start = function() {
    _coregateway.authenticity.emit = this.emit;
    _coregateway.conn.onJSON = function(json, connprofile) {
      methods[json.method].handler(connprofile, json.session, json.data, coregateway);
    };
  };
}

module.exports = Router
