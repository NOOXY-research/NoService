// NSF/NSd/router.js
// Description:
// "router.js" provide routing functions.
// Copyright 2018 NOOXY. All Rights Reserved.

function Router() {
  let _coregateway = null;
  let _sniffers = [];
  // for signup timeout
  let _locked_ip = [];

  let _tellSniffers = (Json) => {
    for(let i in _sniffers) {
      _sniffers[i](false, Json);
    }
  };

  // in case of wrong session of the position
  let _sessionnotsupport = () => {
    console.log('[*ERR*] session not support');
    let err = new Error();
    throw err;
  }

  // a convinient function fo sending data
  let _senddata = (connprofile, method, session, data) => {
    var wrapped = {
      m : method,
      s : session,
      d : data
    };
    // finally sent the data through the connection.
    _coregateway.Connection.sendJSON(connprofile, wrapped);
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
        connprofile.getRemotePosition((err, pos)=> {
          if(rq_rs_pos[session] == pos || rq_rs_pos[session] == 'Both') {
            if(session == 'rq') {
              actions[session](connprofile, data, _senddata);
            }
            else {
              actions[session](connprofile, data);
            }
          }
          else {
            _sessionnotsupport();
          }
        });
      }
    },

    // nooxy service protocol implementation of "get token"
    GT: {
      emitter : (connprofile, data) => {
        _senddata(connprofile, 'GT', 'rq', data);
      },

      handler : (connprofile, session, data) => {
        let rq_rs_pos = {
          rq: "Client",
          rs: "Server"
        }

        let actions = {
          rq : (connprofile, data) => {
              let responsedata = {};
              _coregateway.Authenticity.getUserToken(data.u, data.p, (err, token)=>{
                responsedata['t'] = token;
                if(err) {
                  responsedata['s'] = 'Fail';
                }
                else {
                  responsedata['s'] = 'OK';
                }
                _senddata(connprofile, 'GT', 'rs', responsedata);
              });
          },

          rs : (connprofile, data) => {
            _coregateway.Implementation.onToken(connprofile, data.s, data.t);
          }
        }
        connprofile.getRemotePosition((err, pos)=> {
          if(rq_rs_pos[session] == pos || rq_rs_pos[session] == 'Both') {
            if(session == 'rq') {
              actions[session](connprofile, data, _senddata);
            }
            else {
              actions[session](connprofile, data);
            }
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
          rq : _coregateway.AuthorizationHandler.RqRouter,
          rs : _coregateway.Authorization.RsRouter
        }
        connprofile.getRemotePosition((err, pos)=> {
          if(rq_rs_pos[session] == pos || rq_rs_pos[session] == 'Both') {
            if(session == 'rq') {
              actions[session](connprofile, data, _senddata);
            }
            else {
              actions[session](connprofile, data);
            }
          }
          else {
            _sessionnotsupport();
          }
        });
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
          rq : _coregateway.Service.ServiceRqRouter,
          rs : _coregateway.Service.ServiceRsRouter
        }
        connprofile.getRemotePosition((err, pos)=> {
          if(rq_rs_pos[session] == pos || rq_rs_pos[session] == 'Both') {
            if(session == 'rq') {
              actions[session](connprofile, data, _senddata);
            }
            else {
              actions[session](connprofile, data);
            }
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
          rq: "Both",
          rs: "Both"
        }

        let actions = {
          rq : _coregateway.Service.ActivityRqRouter,
          rs : _coregateway.Service.ActivityRsRouter
        }

        connprofile.getRemotePosition((err, pos)=> {
          if(rq_rs_pos[session] == pos || rq_rs_pos[session] == 'Both') {
            if(session == 'rq') {
              actions[session](connprofile, data, _senddata);
            }
            else {
              actions[session](connprofile, data);
            }
          }
          else {
            _sessionnotsupport();
          }
        });
      }
    }
  }

  this.addSniffer = (callback) => {
    _sniffers.push(callback);
  };

  // emit specified method.
  this.emit = (connprofile, method, data) => {
    methods[method].emitter(connprofile, data);
  };

  // import the accessbility of core resource
  this.importCore = (coregateway) => {
    _coregateway = coregateway;
    _coregateway.Connection.onJSON = (connprofile, json) => {
      _tellSniffers(json);
      methods[json.m].handler(connprofile, json.s, json.d);
    };
    _coregateway.Authenticity.emitRouter = this.emit;
    _coregateway.Service.emitRouter = this.emit;
    _coregateway.Implementation.emitRouter = this.emit;
    _coregateway.Authorization.emitRouter = this.emit;
    _coregateway.Service.spwanClient = _coregateway.Connection.createClient;

  };

}

module.exports = Router
