// NSF/NSd/router.js
// Description:
// "router.js" provide routing functions. Highly associated with nooxy service protocol.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

let Utils = require('./utilities');

function Router() {
  let _coregateway = null;
  // nooxy service protocol sercure
  let _json_sniffers = [];
  let _raw_sniffers = [];
  // for signup timeout
  let _locked_ip = [];
  let _debug = false;

  let _tellJSONSniffers = (Json) => {
    for(let i in _json_sniffers) {
      _json_sniffers[i](false, Json);
    }
  };

  let _tellRAWSniffers = (data) => {
    for(let i in _raw_sniffers) {
      _raw_sniffers[i](false, data);
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
    let json = JSON.stringify(wrapped);
    // finally sent the data through the connection.
    if(connprofile.returnBundle('NSPS') == true) {
      _coregateway.NoCrypto.encryptString('AESCBC256', connprofile.returnBundle('aes_256_cbc_key'), json, (err, encrypted)=> {
        _coregateway.Connection.send(connprofile, encrypted);
      });
    }
    else if (connprofile.returnBundle('NSPS') == 'finalize') {
      connprofile.setBundle('NSPS', true);
      _coregateway.Connection.send(connprofile, json);

    }
    else {
      _coregateway.Connection.send(connprofile, json);
    }
  }

  // implementations of NOOXY Service Protocol methods
  let methods = {
    // nooxy service protocol implementation of "sercure protocol"
    SP: {
      emitter : (connprofile, data) => {
        _senddata(connprofile, 'SP', 'rq', data);
      },

      handler : (connprofile, session, data) => {
        let rq_rs_pos = {
          rq: "Server",
          rs: "Client"
        }

        let actions = {
          rq : _coregateway.NSPS.RqRouter,
          rs : _coregateway.NSPS.RsRouter
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

  this.addJSONSniffer = (callback) => {
    _json_sniffers.push(callback);
  };

  this.addRAWSniffer = (callback) => {
    _raw_sniffers.push(callback);
  };

  // emit specified method.
  this.emit = (connprofile, method, data) => {
    methods[method].emitter(connprofile, data);
  };

  // import the accessbility of core resource
  this.importCore = (coregateway) => {
    _coregateway = coregateway;
    _debug = _coregateway.Settings.debug;

    // while recieve a data from connection
    _coregateway.Connection.onData = (connprofile, data) => {
      _tellRAWSniffers(data);
      try {
        if(_coregateway.Settings.secure == true && connprofile.returnConnMethod() != 'Local' && connprofile.returnConnMethod() != 'local') {
          // upgrade protocol
          if(connprofile.returnBundle('NSPS') == 'pending') {
            let json = JSON.parse(data);
            _tellJSONSniffers(json);
            methods[json.m].handler(connprofile, json.s, json.d);
          }
          else if(connprofile.returnBundle('NSPS') != true && connprofile.returnRemotePosition() == 'Client') {
            _coregateway.NSPS.upgradeConnection(connprofile, (err, succeess)=>{
              if(succeess) {
                let json = JSON.parse(data);
                _tellJSONSniffers(json);
                methods[json.m].handler(connprofile, json.s, json.d);
              }
              else {
                connprofile.closeConnetion();
              }
            });
          }
          else if(connprofile.returnBundle('NSPS') != true) {
            let json = JSON.parse(data);
            _tellJSONSniffers(json);
            methods[json.m].handler(connprofile, json.s, json.d);
          }
          else if(connprofile.returnBundle('NSPS') == true) {
            // true

            _coregateway.NoCrypto.decryptString('AESCBC256', connprofile.returnBundle('aes_256_cbc_key'), data, (err, decrypted)=> {
              if(err&&_coregateway.Settings.debug) {
                console.log(err);
              }
              let json = JSON.parse(decrypted);
              _tellJSONSniffers(json);
              methods[json.m].handler(connprofile, json.s, json.d);

            });
          }
        }
        else {
          let json = JSON.parse(data);
          _tellJSONSniffers(json);
          methods[json.m].handler(connprofile, json.s, json.d);
        }
      }
      catch (er) {
        if(_debug) {
          Utils.tagLog('*ERR*', 'An error occured in router module.');
          console.log(er);
        }
      }
    };

    _coregateway.Connection.onClose = (connprofile) => {
      try {
        _coregateway.Service.onConnectionClose(connprofile, (err)=>{
          connprofile.destroy();
        });
      }
      catch (er) {
        if(_debug) {
          Utils.tagLog('*WARN*', 'An error occured in router module.');
          console.log(er);
        }
      }
    };

    _coregateway.Authenticity.emitRouter = this.emit;
    _coregateway.Service.emitRouter = this.emit;
    _coregateway.Implementation.emitRouter = this.emit;
    _coregateway.Implementation.sendRouterData = _senddata;
    _coregateway.Authorization.emitRouter = this.emit;
    _coregateway.NSPS.emitRouter = this.emit;
    _coregateway.Service.spwanClient = _coregateway.Connection.createClient;

  };

  this.close = () => {
    _coregateway = null;
    _json_sniffers = [];
    _raw_sniffers = [];
    _locked_ip = [];
  };

}

module.exports = Router
