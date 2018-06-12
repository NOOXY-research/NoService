// NSF/NSd/router.js
// Description:
// "router.js" provide routing functions.
// Copyright 2018 NOOXY. All Rights Reserved.

function Router() {
  let _coregateway = null;
  // for signup timeout
  let _locked_ip = [];

  // in case of wrong session of the position
  let _sessionnotsupport = function() {
    console.log('[ERR] session not support');
  }

  // a convinient function fo sending data
  let _senddata = (connprofile, method, session, data) => {
    var wrapped = {
      m : method,
      s : session,
      d : data
    };

    // finally sent the data through the connection.
    _coregateway.Connection.sendJSON(connprofile, JSON.stringify(wrapped));
  }

  // implementations of NOOXY Service Protocol methods
  let methods = {
    // nooxy service protocol implementation of "signup"
    SU: {
      emitter : (connprofile, username, password) => {
        _senddata(connprofile, 'SU', 'rq', {username : username, password : password});
      },

      handler : (connprofile, session, data) => {
        let rq_rs_pos = {
          rq: "Client",
          rs: "Server"
        }

        let actions = {
          rq : null,

          rs : (connprofile, data) => {

          }
        }
        connprofile.getRemotePosition((pos)=> {
          if(rq_rs_pos[session] == pos) {
            actions[session](connprofile, data);
          }
          else {
            _sessionnotsupport();
          }
        })
      }
    },

    // nooxy service protocol implementation of "get token"
    GT: {
      emitter : (connprofile, username, password) => {
        _senddata('GT', 'rq', {username : username, password : password});
      },

      handler : (connprofile, session, data) => {
        let rq_rs_pos = {
          rq: "Client",
          rs: "Server"
        }

        let actions = {
          rq : (connprofile, data) => {
              let responsedata = {};
              _coregateway.authorization.getToken(data.username, data.password, (token)=>{
                responsedata['t'] = token;
                _senddata(connprofile, 'GT', 'rs', responsedata);
              });
          },

          rs : (connprofile, data) => {

          }
        }
        connprofile.getRemotePosition((pos)=> {
          if(rq_rs_pos[session] == pos) {
            actions[session](connprofile, data);
          }
          else {
            _sessionnotsupport();
          }
        });
      }
    },

    // nooxy service protocol implementation of "kill token"
    KT: {

    },

    // nooxy service protocol implementation of "Authorization"
    AU: {
      emitter : (connprofile, data) => {
        _senddata(connprofile, 'AU', 'rq', data);
      },

      handler : (connprofile, session, data) => {
        let rq_rs_pos = {
          rq: "Server",
          rs: "Client"
        }

        let actions = {
          rq : _coregateway.AuthorationHandler.RqRouter(connprofile, data, _senddata),
          rs : _coregateway.Authoration.RsRouter(connprofile, data)
        }
        connprofile.getRemotePosition((pos)=> {
          if(rq_rs_pos[session] == pos) {
            actions[session](connprofile, data);
          }
          else {
            _sessionnotsupport();
          }
        })
      }
    },

    // nooxy service protocol implementation of "Call Service"
    CS: {
      emitter : (connprofile, data) => {
        _senddata(connprofile, 'CS', 'rq', data);
      },

      handler : (connprofile, session, data) => {
        let rq_rs_pos = {
          rq: "Client",
          rs: "Server"
        }

        let actions = {
          rq : _coregateway.Service.ServiceRqRouter(connprofile, data, _senddata),
          rs : _coregateway.Service.ServiceRsRouter(connprofile, data)
        }
        connprofile.getRemotePosition((pos)=> {
          if(rq_rs_pos[session] == pos) {
            actions[session](connprofile, data);
          }
          else {
            _sessionnotsupport();
          }
        })
      }
    },

    // nooxy service protocol implementation of "Call Activity"
    CA: {
      emitter : (connprofile, data) => {
        _senddata(connprofile, 'CA', 'rq', data);
      },

      handler : (connprofile, session, data) => {
        let rq_rs_pos = {
          rq: "Server",
          rs: "Client"
        }

        let actions = {
          rq : _coregateway.Service.ActivityRqRouter(connprofile, data, _senddata),
          rs : _coregateway.Service.ActivityRsRouter(connprofile, data)
        }
        connprofile.getRemotePosition((pos)=> {
          if(rq_rs_pos[session] == pos) {
            actions[session](connprofile, data);
          }
          else {
            _sessionnotsupport();
          }
        })
      }
    }
  }

  // emit specified method.
  this.emit = (connprofile, method, data) => {
    methods[method].emitter(connprofile, data);
  };

  // import the accessbility of core resource
  this.importCore = (coregateway) => {
    _coregateway = coregateway;
    _coregateway.Connection.onJSON = (connprofile, json) => {
      console.log();
      methods[json.m].handler(connprofile, json.s, json.d);
    };
    _coregateway.Authenticity.emitRouter = this.emit;
    _coregateway.Service.emitRouter = this.emit;
    _coregateway.Service.spwanClient = _coregateway.Connection.createClient;

  };


}

module.exports = Router
