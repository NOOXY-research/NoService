// NoService/NoService/router/router.js
// Description:
// "router.js" provide routing functions. Highly associated with nooxy service protocol.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const Utils = require('../library').Utilities;
const ProtocolsPath = require("path").join(__dirname, "protocols");
const Protocols =  require("fs").readdirSync(ProtocolsPath).map((file)=> {
  return require(ProtocolsPath+"/" + file);});

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
  let _senddata = (connprofile, method, session, blob) => {
    // console.log(blob);

    let blobfinal = Buffer.concat([Buffer.from(method+session, 'utf8'), blob]);
    // finally sent the data through the connection.
    if(connprofile) {
      _coregateway.NSPS.isConnectionSecured(connprofile, (secured)=> {
        if(secured === true) {
          _coregateway.NSPS.encrypt(connprofile, blobfinal, (err, encrypted)=> {
            if(!err) {
              _coregateway.Connection.send(connprofile, encrypted);
            }
            else if(_debug) {
              console.log(err);
              Utils.TagLog('*WARN*', err.stack);
            }
          });
        }
        else {
          _coregateway.Connection.send(connprofile, blobfinal);
        }
      });
    }
  }

  // implementations of NOOXY Service Protocol methods
  let methods = {
    // nooxy service protocol implementation of "secure protocol"
    SP: {
      emitRequest : (connprofile, data) => {
        _senddata(connprofile, 'SP', 'rq', data);
      },

      RequestHandler : (connprofile, session, data) => {
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
              let _emitResponse = (connprofile, data)=> {
                _senddata(connprofile,  'SP', 'rs', data);
              };
              actions[session](connprofile, data, _emitResponse);
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
  this.emitRequest = (connprofile, method, blob) => {
    methods[method].emitRequest(connprofile, blob);
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
          let method = data.slice(0, 2).toString();
          let session = data.slice(2, 4).toString();
          let blob = data.slice(4);

          if(connprofile.returnBundle('NSPS') === 'pending') {
            _tellJSONSniffers({method: method, session: session, data: blob});
            methods[method].RequestHandler(connprofile, session, blob);
          }
          else if(connprofile.returnBundle('NSPS') != true && connprofile.returnRemotePosition() === 'Client') {
            _coregateway.NSPS.upgradeConnection(connprofile, (err, succeess)=>{
              if(succeess) {
                _tellJSONSniffers({method: method, session: session, data: blob});
                methods[method].RequestHandler(connprofile, session, blob);
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
            let method = data.slice(0, 2).toString();
            let session = data.slice(2, 4).toString();
            let blob = data.slice(4);

            _tellJSONSniffers({method: method, session: session, data: blob});
            methods[method].RequestHandler(connprofile, session, blob);
          }
          else if(connprofile.returnBundle('NSPS') === true) {
            // true
            _coregateway.NSPS.decrypt(connprofile, data, (err, decrypted)=> {
              if(err&&_coregateway.Settings.debug) {
                console.log(err);
              }

              let method = decrypted.slice(0, 2).toString();
              let session = decrypted.slice(2, 4).toString();
              let blob = decrypted.slice(4);

              _tellJSONSniffers({method: method, session: session, data: blob});
              methods[method].RequestHandler(connprofile, session, blob);
            });
          }
        }
        else {
          let method = data.slice(0, 2).toString();
          let session = data.slice(2, 4).toString();;
          let blob = data.slice(4);

          _tellJSONSniffers({method: method, session: session, data: blob});
          methods[method].RequestHandler(connprofile, session, blob);
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
    Protocols.forEach((pt)=> {
      let p = new pt(_coregateway, this.emitRequest, _debug);
      methods[p.Protocol] = {
        emitRequest : (connprofile, data) => {
          _senddata(connprofile, p.Protocol, 'rq', data);
        },

        RequestHandler : (connprofile, session, data) => {
          connprofile.getRemotePosition((err, pos)=> {
            if(p.Positions[session] === pos || p.Positions[session] === 'Both') {
              let _emitResponse = (connprofile, data)=> {
                _senddata(connprofile,  p.Protocol, 'rs', data);
              };
              if(session === 'rq') {
                p.RequestHandler(connprofile, data, _emitResponse);
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

    _coregateway.Implementation.getClientConnProfile = _coregateway.Connection.createClient;
    _coregateway.Implementation.emitRequest = (connprofile, method, json)=> {this.emitRequest(connprofile, method, Buffer.from(JSON.stringify(json)))};
    _coregateway.Implementation.sendRouterData = _senddata;
    _coregateway.NSPS.emitRequest = this.emitRequest;
  };

  // for plugins
  this.addProtocol = (pt)=> {
    if(_debug) {
      Utils.TagLog('Router', 'Added a additional protocol.');
    }
    Protocols.push(pt);
  };

  this.close = () => {
    _coregateway = null;
    _json_sniffers = [];
    _raw_sniffers = [];
    _locked_ip = [];
  };

}

module.exports = Router
