// NSF/NSd/services.js
// Description:
// "services.js" provide functions of services stuff.
// Copyright 2018 NOOXY. All Rights Reserved.


function Service(entity_module, serviceapi) {
  let _services = {};
  let _services_path = null;
  let _services_owner = null;

  this.emitRouter = () => {console.log('[ERR] emitRouter not implemented');};

  this.ServiceRqRouter = (connprofile, data, data_sender) => {

    let methods = {
      // nooxy service protocol implementation of "Call Service: ServiceSocket"
      SS: (connprofile, data, data_sender) => {
        _services[data.d.n].SSCall(connprofile, data.d.d);
      },
      // nooxy service protocol implementation of "Call Service: KillService"
      KS: null
    }

    // call the callback.
    method[data.m](connprofile, data, data_sender);
  };

  this.ActivityRqRouter = (connprofile, data, data_sender) => {

    let methods = {
      // nooxy service protocol implementation of "Call Activity: ActivitySocket"
      AS: () => {

      },

      // nooxy service protocol implementation of "Call Activity: createEntity"
      CE: (connprofile, data, data_sender) => {
        
      }
    }

    method[data.m]();
  };

  function ServiceSocket(Datacallback) {
    let _send_handler = null;
    let _mode = null;

    this.sendData = (entityID, data) => {
      Datacallback(entityID, data);
    }

    this.onData = () => {

    };
  };

  function ActivitySocket(Datacallback) {
    let _send_handler = null;
    let _mode = null;

    this.sendData = () => {

    };

    this.onData = () => {

    };
  };

  // object for managing service.
  function ServiceObj() {
    let _entity_id = null;
    let _service_socket = null;
    let _service_path = null;
    let _service_name = _service_name;
    let _service_module = null;

    let _onSSData = (entityID, data) => {
      entity_module.getConnProfile(entityID, (connprofile) => {
        let _data = {
          "m": "AS",
          "i": _entity_id,
          "d": data
        }
        this.emitRouter(connprofile, 'AC', _data);
      });
    };

    this.launch = () => {
      // load module from local service directory
      _service_module = require(_services_path+_service_path);

      // create a description of this service entity.
      let _entity_json = {
        serverid: "Local",
        service: _service_name,
        type: "Service",
        spwandomain: "Local",
        owner: _services_owner,
        ownerdomain: "Local",
        description: "A Serverside Entity. Service Entity"
      };

      // register this service to entity system
      entity_module.registerEntity(entityJson, null, (entity_id)=>{
        _entity_id = entityID;
      });

      _service_socket = new ServiceSocket(_onSSData);

      // create the service for module.
      serviceapi.createServiceAPI(_service_socket, (api) => {
        _service_module.start(api);
      });
    };

    this.setupSocket = (SSocket) => {
      _service_socket = SSocket;
    };

    this.setupPath = (path) => {
      _service_path = path;
    };

    this.sendSSData = (entityID, data) => {
      _service_socket.onData(entityID);
    };


  };

  // object for managing Activity.
  function ActivityObj() {
    let _entity_id = null;
    let _activity_socket = null;
    let _service_path = null;
    let _service_module = null;

    this.launch = () => {

    };

    this.setupSocket = (ASocket) => {

    };

    this.sendSSData = (entityID, data) => {
      _activity_socket.onData(entityID);
    };

    this.onSSData = (entityID, data) => {

    };
  };

  this.launch() = () => {

  };

  this.setupServicesPath = (path) => {
    _services_path = path;
  };

  this.setupOwner = (username) => {
    _services_owner = username;
  };

  this.createActivitySocket = (method, targetip, targetport) => {

  };
}

module.exports = Service;
