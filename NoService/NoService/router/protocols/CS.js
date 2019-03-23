// NoService/NoService/router/protocols/CS.js
// Description:
// "CS.js" nooxy service protocol implementation of "call service"
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';


module.exports = function Protocol(coregateway, emitRouter) {
  this.Protocol = "CS";

  this.Positions = {
    rq: "Client",
    rs: "Server"
  };

  let Service = coregateway.Service;

  this.RequestHandler = (connprofile, data, response_emit) => {
    Service.getServiceInstanceByEntityId(data.d.i, (err, theservice)=> {
      let methods = {
        // nooxy service protocol implementation of "Call Service: Close ServiceSocket"
        CS: (connprofile, data, response_emit) => {
          let _entitiesId = connprofile.returnBundle('bundle_entities');
          let index = _entitiesId.indexOf(data.i);
          if (index > -1) {
            _entitiesId.splice(index, 1);
          }
          connprofile.setBundle('bundle_entities', _entitiesId);
          theservice.emitSSClose(data.i, true);
        },

        // nooxy service protocol implementation of "Call Service: Vertify Entity"
        VE: (connprofile, data, response_emit) => {
          theservice.emitSSConnection(data.i, (err)=> {
            let _data;
            if(err) {
              _data = {
                m: "VE",
                d: {
                  i: data.i,
                  "s": "Fail"
                }
              }
            }
            else {
              _data = {
                m: "VE",
                d: {
                  i: data.i,
                  "s": "OK"
                }
              }
            }
            response_emit(connprofile, 'CS', 'rs', _data);
          });

        },
        // nooxy service protocol implementation of "Call Service: ServiceSocket"
        SS: (connprofile, data, response_emit) => {
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
          response_emit(connprofile, 'CS', 'rs', _data);
        },
        // nooxy service protocol implementation of "Call Service: json function"
        JF: (connprofile, data, response_emit) => {
          let _data;
          if(typeof(theservice) != 'undefined') {
            theservice.emitSSJFCall(data.i, data.n, data.j, (err, returnvalue)=>{
              if(err) {
                _data = {
                  m: "JF",
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
                  m: "JF",
                  d: {
                    // status
                    "t": data.t,
                    "i": data.i,
                    "s": "OK",
                    "r": JSON.stringify(returnvalue)
                  }
                };
              }
              response_emit(connprofile, 'CS', 'rs', _data);
            });
          }
          else {
            _data = {
              m: "JF",
              d: {
                // status
                "t": data.t,
                "i": data.i,
                "s": "Fail"
              }
            };
            response_emit(connprofile, 'CS', 'rs', _data);
          }
        },

        // nooxy service protocol implementation of "Call Service: createEntity"
        CE: (connprofile, data, response_emit) => {
          Service.createEntity(connprofile, data.s, data.m, data.k, connprofile.returnClientIP(),
           data.o, data.od, connprofile.returnServerId(), connprofile.returnConnMethod(), data.d, (err, Id)=> {
            response_emit(connprofile, 'CS', 'rs', {
              "m": "CE",
              "d": {
                // temp id
                "t": data.t,
                "i": Id,
                "e": err
              }
            });
          });

        }
      }
      
      if(!err || data.m === 'CE' || data.m === 'VE') {
        // call the callback.
        methods[data.m](connprofile, data.d, response_emit);
      }
    });
  };

  this.ResponseHandler = coregateway.Service.ServiceRsRouter;

}
