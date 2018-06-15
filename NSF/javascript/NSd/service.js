// NSF/NSd/services.js
// Description:
// "services.js" provide functions of services stuff.
// Copyright 2018 NOOXY. All Rights Reserved.

let Utils = require('./utilities');

function Service() {
  // need add service event system
  let _local_services = {};
  let _activities = {};
  let _local_services_path = null;
  let _local_services_owner = null;
  let _entity_module = null;
  let _serviceapi_module = null;
  let _authorization_module = null;
  let _ActivityRsCEcallbacks = {};
  let _ASockets = {};


  this.importAuthorization = (authorization_module) => {
    _authorization_module = authorization_module
  };

  this.importOwner = (owner) => {
    _local_services_owner = owner;
  }

  this.importServicesList = (service_list) => {
    for(let i=0; i<service_list.length; i++) {
      let _s = new ServiceObj(service_list[i]);
      _s.setupPath(_local_services_path+service_list[i]);
      _local_services[service_list[i]] = _s;
    }
  };

  this.importEntity = (entity_module) => {
    _entity_module = entity_module;
  };

  this.importAPI = (serviceapi_module) => {
    _serviceapi_module = serviceapi_module;
  };

  this.spwanClient = () => {Utils.tagLog('*ERR*', 'emitRouter not implemented');};

  this.emitRouter = () => {Utils.tagLog('*ERR*', 'emitRouter not implemented');};

  // Serverside
  this.ServiceRqRouter = (connprofile, data, response_emit) => {
    let theservice = null;
    if(data.d.i != null) {
      theservice = _local_services[_entity_module.returnEntityValue(data.d.i, 'service')];
    }
    let methods = {
      // nooxy service protocol implementation of "Call Service: ServiceSocket"
      SS: (connprofile, data, response_emit) => {
        let _data = null;
        if(typeof(theservice) != 'undefined'||theservice!=null) {
          theservice.sendSSData(data.i, data.d);
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
      // nooxy service protocol implementation of "Call Service: String function"
      JF: (connprofile, data, response_emit) => {
        let _data = null;
        if(typeof(theservice) != 'undefined') {
          theservice.sendSSJFCall(data.i, data.n, data.j, (err, returnvalue)=>{
            if(err) {
              _data = {
                m: "JF",
                d: {
                  // status
                  "t": data.t,
                  "i": data.i,
                  "s": "Fail"
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
        // create a description of this service entity.
        let _entity_json = {
          serverid: connprofile.returnServerID(),
          service: data.s,
          type: "Activity",
          spwandomain: connprofile.returnClientIP(),
          owner: data.o,
          ownerdomain: data.od,
          connectiontype:connprofile.returnConnMethod(),
          description: data.d
        };

        _entity_module.registerEntity(_entity_json, connprofile, (err, id) => {
            let _data = {
              "m": "CE",
              "d": {
                // temp id
                "t": data.t,
                "i": id
              }
            };
            response_emit(connprofile, 'CS', 'rs', _data);
        });
      }
    }

    // call the callback.
    methods[data.m](connprofile, data.d, response_emit);
  };

  // ClientSide
  this.ServiceRsRouter =  (connprofile, data) => {

    let methods = {
      // nooxy service protocol implementation of "Call Service: ServiceSocket"
      SS: (connprofile, data) => {

      },
      // nooxy service protocol implementation of "Call Service: JSONfunction"
      JF: (connprofile, data) => {
        if(data.d.s == 'OK') {
          _ASockets[data.d.i].sendJFReturn(false, data.d.t, data.d.r);
        }
        else {

        }
      },
      // nooxy service protocol implementation of "Call Activity: createEntity"
      CE: (connprofile, data) => {
        // create a description of this service entity.
        _ActivityRsCEcallbacks[data.d.t](connprofile, data);
      }
    }

    // call the callback.
    methods[data.m](connprofile, data);
  };

  // ClientSide implement
  this.ActivityRqRouter = (connprofile, data, response_emit) => {

    let methods = {
      // nooxy service protocol implementation of "Call Activity: ActivitySocket"
      AS: () => {
        _ASockets[data.d.i].onData(data.d.d);
        let _data = {
          "m": "AS",
          "d": {
            // status
            "s": "OK"
          }
        };
        response_emit(connprofile, 'CA', 'rs', _data);
      },
    }
    // call the callback.
    methods[data.m](connprofile, data.d, response_emit);
  }

  // ClientSide
  this.ActivityRsRouter = (connprofile, data) => {

    let methods = {
      // nooxy service protocol implementation of "Call Activity: ActivitySocket"
      AS: (connprofile, data) => {
        // no need to implement anything
      }
    }

    methods[data.m](connprofile, data.d);
  };

  function ServiceSocket(Datacallback) {
    let _jsonfunctions = {};
    // JSON Function

    let _send_handler = null;
    let _mode = null;

    this.def = (name, callback) => {
      _jsonfunctions[name] = callback;
    };

    this.sendData = (entityID, data) => {
      Datacallback(entityID, data);
    }

    this.onData = (entityID, data) => {
      Utils.tagLog('*ERR*', 'onData not implemented');
    };

    this.onJFCall = (entityID, JFname, jsons, callback) => {
      console.log(entityID);
      callback(false, _jsonfunctions[JFname](JSON.parse(jsons), entityID));
    };

  };

  function ActivitySocket(conn_profile, entity_id, Datacallback, JFCallback) {

    let _entity_id = entity_id;
    let _conn_profile = conn_profile;
    let _jfqueue = {};

    this.sendJFReturn = (err, tempid, returnvalue) => {
      _jfqueue[tempid](err, JSON.parse(returnvalue));
    };

    // JSONfunction call
    this.call = (name, Json, callback) => {
      let tempid = Utils.generateUniqueID();
      _jfqueue[tempid] = (err, returnvalue) => {
        callback(err, returnvalue);
      };
      JFCallback(_entity_id, name, tempid, Json);
    }

    this.returnEntityID = () => {
      return _entity_id;
    };

    this.sendData = (data) => {
      Datacallback(_entity_id, data);
    };

    this.onData = (data) => {
      Utils.tagLog('*ERR*', 'onData not implemented');
    };
  };

  // object for managing service.
  function ServiceObj(service_name) {
    let _entity_id = null;
    let _service_socket = null;
    let _service_path = null;
    let _service_name = service_name;
    let _service_module = null;
    let _service_manifest = null;

    // on Service Socket Data
    let _onSSData = (entityID, data) => {
      entity_module.getConnProfile(entityID, (connprofile) => {
        let _data = {
          "m": "AS",
          "d": {
            "i": _entity_id,
            "d": data
          }
        }
        this.emitRouter(connprofile, 'AC', _data);
      });
    };


    this.launch = () => {

      // load module from local service directory
      _service_module = require(_service_path+'/entry');
      try{
        _service_manifest = Utils.returnJSONfromFile(_service_path+'/manifest.json');
      }
      catch(err) {
        Utils.tagLog('*ERR*', 'Service "'+_service_name+'" load manifest.json with failure.');
        console.log(err);
      };

      // create a description of this service entity.
      let _entity_json = {
        serverid: "Local",
        service: _service_name,
        type: "Service",
        spwandomain: "Local",
        owner: _local_services_owner,
        ownerdomain: "Local",
        connectiontype: null,
        description: "A Serverside Entity. Service Entity"
      };

      // register this service to entity system
      _entity_module.registerEntity(_entity_json, null, (entity_id)=>{
        _entity_id = entity_id;
      });

      _service_socket = new ServiceSocket(_onSSData); // _onJFCAll = on JSONfunction call

      // create the service for module.
      try {
        if(_service_manifest.implementation_api == false) {
          _serviceapi_module.createServiceAPI(_service_socket, _service_manifest, (err, api) => {
            _service_module.start(api);
          });
        }
        else {
          _serviceapi_module.createServiceAPIwithImplementaion(_service_socket, _service_manifest, (err, api) => {
            _service_module.start(api);
          });
        }

      }
      catch(err) {
        Utils.tagLog('*ERR*', 'Service "'+_service_name+'" ended with failure.');
        console.log(err);
      }
    };

    this.setupPath = (path) => {
      _service_path = path;
    };

    this.sendSSData = (entityID, data) => {
      _service_socket.onData(entityID, data);
    };

    this.sendSSJFCall = (entityID, JFname, jsons, callback) => {
      _service_socket.onJFCall(entityID, JFname, jsons, callback);
    };

    this.returnManifest = () => {
      return _service_manifest;
    }

  };

  // Service module launch
  this.launch = () => {
    for (var key in _local_services) {
      _local_services[key].launch();
    }
  };

  // Service module Path
  this.setupServicesPath = (path) => {
    _local_services_path = path;
  };

  // Service module Owner
  this.setupOwner = (username) => {
    _local_services_owner = username;
  };

  // Service module create activity socket
  this.createActivitySocket = (method, targetip, targetport, service, callback) => {
    let err = false;
    let _data = {
      "m": "CE",
      "d": {
        t: Utils.generateGUID(),
        o: _local_services_owner,
        s: service,
        od: targetip,
      }
    };

    this.spwanClient(method, targetip, targetport, (err, connprofile) => {
      _ActivityRsCEcallbacks[_data.d.t] = (conn_profile, data) => {
        let _as = null;
        if(data.d.i != "FAIL") {
          _as = new ActivitySocket(conn_profile, data.d.i, (i, d) => {
            let _data2 = {
              "m": "SS",
              "d": {
                "i": i,
                "d": d,
              }
            };

            this.emitRouter(conn_profile, 'CS', _data2);
          },
          // JScallback
          (entity_id, name, tempid, Json) =>{
            let _data2 = {
              "m": "JF",
              "d": {
                "i": entity_id,
                "n": name,
                "j": JSON.stringify(Json),
                "t": tempid
              }
            };
            this.emitRouter(connprofile, 'CS', _data2);
          });
          _ASockets[data.d.i] = _as;
          callback(false, _as);
        }
        else{
          callback(true, _as);
        }

      }
      this.emitRouter(connprofile, 'CS', _data);
    });

  };

  this.returnServiceManifest = (service_name)=> {
    return _local_services[service_name].returnManifest();
  }
}

module.exports = Service;
