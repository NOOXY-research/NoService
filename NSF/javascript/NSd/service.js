// NSF/NSd/services.js
// Description:
// "services.js" provide functions of services stuff.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

let fs = require('fs');
let Utils = require('./utilities');
let WorkerDaemon = require('./workerd');

function Service() {
  // need add service event system
  let _local_services = {};
  let _local_services_path = null;
  let _local_services_files_path = null;
  let _local_services_owner = null;
  let _entity_module = null;
  let _serviceapi_module = null;
  let _authorization_module = null;
  let _ActivityRsCEcallbacks = {};
  let _daemon_auth_key = null;
  let _ASockets = {};
  let _debug = false;
  let _workerd;



  let ActivitySocketDestroyTimeout = 1000;

  this.setDebug = (boolean) => {
    _debug = boolean;
  };

  this.importWorkerDaemon = (wd)=> {
    _workerd = wd;
  };

  this.importDaemonAuthKey = (key) => {
    _daemon_auth_key = key;
  };

  this.importAuthorization = (authorization_module) => {
    _authorization_module = authorization_module
  };

  this.importOwner = (owner) => {
    _local_services_owner = owner;
  }

  this.importServicesList = (service_list) => {
    // as callback
    let _ascallback = (conn_profile, i, d) => {
      let _data = {
        "m": "AS",
        "d": {
          "i": i,
          "d": d,
        }
      };
      this.emitRouter(conn_profile, 'CA', _data);
    }
    for(let i=0; i<service_list.length; i++) {
      let _s = new ServiceObj(service_list[i], _ascallback);
      _s.setupPath(_local_services_path+service_list[i]);
      _s.setupFilesPath(_local_services_files_path+service_list[i]);
      _local_services[service_list[i]] = _s;
    }
  };

  this.importEntity = (entity_module) => {
    _entity_module = entity_module;
  };

  this.importAPI = (serviceapi_module) => {
    _serviceapi_module = serviceapi_module;
    _workerd.importAPI(serviceapi_module);
  };

  this.spwanClient = () => {Utils.tagLog('*ERR*', 'spwanClient not implemented');};

  this.emitRouter = () => {Utils.tagLog('*ERR*', 'emitRouter not implemented');};

  this.onConnectionClose = (connprofile, callback) => {

    let _entitiesID = connprofile.returnBundle('bundle_entities');
    if(_entitiesID == null) {
      callback(true);
    }
    else if(_entitiesID.length) {
      let Rpos = connprofile.returnRemotePosition();
      if(connprofile.returnRemotePosition() == 'Client') {
        let i = 0;
        let loop = () => {
          let nowidx = i;
          let theservice = _local_services[_entity_module.returnEntityValue(_entitiesID[nowidx], 'service')];
          theservice.sendSSClose(_entitiesID[nowidx], (err)=>{
            _entity_module.deleteEntity(_entitiesID[nowidx]);
          });
          if(i < _entitiesID.length-1) {
            i++;
            loop();
          }
        };
        loop();
        callback(false);
      }
      else {

        for(let i in _entitiesID) {
          _ASockets[_entitiesID[i]].onClose();
          setTimeout(()=>{
            // for worker abort referance
            _ASockets[_entity_id].worker_cancel_refer = true;
            delete _ASockets[_entitiesID[i]];
          }, ActivitySocketDestroyTimeout);
        }
        callback(false);
      }
    }
    else {
      callback(false);
    }
  };
  // Serverside
  this.ServiceRqRouter = (connprofile, data, response_emit) => {
    let theservice = null;
    if(data.d.i != null) {
      theservice = _local_services[_entity_module.returnEntityValue(data.d.i, 'service')];
    }
    let methods = {
      // nooxy service protocol implementation of "Call Service: Vertify Entity"
      VE: (connprofile, data, response_emit) => {
        theservice.sendSSConnection(data.i, (err)=> {
          let _data = null;
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
      // nooxy service protocol implementation of "Call Service: json function"
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
                  "s": err.toString()
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
        if(_local_services[data.s] != null) {
          // create a description of this service entity.
          let _entity_json = {
            serverid: connprofile.returnServerID(),
            service: data.s,
            mode: data.m,
            daemonauthkey: data.k,
            type: "Activity",
            spwandomain: connprofile.returnClientIP(),
            owner: data.o,
            ownerdomain: data.od,
            connectiontype:connprofile.returnConnMethod(),
            description: data.d
          };

          if(_entity_json.owner == "") {
            _entity_json.owner = null;
          }

          if(_entity_json.mode == null) {
            _entity_json.mode = 'normal';
          }

          if(_entity_json.ownerdomain == null) {
            _entity_json.ownerdomain == connprofile.returnHostIP();
          }

          _entity_module.registerEntity(_entity_json, connprofile, (err, id) => {
              let _data = {
                "m": "CE",
                "d": {
                  // temp id
                  "t": data.t,
                  "i": id
                }
              };
              let entities_prev = connprofile.returnBundle('bundle_entities');
              if(entities_prev != null) {
                connprofile.setBundle('bundle_entities', [id].concat(entities_prev));
              }
              else {
                connprofile.setBundle('bundle_entities', [id]);
              }
              response_emit(connprofile, 'CS', 'rs', _data);
          });
        }
        else {
          if(_debug) {

          }
          let _data = {
            "m": "CE",
            "d": {
              // temp id
              "t": data.t,
              "i": null
            }
          };
          response_emit(connprofile, 'CS', 'rs', _data);
        }
      }
    }

    // call the callback.
    methods[data.m](connprofile, data.d, response_emit);
  };

  // ClientSide
  this.ServiceRsRouter =  (connprofile, data) => {

    let methods = {
      // nooxy service protocol implementation of "Call Service: Vertify Connection"
      VE: (connprofile, data) => {
        if(data.d.s == 'OK') {
          _ASockets[data.d.i].launch();
        }
        else {
          _ASockets[data.d.i].onClose();
        }
      },
      // nooxy service protocol implementation of "Call Service: ServiceSocket"
      SS: (connprofile, data) => {

      },
      // nooxy service protocol implementation of "Call Service: JSONfunction"
      JF: (connprofile, data) => {
        if(data.d.s == 'OK') {
          _ASockets[data.d.i].sendJFReturn(false, data.d.t, data.d.r);
        }
        else {
          _ASockets[data.d.i].sendJFReturn(true, data.d.t, data.d.r);
        }
      },
      // nooxy service protocol implementation of "Call Activity: createEntity"
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

          this.emitRouter(connprofile, 'CS', _data);
        }
        else {
          delete  _ActivityRsCEcallbacks[data.d.t];
          connprofile.closeConnetion();
        }
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
        _ASockets[data.d.i].emitOnData(data.d.d);
        let _data = {
          "m": "AS",
          "d": {
            // status
            "i": data.d.i,
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

  function ServiceSocket(service_name, Datacallback, prototype) {
    let _jsonfunctions = prototype==null?{}:prototype;
    // JSON Function

    let _send_handler = null;
    let _mode = null;
    let _on_dict = {
      connect: (entityID, callback) => {
        if(_debug)
          Utils.tagLog('*WARN*', 'onConnect of service "'+service_name+'" not implemented');
        callback(false);
      },

      data: (entityID, data) => {
        if(_debug)
          Utils.tagLog('*WARN*', 'onData of service "'+service_name+'" not implemented');
      },

      close: (entityID, callback) => {
        if(_debug)
          Utils.tagLog('*WARN*', 'onClose of service "'+service_name+'" not implemented');
        callback(false);
      }
    }

    this.returnJSONfuncList = () => {
      return Object.keys(_jsonfunctions);
    };

    this.returnJSONfuncDict = () => {
      return _jsonfunctions;
    };

    this.def = (name, callback) => {
      _jsonfunctions[name] = _jsonfunctions[name] == null?{}:_jsonfunctions[name];
      _jsonfunctions[name].obj = callback;
    };

    // sercurely define a JSONfunction
    this.sdef = (name, callback, fail) => {
      this.def(name, (json, entityID, returnJSON)=>{
        _authorization_module.Authby.isSuperUserwithToken(entityID, (err, pass)=>{
          if(pass) {
            callback(json, entityID, returnJSON);
          }
          else {
            fail(json, entityID, returnJSON);
          }
        });
      });
    };

    this.sendData = (entityID, data) => {
      _entity_module.getEntityConnProfile(entityID, (err, connprofile)=>{
        Datacallback(connprofile, entityID, data);
      });
    };

    this.broadcastData = (data) => {
      // console.log('f');
      let query = 'service='+service_name+',type=Activity';
      _entity_module.getfliteredEntitiesList(query, (err, entitiesID)=>{
        for(let i in entitiesID) {
          _entity_module.getEntityConnProfile(entitiesID[i], (err, connprofile) => {
            Datacallback(connprofile, entitiesID[i], data);
          });
        }
      });
    };

    this.onJFCall = (entityID, JFname, jsons, callback) => {
      try {
        _jsonfunctions[JFname].obj(JSON.parse(jsons==null?'{}':jsons), entityID, (err, returnVal)=>{
          callback(err, returnVal);
        });
      }
      catch (err) {
        if(_debug) {
          Utils.tagLog('*ERR*', 'An error occured on JSON function call. Jfunc might not be exist.');
          console.log(err);
        }
        callback(err);
      }

    };

    this.on = (type, callback)=> {
      _on_dict[type] = callback;
    }

    this.onConnect = (entityID, callback)=> {
      _on_dict['connect'](entityID, callback);
    }

    this.onData = (entityID, data)=> {
      _on_dict['data'](entityID, data);
    }

    this.onClose = (entityID, callback)=> {
      _on_dict['close'](entityID, callback);
    }

    this.returnServiceName = () => {
      return service_name;
    }

  };

  function ActivitySocket(conn_profile, Datacallback, JFCallback) {
    let _entity_id = null;
    let _launched = false;

    let wait_ops = [];
    let wait_launch_ops = [];

    let _conn_profile = conn_profile;
    let _jfqueue = {};
    let _on_dict = {
      data: ()=> {
        if(_debug) Utils.tagLog('*WARN*', 'ActivitySocket on "data" not implemented')
      },
      close: ()=> {
        if(_debug) Utils.tagLog('*WARN*', 'ActivitySocket on "close" not implemented')
      }
    };

    // For waiting connection is absolutly established. We need to wrap operations and make it queued.
    let exec = (callback) => {
      if(_launched != false) {
        callback();
      }
      else {
        wait_ops.push(callback);
      }
    };

    this.launch = () => {
      _launched = true;
      for(let i in wait_ops) {
        wait_ops[i]();
      }
    };

    this.setEntityID = (id) => {
      _entity_id = id;
      let entities_prev = conn_profile.returnBundle('bundle_entities');
      if(entities_prev != null) {
        conn_profile.setBundle('bundle_entities', [_entity_id].concat(entities_prev));
      }
      else {
        conn_profile.setBundle('bundle_entities', [_entity_id]);
      }
    };

    this.sendJFReturn = (err, tempid, returnvalue) => {
      if(err) {
        _jfqueue[tempid](err);
      }
      else {
        _jfqueue[tempid](err, JSON.parse(returnvalue));
      }
    };

    // JSONfunction call
    this.call = (name, Json, callback) => {
      let op = ()=> {
        let tempid = Utils.generateUniqueID();
        _jfqueue[tempid] = (err, returnvalue) => {
          callback(err, returnvalue);
        };
        JFCallback(conn_profile, _entity_id, name, tempid, Json);
      };
      exec(op);
    }

    this.getEntityID = (callback) => {
      callback(false, _entity_id);
    };

    this.sendData = (data) => {
      let op = ()=> {
        Datacallback(conn_profile, _entity_id, data);
      };
      exec(op);
    };

    this.on = (type, callback)=> {
      _on_dict[type] = callback;
    };

    this.emitOnData = (data) => {
      _on_dict['data'](false, data);
    };

    this.onClose = () => {
      _on_dict['close'](false);
    };

    this.close = () => {
      let op = ()=> {
        let bundle = conn_profile.returnBundle('bundle_entities');
        for (let i=bundle.length-1; i>=0; i--) {
          if (bundle[i] === _entity_id) {
            this.onClose();
            setTimeout(()=>{
              // tell worker abort referance
              _ASockets[_entity_id].worker_cancel_refer = true;
              delete _ASockets[_entity_id];
            }, ActivitySocketDestroyTimeout);
            bundle.splice(i, 1);
          }
        }
        conn_profile.setBundle('bundle_entities', bundle);
        if(bundle.length == 0) {
          conn_profile.closeConnetion();
        }
      }
      exec(op);
    };
  };

  // object for managing service.
  function ServiceObj(service_name, Datacallback) {
    let _entity_id = null;
    let _service_socket = null;
    let _service_path = null;
    let _service_files_path = null;
    let _service_name = service_name;
    let _worker = null;
    let _service_manifest = null;

    this.relaunch = ()=> {
      _worker.relaunch();
    }

    this.launch = (depended_service_dict, callback) => {
      let erreport = null;
      // check node packages dependencies

      try{
        _service_manifest = Utils.returnJSONfromFile(_service_path+'/manifest.json');
      }
      catch(err) {
        erreport = new Error('Service "'+_service_name+'" load manifest.json with failure.');
        console.log(err);
        return erreport;
      };
      // check node packages dependencies
      try {
        for(let package_name in _service_manifest.dependencies.node_packages) {
          try {
            require.resolve(package_name);
          }
          catch (err) {
            erreport = new Error('Service "'+_service_name+'" require node package "'+package_name+'".');
            console.log(err);
          }
        }
      }
      catch (err) {
        erreport = new Error('Service "'+_service_name+'" have wrong dependencies settings.');
        console.log(err);
      }
      depended_service_dict[_service_name] = _service_manifest.dependencies.services;
      _worker = _workerd.returnWorker(_service_path+'/entry');
      // load module from local service directory

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
      _entity_module.registerEntity(_entity_json, null, (entity_id) => {
        _entity_id = entity_id;
      });

      _service_socket = new ServiceSocket(_service_name, Datacallback, _service_manifest.JSONfunciton_prototypes); // _onJFCAll = on JSONfunction call

      // create the service for module.
      try {
        if(_service_manifest.name != _service_name) {
          erreport = new Error('Service name in manifest must fit with name "'+_service_name+'". Please check manifest file.\n');
        }
        else if(!fs.existsSync(_service_files_path)) {
          fs.mkdirSync(_service_files_path);
          if(_debug) {
            Utils.tagLog('Service', 'Created service files folder at '+_service_files_path);
          }
        }
        if(_service_manifest.implementation_api == false) {
          _serviceapi_module.createServiceAPI(_service_socket, _service_manifest, (err, api) => {
            _worker.importAPI(api);
            _worker.launch();
          });
        }
        else {
          _serviceapi_module.createServiceAPIwithImplementaion(_service_socket, _service_manifest, (err, api) => {
            _worker.importAPI(api);
            _worker.launch();
          });
        }

      }
      catch(err) {
        erreport = new Error('Service "'+_service_name+'" ended with failure.');
        console.log(err);
      }
      return erreport;
    };

    this.returnJSONfuncList = () => {
      return _service_socket.returnJSONfuncList();
    };

    this.returnJSONfuncDict = () => {
      return _service_socket.returnJSONfuncDict();
    };

    this.setupPath = (path) => {
      _service_path = path;
    };

    this.setupFilesPath = (path) => {
      _service_files_path = path;
    };

    this.sendSSConnection = (entityID, callback) => {
      _service_socket.onConnect(entityID, callback);
    };

    this.sendSSClose = (entityID, callback) => {
      _service_socket.onClose(entityID, callback);
    };

    this.sendSSData = (entityID, data) => {
      _service_socket.onData(entityID, data);
    };

    this.sendSSJFCall = (entityID, JFname, jsons, callback) => {
      _service_socket.onJFCall(entityID, JFname, jsons, callback);
    };

    this.returnManifest = () => {
      return _service_manifest;
    };

    this.close = () => {
      _worker.close();
    };
  };

  // Service module launch
  this.launch = () => {
    let launched_service = [];
    let depended_service_dict = {};
    for (let key in _local_services) {
      let err = _local_services[key].launch(depended_service_dict);
      if(err) {
        Utils.tagLog('*ERR*', 'Error occured while launching service "'+key+'".');
        Utils.tagLog('*ERR*', err.toString());
      }
      else {
        launched_service.push(key);
      }
    }
    // check dependencies
    for (let service_name in depended_service_dict) {
      for(let depended in depended_service_dict[service_name]) {
        if(!launched_service.includes(depended)) {
          Utils.tagLog('*ERR*', 'Service "'+service_name+'" depend on another service "'+depended+'". But it doesn\'t launched.');
          process.exit();
        }
      }
    }
  };

  // Service module Path
  this.setupServicesPath = (path) => {
    _local_services_path = path;
  };

  // Service files module Path
  this.setupServicesFilesPath = (path) => {
    _local_services_files_path = path;
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
  };

  // Service module Owner
  this.setupOwner = (username) => {
    _local_services_owner = username;
  };

  // Service Socket callback
  let _sscallback = (conn_profile, i, d) => {
    let _data2 = {
      "m": "SS",
      "d": {
        "i": i,
        "d": d,
      }
    };

    this.emitRouter(conn_profile, 'CS', _data2);
  }
  // jf callback

  let _jscallback = (connprofile, entity_id, name, tempid, Json)=> {
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
  }

  // Service module create activity socket
  this.createActivitySocket = (method, targetip, targetport, service, owner, callback) => {
    let err = false;
    let _data = {
      "m": "CE",
      "d": {
        t: Utils.generateGUID(),
        o: owner,
        m: 'normal',
        s: service,
        od: targetip,
      }
    };

    this.spwanClient(method, targetip, targetport, (err, connprofile) => {
      let _as = new ActivitySocket(connprofile, _sscallback ,  _jscallback);
      _ActivityRsCEcallbacks[_data.d.t] = (connprofile, data) => {
        if(data.d.i != "FAIL") {
          _as.setEntityID(data.d.i);
          connprofile.setBundle('entityID', data.d.i);
          _ASockets[data.d.i] = _as;
          callback(false, _ASockets[data.d.i]);
        }
        else{
          callback(true, _ASockets[data.d.i]);
        }

      }
      this.emitRouter(connprofile, 'CS', _data);
    });
  };

  this.createAdminDaemonActivitySocket = (method, targetip, targetport, service, callback) => {
    this.createDaemonActivitySocket(method, targetip, targetport, service, _local_services_owner, callback);
  };

  this.createDaemonActivitySocket = (method, targetip, targetport, service, owner, callback) => {
    let err = false;
    let _data = {
      "m": "CE",
      "d": {
        t: Utils.generateGUID(),
        m: 'daemon',
        k: _daemon_auth_key,
        o: owner,
        s: service,
        od: targetip,
      }
    };


    this.spwanClient(method, targetip, targetport, (err, connprofile) => {
      let _as = new ActivitySocket(connprofile, _sscallback ,  _jscallback);
      _ActivityRsCEcallbacks[_data.d.t] = (connprofile, data) => {

        if(data.d.i != "FAIL") {
          _as.setEntityID(data.d.i);
          connprofile.setBundle('entityID', data.d.i);
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
  };

  this.returnJSONfuncList = (service_name) => {
    return _local_services[service_name].returnJSONfuncList();
  }

  this.returnJSONfuncDict = (service_name) => {
    return _local_services[service_name].returnJSONfuncDict();
  }

  this.relaunch = (service_name)=> {
    _local_services[service_name].relaunch();
  }

  this.returnList = () => {
    return Object.keys(_local_services);
  };

  // service module close
  this.close = () => {
    for(let i in _local_services) {
      try{
        _local_services[i].close();
      }
      catch(e) {
        Utils.tagLog('*ERR*', 'An error occured on closing service "'+i+'"');
        console.log(e);
      }
    }
  };
}

module.exports = Service;
