// NoService/NoService/router/router.js
// Description:
// "router.js" provide routing functions. Highly associated with nooxy service protocol.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const Utils = require('../library').Utilities;
const ProtocolsPath = require("path").join(__dirname, "protocols");

function Router() {
  let _coregateway;
  // nooxy service protocol secure
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
  let _sessionnotsupport = (protocol, session, data) => {
    if(_debug) {
      Utils.TagLog('*WARN*', 'session not support');
      Utils.TagLog('*WARN*', protocol);
      Utils.TagLog('*WARN*', session);
      Utils.TagLog('*WARN*', data);
    }
  }

  // a convinient function fo sending data
  let _senddata = (connprofile, method, session, data) => {
    let wrapped = {
      m : method,
      s : session,
      d : data
    };
    let json = JSON.stringify(wrapped);
    // finally sent the data through the connection.
    if(connprofile) {
      _coregateway.NSPS.isConnectionSecured(connprofile, (secured)=> {
        if(secured === true) {
          _coregateway.NSPS.secure(connprofile, json, (err, encrypted)=> {
            if(!err) {
              _coregateway.Connection.send(connprofile, encrypted);
            }
            else if(_debug) {
              Utils.TagLog('*WARN*', err.trace);
            }
          });
        }
        else {
          _coregateway.Connection.send(connprofile, json);
        }
      });
    }
  }

  // implementations of NOOXY Service Protocol methods
  let methods = {
    // nooxy service protocol implementation of "secure protocol"
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
          rq : _coregateway.NSPS.RequestHandler,
          rs : _coregateway.NSPS.ResponseHandler
        }
        connprofile.getRemotePosition((err, pos)=> {
          if(rq_rs_pos[session] === pos || rq_rs_pos[session] === 'Both') {
            if(session === 'rq') {
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
        if(_coregateway.Settings.secure === true && connprofile.returnConnMethod() != 'Local' && connprofile.returnConnMethod() != 'local') {
          // upgrade protocol
          if(connprofile.returnBundle('NSPS') === 'pending') {
            let json = JSON.parse(data);
            _tellJSONSniffers(json);
            methods[json.m].handler(connprofile, json.s, json.d);
          }
          else if(connprofile.returnBundle('NSPS') != true && connprofile.returnRemotePosition() === 'Client') {
            _coregateway.NSPS.upgradeConnection(connprofile, (err, succeess)=>{
              if(succeess) {
                let json = JSON.parse(data);
                _tellJSONSniffers(json);
                methods[json.m].handler(connprofile, json.s, json.d);
              }
              else {
                connprofile.closeConnetion();
              }
              if(err) {
                console.log(err);
              }
            });
          }
          else if(connprofile.returnBundle('NSPS') != true) {
            let json = JSON.parse(data);
            _tellJSONSniffers(json);
            methods[json.m].handler(connprofile, json.s, json.d);
          }
          else if(connprofile.returnBundle('NSPS') === true) {
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
          Utils.TagLog('*ERR*', 'An error occured in router module.');
          console.log(er);
        }
      }
    };

    _coregateway.Connection.onClose = (connprofile) => {
      try {
        if(connprofile.returnRemotePosition() === 'Client') {
          _coregateway.Service.emitConnectionClose(connprofile, (err)=>{
            connprofile.destroy();
          });
        }
        else {
          _coregateway.Activity.emitConnectionClose(connprofile, (err)=>{
            connprofile.destroy();
          });
        }

      }
      catch (er) {
        if(_debug) {
          Utils.TagLog('*WARN*', 'An error occured in router module.');
          console.log(er);
        }
      }
    };

    // load protocols
    require("fs").readdirSync(ProtocolsPath).forEach((file)=> {
      let p = new (require(ProtocolsPath+"/" + file))(_coregateway, this.emit);
      p.emitRouter = this.emit;
      methods[p.Protocol] = {
        emitter : (connprofile, data) => {
          _senddata(connprofile, p.Protocol, 'rq', data);
        },

        handler : (connprofile, session, data) => {
          connprofile.getRemotePosition((err, pos)=> {
            if(p.Positions[session] === pos || p.Positions[session] === 'Both') {
              if(session === 'rq') {
                p.RequestHandler(connprofile, data, _senddata);
              }
              else {
                p.ResponseHandler(connprofile, data);
              }
            }
            else {
              _sessionnotsupport(p, session, data);
            }
          });
        }
      };
    });

    _coregateway.Implementation.emitRouter = this.emit;
    _coregateway.NSPS.emitRouter = this.emit;
  };

  this.close = () => {
    _coregateway = null;
    _json_sniffers = [];
    _raw_sniffers = [];
    _locked_ip = [];
  };

}

module.exports = Router
