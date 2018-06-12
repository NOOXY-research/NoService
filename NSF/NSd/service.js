// NSF/NSd/services.js
// Description:
// "services.js" provide functions of services stuff.
// Copyright 2018 NOOXY. All Rights Reserved.

let Utils = require('./utilities');

function Service() {
  let _local_services = {};
  let _activities = {};
  let _local_services_path = null;
  let _local_services_owner = null;
  let _entity_module = null;
  let _serviceapi_module = null;
  let _authoration_module = null;
  let _ActivityRsCEcallbacks = {};
  let _ASockets = {};
  this.spwanClient = () => {console.log('[ERR] emitRouter not implemented');};

  this.emitRouter = () => {console.log('[ERR] emitRouter not implemented');};

  this.ServiceRqRouter = (connprofile, data, response_emit) => {

    let methods = {
      // nooxy service protocol implementation of "Call Service: ServiceSocket"
      SS: (connprofile, data, response_emit) => {
        _local_services[_entity_module.returnEntityValue(data.i, 'service')].sendSSData(data.i, data.d);
        let _data = {
          m: "SS",
          d: {
            // status
            "s": "OK"
          }
        };
        response_emit('CS', 'rs', _data);
      },
      // nooxy service protocol implementation of "Call Service: KillService"
      KS: null
    }

    // call the callback.
    method[data.m](connprofile, data, response_emit);
  };

  this.ActivityRqRouter = (connprofile, data, response_emit) => {

    let methods = {
      // nooxy service protocol implementation of "Call Activity: ActivitySocket"
      AS: () => {
        _ASockets[data.d.i].onData(data.d.d);
        let _data = {
          m: "AS",
          d: {
            // status
            "s": "OK"
          }
        };
        response_emit(connprofile, 'CA', 'rs', _data);
      },

      // nooxy service protocol implementation of "Call Activity: createEntity"
      CE: (connprofile, data, response_emit) => {
        // create a description of this service entity.
        let _entity_json = {
          serverid: connprofile.returnServerID(),
          service: data.d.s,
          type: "Activity",
          spwandomain: connprofile.returnHostIP(),
          owner: data.d.o,
          ownerdomain: connprofile.returnClientIP(),
          description: data.d.d
        };
        _entity_module.registerEntity(_entity_json, connprofile, (id) => {
            let _data = {
              m: "CE",
              d: {
                // temp id
                t: data.d.t,
                i: id
              }
            };
            response_emit(connprofile, 'CA', 'rs', _data);
        });
      }
    }
    // call the callback.
    methods[data.m](connprofile, data, response_emit);
  }

  this.ServiceRsRouter =  (connprofile, data) => {

    let methods = {
      // nooxy service protocol implementation of "Call Service: ServiceSocket"
      SS: (connprofile, data) => {

      },
      // nooxy service protocol implementation of "Call Service: KillService"
      KS: null
    }

    // call the callback.
    methods[data.m](connprofile, data);
  };

  this.ActivityRsRouter = (connprofile, data) => {

    let methods = {
      // nooxy service protocol implementation of "Call Activity: ActivitySocket"
      AS: (connprofile, data) => {
        // no need to implement anything
      },

      // nooxy service protocol implementation of "Call Activity: createEntity"
      CE: (connprofile, data) => {
        // create a description of this service entity.
        _ARsCEcallback[data.d.t](connprofile, data);
      }
    }

    methods[data.m](connprofile, data);
  };

  function ServiceSocket(Datacallback) {
    let _send_handler = null;
    let _mode = null;

    this.sendData = (entityID, data) => {
      Datacallback(entityID, data);
    }

    this.onData = (entityID, data) => {

    };
  };

  function ActivitySocket(conn_profile, entity_id, Datacallback) {
    let _entity_id = entity_id;
    let _conn_profile = conn_profile;

    this.returnEntityID = () => {
      return _entity_id;
    };

    this.sendData = (data) => {
      Datacallback(data);
    };

    this.onData = (data) => {
      console.log('[ERR] onData not implemented');
    };
  };

  // object for managing service.
  function ServiceObj(service_name) {
    let _entity_id = null;
    let _service_socket = null;
    let _service_path = null;
    let _service_name = service_name;
    let _service_module = null;

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

      // create a description of this service entity.
      let _entity_json = {
        serverid: "Local",
        service: _service_name,
        type: "Service",
        spwandomain: "Local",
        owner: _local_services_owner,
        ownerdomain: "Local",
        description: "A Serverside Entity. Service Entity"
      };

      // register this service to entity system
      _entity_module.registerEntity(_entity_json, null, (entity_id)=>{
        _entity_id = entity_id;
      });

      _service_socket = new ServiceSocket(_onSSData);

      // create the service for module.
      _serviceapi_module.createServiceAPI(_service_socket, (api) => {
        _service_module.start(api);
      });
    };

    this.setupPath = (path) => {
      _service_path = path;
    };

    this.sendSSData = (entityID, data) => {
      _service_socket.onData(entityID, data);
    };


  };

  // // object for managing Activity.
  // function ActivityObj(_conn_profile) {
  //   let _entity_id = null;
  //   let _activity_socket = null;
  //   let _conn_profile = null;
  //
  //   this.setupSocket = (ASocket) => {
  //
  //   };
  //
  //   this.sendSSData = (entityID, data) => {
  //     _activity_socket.onData(entityID);
  //   };
  //
  //   this.onSSData = (entityID, data) => {
  //
  //   };
  // };

  this.launch = () => {
    for (var key in _local_services) {
      _local_services[key].launch();
    }
  };

  this.setupServicesPath = (path) => {
    _local_services_path = path;
  };

  this.setupOwner = (username) => {
    _local_services_owner = username;
  };

  this.createActivitySocket = (method, targetip, targetport, service, callback) => {
    let _data = {
      "m": "CE",
      "d": {
        t: Utils.generateGUID(),
        s: service
      }
    };
    this.spwanClient(method, targetip, targetport, (connprofile) => {
      this.emitRouter(connprofile, 'CA', _data);
      _ActivityRsCEcallbacks[_data.d.t] = (conn_profile, data) => {
        let _as = new ActivitySocket(conn_profile, data.d.i, (d) => {
          let _data2 = {
            "m": "SS",
            "d": d
          };
          this.emitRouter(conn_profile, 'SC', _data2);
        });
        _ASockets[data.d.i] = _as;
        callback(_as);
      }
    });

  };

  this.importAuthorization = (authorization_module) => {
    _authoration_module = authorization_module
  };

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
}

module.exports = Service;
