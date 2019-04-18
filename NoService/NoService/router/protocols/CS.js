// NoService/NoService/router/protocols/CS.js
// Description:
// "CS.js" nooxy service protocol implementation of "call service"
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';
const Buf = require('../../buffer');

module.exports = function Protocol(coregateway, emitRequest, debug) {
  this.Protocol = "CS";

  this.Positions = {
    rq: "Client",
    rs: "Server"
  };

  let Service = coregateway.Service;
  let Activity = coregateway.Activity;
  let Utils = coregateway.Utilities;

  let _ActivityRsCEcallbacks = {};

  Activity.on('createActivitySocketRq', (method, targetport, owner, mode, service, targetip, daemon_authkey, callback)=> {
    let err = false;
    let _data = {
      "m": "CE",
      "d": {
        t: Utils.generateGUID(),
        o: owner,
        m: mode,
        s: service,
        od: targetip,
        k: daemon_authkey
      }
    };
    coregateway.Connection.createClient(method, targetip, targetport, (err, connprofile) => {
      _ActivityRsCEcallbacks[_data.d.t] = (connprofile, data) => {
        callback(false, connprofile, data.d.i);
      }
      emitRequest(connprofile, 'CS', Buf.from(JSON.stringify(_data)));
    });

  });

  Activity.on('EmitSSBlobServiceFunctionRq', (conn_profile, entityId, name, data, meta, tempid) => {
      let _data = {
        "m": "BS",
        "d": {
          "i": entityId,
          "n": name,
          "t": tempid,
          "d": data,
          "m": meta
        }
      };
      emitRequest(conn_profile, 'CS', Buf.from(JSON.stringify(_data)));

  });

  Activity.on('EmitSSDataRq', (conn_profile, entityId, d) => {
      let _data = {
        "m": "SS",
        "d": {
          "i": entityId,
          "d": d,
        }
      };
      emitRequest(conn_profile, 'CS', Buf.from(JSON.stringify(_data)));

  });

  Activity.on('EmitSSServiceFunctionRq', (conn_profile, entityId, name, data, tempid) => {
      let _data = {
        "m": "SF",
        "d": {
          "i": entityId,
          "n": name,
          "t": tempid,
          "d": data
        }
      };
      emitRequest(conn_profile, 'CS', Buf.from(JSON.stringify(_data)));

  });

  Activity.on('EmitASCloseRq', (conn_profile, entityId) => {
      let _data = {
        "m": "CS",
        "d": {
          "i": entityId
        }
      };
      emitRequest(conn_profile, 'CS', Buf.from(JSON.stringify(_data)));
  });

  // Serverside
  this.RequestHandler = (connprofile, blob, emitResponse) => {
    let data = JSON.parse(blob.toString('utf8'));
    Service.getServiceInstanceByEntityId(data.d.i, (err, theservice)=> {
      let methods = {
        // nooxy service protocol implementation of "Call Service: Close ServiceSocket"
        CS: (connprofile, data, emitResponse) => {
          let _entitiesId = connprofile.returnBundle('bundle_entities');
          let index = _entitiesId.indexOf(data.i);
          if (index > -1) {
            _entitiesId.splice(index, 1);
          }
          connprofile.setBundle('bundle_entities', _entitiesId);
          theservice.emitSSClose(data.i, true);
        },

        // nooxy service protocol implementation of "Call Service: Vertify Entity"
        VE: (connprofile, data, emitResponse) => {
          theservice.emitSSConnection(data.i, (err)=> {
            let _data;
            if(err) {
              _data = {
                m: "VE",
                d: {
                  i: data.i,
                  s: "Fail"
                }
              }
            }
            else {
              _data = {
                m: "VE",
                d: {
                  i: data.i,
                  s: "OK"
                }
              }
            }
            emitResponse(connprofile, Buf.from(JSON.stringify(_data)));
          });

        },
        // nooxy service protocol implementation of "Call Service: ServiceSocket"
        SS: (connprofile, data, emitResponse) => {
          let _data;
          if(typeof(theservice) != 'undefined'||theservice!=null) {
            theservice.emitSSData(data.i, data.d);
            _data = {
              m: "SS",
              d: {
                // status
                "i": data.i,
                "s": "OK"
              }
            };
          }
          else {
            _data = {
              m: "SS",
              d: {
                // status
                "i": data.i,
                "s": "Fail"
              }
            };
          }
          emitResponse(connprofile, Buf.from(JSON.stringify(_data)));
        },
        // nooxy service protocol implementation of "Call Service: Call service function Blob(with metadata)"
        BS: (connprofile, data, emitResponse) => {
          let _data;
          if(typeof(theservice) != 'undefined') {
            theservice.emitSSBlobServiceFunctionCall(data.i, data.n, data.d, data.m, (err, returnvalue, meta)=>{
              if(err) {
                _data = {
                  m: "BS",
                  d: {
                    // status
                    "t": data.t,
                    "i": data.i,
                    "s": err.stack
                  }
                };
              }
              else {
                _data = {
                  m: "BS",
                  d: {
                    // status
                    "t": data.t,
                    "i": data.i,
                    "s": "OK",
                    "m": meta,
                    "r": returnvalue
                  }
                };
              }
              emitResponse(connprofile, Buf.from(JSON.stringify(_data)));
            });
          }
          else {
            _data = {
              m: "BS",
              d: {
                // status
                "t": data.t,
                "i": data.i,
                "s": "Fail"
              }
            };
            emitResponse(connprofile, Buf.from(JSON.stringify(_data)));
          }
        },
        // nooxy service protocol implementation of "Call Service: service function"
        SF: (connprofile, data, emitResponse) => {
          let _data;
          if(typeof(theservice) != 'undefined') {
            theservice.emitSSServiceFunctionCall(data.i, data.n, data.d, (err, returnvalue)=>{
              if(err) {
                _data = {
                  m: "SF",
                  d: {
                    // status
                    "t": data.t,
                    "i": data.i,
                    "s": err.stack
                  }
                };
              }
              else {
                _data = {
                  m: "SF",
                  d: {
                    // status
                    "t": data.t,
                    "i": data.i,
                    "s": "OK",
                    "r": returnvalue
                  }
                };
              }
              emitResponse(connprofile, Buf.from(JSON.stringify(_data)));
            });
          }
          else {
            _data = {
              m: "SF",
              d: {
                // status
                "t": data.t,
                "i": data.i,
                "s": "Fail"
              }
            };
            emitResponse(connprofile, Buf.from(JSON.stringify(_data)));
          }
        },

        // nooxy service protocol implementation of "Call Service: createEntity"
        CE: (connprofile, data, emitResponse) => {
          Service.createEntity(connprofile, data.s, data.m, data.k, connprofile.returnClientIP(),
           data.o, data.od, connprofile.returnServerId(), connprofile.returnConnMethod(), data.d, (err, Id)=> {
            emitResponse(connprofile, Buf.from(JSON.stringify({
              "m": "CE",
              "d": {
                // temp id
                "t": data.t,
                "i": Id,
                "e": err
              }
            })));
          });
        }
      }

      if(!err || data.m === 'CE' || data.m === 'VE') {
        // call the callback.
        methods[data.m](connprofile, data.d, emitResponse);
      }
    });
  };

  // client
  this.ResponseHandler = (connprofile, blob) => {
    let data = JSON.parse(blob.toString('utf8'));
    let methods = {
      // nooxy service protocol implementation of "Call Service: Vertify Connection"
      VE: (connprofile, data) => {
        if(data.d.s === 'OK') {
          Activity.launchActivitySocketByEntityId(data.d.i);

        }
        else {
          Activity.emitASClose(data.d.i);

        }
      },
      // nooxy service protocol implementation of "Call Service: ServiceSocket"
      SS: (connprofile, data) => {

      },
      // nooxy service protocol implementation of "Call Service: Blob ServiceFunction"
      BS: (connprofile, data) => {
        if(data.d.s === 'OK') {
          Activity.emitBSFReturn(data.d.i, false, data.d.t, data.d.r, data.d.m);
        }
        else {
          Activity.emitBSFReturn(data.d.i, true, data.d.t, data.d.r, data.d.m);
        }
      },
      // nooxy service protocol implementation of "Call Service: ServiceFunction"
      SF: (connprofile, data) => {
        if(data.d.s === 'OK') {
          Activity.emitSFReturn(data.d.i, false, data.d.t, data.d.r);
        }
        else {
          Activity.emitSFReturn(data.d.i, true, data.d.t, data.d.r);
        }
      },
      // nooxy service protocol implementation of "Call Service: createEntity"
      CE: (connprofile, data) => {
        // tell server finish create
        if(data.d.i != null) {
          // create a description of this service entity.
          _ActivityRsCEcallbacks[data.d.t](connprofile, data);
          let _data = {
            "m": "VE",
            "d": {
              "i": data.d.i,
            }
          };

          emitRequest(connprofile, 'CS', Buf.from(JSON.stringify(_data)));
        }
        else {
          _ActivityRsCEcallbacks[data.d.t](connprofile, data);
          delete  _ActivityRsCEcallbacks[data.d.t];
        }
      }
    }

    // call the callback.
    methods[data.m](connprofile, data);
  };

}
