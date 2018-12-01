// NoService/NoService/services.js
// Description:
// "services.js" provide functions of services stuff.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

const fs = require('fs');
const Utils = require('./library').Utilities;
const WorkerDaemon = require('./workerd');

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
  let _master_service;
  let _debug_service;
  let _emitRouter = () => {Utils.TagLog('*ERR*', 'emitRouter not implemented');};

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
    for(let i=0; i<service_list.length; i++) {
      let _s = new ServiceObj(service_list[i]);
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

  this.spwanClient = () => {Utils.TagLog('*ERR*', 'spwanClient not implemented');};

  this.setEmitRouter = (emitRouter) => {_emitRouter = emitRouter};

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
          if(theservice)
            theservice.emitSSClose(_entitiesID[nowidx]);
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
            _ASockets[_entitiesID[i]].worker_cancel_refer = true;
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
      // nooxy service protocol implementation of "Call Service: Close ServiceSocket"
      CS: (connprofile, data, response_emit) => {
        theservice.emitSSClose(data.i, true);
      },

      // nooxy service protocol implementation of "Call Service: Vertify Entity"
      VE: (connprofile, data, response_emit) => {
        theservice.emitSSConnection(data.i, (err)=> {
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

          _emitRouter(connprofile, 'CS', _data);
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

  // Serverside implement
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
      // nooxy service protocol implementation of "Call Activity: Close ActivitySocket"
      CS: () => {
        _ASockets[data.d.i].remoteClosed = true;
        _ASockets[data.d.i].close();
      }
    }
    // call the callback.
    methods[data.m](connprofile, data.d, response_emit);
  }

  // ServerSide
  this.ActivityRsRouter = (connprofile, data) => {

    let methods = {
      // nooxy service protocol implementation of "Call Activity: ActivitySocket"
      AS: (connprofile, data) => {
        // no need to implement anything
      }
    }

    methods[data.m](connprofile, data.d);
  };

  function ServiceSocket(service_name, prototype) {
    let _jsonfunctions = prototype==null?{}:prototype;
    let _holding_entities = [];
    // as on data callback
    let _emitasdata = (conn_profile, i, d) => {
      let _data = {
        "m": "AS",
        "d": {
          "i": i,
          "d": d,
        }
      };
      _emitRouter(conn_profile, 'CA', _data);
    }

    let _emitasclose = (conn_profile, i) => {
      let _data = {
        "m": "CS",
        "d": {
          "i": i
        }
      };
      _emitRouter(conn_profile, 'CA', _data);
    }
    // JSON Function

    let _send_handler = null;
    let _mode = null;
    let _on_dict = {
      connect: (entityID, callback) => {
        if(_debug)
          Utils.TagLog('*WARN*', 'onConnect of service "'+service_name+'" not implemented');
        callback(false);
      },

      data: (entityID, data) => {
        if(_debug)
          Utils.TagLog('*WARN*', 'onData of service "'+service_name+'" not implemented');
      },

      close: (entityID, callback) => {
        if(_debug)
          Utils.TagLog('*WARN*', 'onClose of service "'+service_name+'" not implemented');
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
        _emitasdata(connprofile, entityID, data);
      });
    };

    this.broadcastData = (data) => {
      // console.log('f');
      let query = 'service='+service_name+',type=Activity';
      _entity_module.getfliteredEntitiesList(query, (err, entitiesID)=>{
        for(let i in entitiesID) {
          _entity_module.getEntityConnProfile(entitiesID[i], (err, connprofile) => {
            _emitasdata(connprofile, entitiesID[i], data);
          });
        }
      });
    };

    this.closeAll = (callback)=>{
      // console.log('f');
      let query = 'service='+service_name+',type=Activity';
      _entity_module.getfliteredEntitiesList(query, (err, entitiesID)=>{
        for(let i in entitiesID) {
          this.close(entitiesID[i]);
        }
        callback(false);
      });
    }

    this.onJFCall = (entityID, JFname, jsons, callback) => {
      try {
        if(_jsonfunctions[JFname]) {
          _jsonfunctions[JFname].obj(JSON.parse(jsons==null?'{}':jsons), entityID, (err, returnVal)=> {
            callback(err, returnVal);
          });
        }
        else {
          throw new Error('JSONfunction '+JFname+' not exist');
        }
      }
      catch (err) {
        if(_debug) {
          Utils.TagLog('*ERR*', 'An error occured on JSON function call. Jfunc might not be exist.');
          console.log(err);
        }
        callback(err);
      }
    };

    this.close = (entityID, remoteClosed)=> {
      _entity_module.getEntityConnProfile(entityID, (err, connprofile)=>{
        if(remoteClosed)
          _emitasclose(connprofile, entityID);
        this.onClose(entityID, (err)=>{
          _entity_module.deleteEntity(entityID, (err)=> {
            if(err) {
              if(err) {
                Utils.TagLog('*ERR*', 'Error occured at ServiceSocket close.');
                console.log(err);
              }
            }
          });
        });
      });
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

  function ActivitySocket(conn_profile) {
    // Service Socket callback
    let _emitdata = (i, d) => {
      let _data2 = {
        "m": "SS",
        "d": {
          "i": i,
          "d": d,
        }
      };
      _emitRouter(conn_profile, 'CS', _data2);
    }

    // Service Socket callback
    let _emitclose = (i) => {
      let _data2 = {
        "m": "CS",
        "d": {
          "i": i
        }
      };
      _emitRouter(conn_profile, 'CS', _data2);
    }

    let _emitjfunc = (entity_id, name, tempid, Json)=> {
      let _data2 = {
        "m": "JF",
        "d": {
          "i": entity_id,
          "n": name,
          "j": JSON.stringify(Json),
          "t": tempid
        }
      };
      _emitRouter(conn_profile, 'CS', _data2);
    }

    let _entity_id = null;
    let _launched = false;

    let wait_ops = [];
    let wait_launch_ops = [];
    let _jfqueue = {};
    let _on_dict = {
      data: ()=> {
        if(_debug) Utils.TagLog('*WARN*', 'ActivitySocket on "data" not implemented')
      },
      close: ()=> {
        if(_debug) Utils.TagLog('*WARN*', 'ActivitySocket on "close" not implemented')
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
        _emitjfunc(_entity_id, name, tempid, Json);
      };
      exec(op);
    }

    this.getEntityID = (callback) => {
      callback(false, _entity_id);
    };

    this.sendData = (data) => {
      let op = ()=> {
        _emitdata(_entity_id, data);
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

    this.remoteClosed = false;

    this.close = () => {
      let op = ()=> {
        let bundle = conn_profile.returnBundle('bundle_entities');
        for (let i=bundle.length-1; i>=0; i--) {
          if (bundle[i] === _entity_id) {
            if(!this.remoteClosed)
              _emitclose(_entity_id);
            this.onClose();
            setTimeout(()=>{
              // tell worker abort referance
              if(_ASockets[_entity_id])
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
  function ServiceObj(service_name) {
    let _entity_id = null;
    let _service_socket = null;
    let _service_path = null;
    let _service_files_path = null;
    let _service_name = service_name;
    let _worker = null;
    let _service_manifest = null;

    let _isInitialized = false;
    let _isLaunched = false;

    this.isInitialized = (callback)=> {
      callback(false, _isInitialized);
    };

    this.isLaunched = (callback)=> {
      callback(false, _isClosed);
    };

    this.relaunch = (callback)=> {
      this.close((err)=> {
        if(err) {
          callback(err);
        }
        else {
          this.launch(callback);
        }
      });
    }

    this.launch = (callback)=> {
      if(_isLaunched) {
        callback(new Error('Service "'+_service_name+'" already launched.'));
      }
      else {
        _worker.launch((err)=> {
          if(!err) {
            _isLaunched = true;
          }
          callback(err);
        });
      }

    };

    this.init = (callback) => {
      let erreport = null;
      // check node packages dependencies
      try {
        for(let package_name in _service_manifest.dependencies.node_packages) {
          try {
            require.resolve(package_name);
          }
          catch (err) {
            erreport = new Error('Service "'+_service_name+'" require node package "'+package_name+'".');
            callback(erreport);
            return err;
          }
        }
      }
      catch (err) {
        erreport = new Error('Service "'+_service_name+'" have wrong dependencies settings.');
        callback(erreport);
        return err;
      }

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

      _service_socket = new ServiceSocket(_service_name, _service_manifest.JSONfunciton_prototypes); // _onJFCAll = on JSONfunction call

      // create the service for module.
      try {
        if(_service_manifest.name != _service_name) {
          erreport = new Error('Service name in manifest must fit with name "'+_service_name+'". Please check manifest file.\n');
          callback(erreport);
          return err;
        }
        else if(!fs.existsSync(_service_files_path)) {
          fs.mkdirSync(_service_files_path);
          if(_debug) {
            Utils.TagLog('Service', 'Created service files folder at '+_service_files_path);
          }
        }
        if(!fs.existsSync(_service_files_path+'/settings.json')) {
          if(typeof(_service_manifest.settings) != 'undefined') {
            fs.writeFileSync(_service_files_path+'/settings.json', JSON.stringify(_service_manifest.settings, null, 2));
            Utils.TagLog('Service', 'Settings file not exist. Created service settings at "'+_service_files_path+'/settings.json"');
          }
        }
        else {
          try {
            let real_settings = JSON.parse(fs.readFileSync(_service_files_path+'/settings.json', 'utf8'));
            for(let item in real_settings) {
              (_service_manifest.settings)[item] = real_settings[item];
            }
            fs.writeFileSync(_service_files_path+'/settings.json', JSON.stringify(_service_manifest.settings, null, 2));
          }
          catch (err) {
            Utils.TagLog('*ERR*', 'Settings file corrupted. FilesPath "'+_service_files_path+'/settings.json"');
            callback(err);
          }
        }
        if(_service_manifest.implementation_api == false) {
          _serviceapi_module.createServiceAPI(_service_socket, _service_manifest, (err, api) => {
            _worker.importAPI(api);
            _worker.init((err)=> {
              if(!err) {
                _isInitialized = true;
              }
              callback(err);
            });
          });
        }
        else {
          _serviceapi_module.createServiceAPIwithImplementaion(_service_socket, _service_manifest, (err, api) => {
            _worker.importAPI(api);
            _worker.init((err)=> {
              if(!err) {
                _isInitialized = true;
              }
              callback(err);
            });
          });
        }
      }
      catch(err) {
        erreport = new Error('Launching service "'+_service_name+'" ended with failure.');
        callback(erreport);
        return err;
      }
    };

    this.returnJSONfuncList = () => {
      return _service_socket.returnJSONfuncList();
    };

    this.returnJSONfuncDict = () => {
      return _service_socket.returnJSONfuncDict();
    };

    this.setupPath = (path) => {
      _service_path = path;
      try{
        _service_manifest = Utils.returnJSONfromFile(_service_path+'/manifest.json');
      }
      catch(err) {
        throw new Error('Service "'+_service_name+'" load manifest.json with failure.');
      };
    };

    this.setupFilesPath = (path) => {
      _service_files_path = path;
    };

    this.emitSSConnection = (entityID, callback) => {
      _service_socket.onConnect(entityID, callback);
    };

    this.emitSSClose = (entityID, remoteClosed) => {
      _service_socket.close(entityID, remoteClosed);
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

    this.close = (callback) => {
      if(_isLaunched) {
        _isInitialized = false;
        _isLaunched = false;
        _service_socket.closeAll(()=>{
          _worker.close(callback);
        });
      }
      else if (_isInitialized) {
        _isInitialized = false;
        _isLaunched = false;
        _worker.close(callback);
      }
      else {
        _isInitialized = false;
        _isLaunched = false;
        callback(false);
      }
    };
  };

  this.setDebugService = (name)=> {
    _debug_service = name;
  };

  this.setMasterService = (name)=> {
    _master_service = name;
  };

  // Service module launch
  this.launch = (callback) => {
    if(_debug_service) {
      // setup debug service
      _local_services[_debug_service].init((err)=> {
        if(err) {
          Utils.TagLog('*ERR*', 'Error occured while initializing debug service "'+_debug_service+'".');
          Utils.TagLog('*ERR*', err.toString());
        }
        else {
          _local_services[_debug_service].launch((err)=> {
            if(err) {
              Utils.TagLog('*ERR*', 'Error occured while launching debug service "'+_debug_service+'".');
              Utils.TagLog('*ERR*', err.toString());
            }
            else {
              Utils.TagLog('Service', 'Debug Service "'+_debug_service+'" launched.');
              _local_services[_master_service].init((err)=> {
                if(err) {
                  Utils.TagLog('*ERR*', 'Error occured while initializing debug service "'+_debug_service+'".');
                  console.log(err);
                }
                else {
                  _local_services[_master_service].launch((err)=> {
                    if(err) {
                      Utils.TagLog('*ERR*', 'Error occured while launching master service "'+_master_service+'".');
                      console.log(err);
                    }
                    else {
                      Utils.TagLog('Service', 'Master Service "'+_master_service+'" launched.');
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
    // without debug
    else {
      _local_services[_master_service].init((err)=> {
        if(err) {
          Utils.TagLog('*ERR*', 'Error occured while initializing master service "'+_debug_service+'".');
          Utils.TagLog('*ERR*', err.toString());
        }
        else {
          _local_services[_master_service].launch((err)=> {
            if(err) {
              Utils.TagLog('*ERR*', 'Error occured while launching master service "'+_debug_service+'".');
              Utils.TagLog('*ERR*', err.toString());
            }
            else {
              Utils.TagLog('Service', 'Master Service "'+_master_service+'" launched.');
            }
          });
        }
      });
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
      let _as = new ActivitySocket(connprofile);
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
      _emitRouter(connprofile, 'CS', _data);
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
      let _as = new ActivitySocket(connprofile);
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
      _emitRouter(connprofile, 'CS', _data);
    });

  };

  this.returnServiceManifest = (service_name)=> {
    return _local_services[service_name].returnManifest();
  };

  this.returnJSONfuncList = (service_name) => {
    return _local_services[service_name].returnJSONfuncList();
  };

  this.returnJSONfuncDict = (service_name) => {
    return _local_services[service_name].returnJSONfuncDict();
  };

  this.returnJSONfuncDict = (service_name) => {
    return _local_services[service_name].returnJSONfuncDict();
  };

// -------------------------- Service update
  this.getServicesManifest = (callback)=> {
    let results = {};
    for(let service_name in _local_services) {
      results[service_name] = _local_services[service_name].returnManifest();
    }
    callback(false, results);
  };

  this.launchService = (service_name, callback)=> {
    _local_services[service_name].launch(callback);
  };

  this.closeService = (service_name, callback)=> {
    _local_services[service_name].close(callback);
  };

  this.relaunchService = (service_name, callback)=> {
    _local_services[service_name].relaunch(callback);
  };

  this.initializeService = (service_name, callback)=> {
    _local_services[service_name].init(callback);
  };

  this.isServiceLaunched = (service_name, callback)=> {
    _local_services[service_name].isLaunched(callback);
  };

  this.isServiceInitialized = (service_name, callback)=> {
    _local_services[service_name].isInitialized(callback);
  };

  this.isServiceClosed = (service_name, callback)=> {
    _local_services[service_name].isClosed(callback);
  };


// ----------------------------

  // get Callback Obj count
  this.getCBOCount = (callback)=> {
    _workerd.getCBOCount(callback);
  };

  // get Callback Obj count
  this.getWorkerMemoryUsage = (callback)=> {
    _workerd.getMemoryUsage(callback);
  };

  this.returnList = () => {
    return Object.keys(_local_services);
  };

  // service module close
  this.close = () => {

    for(let i in _local_services) {

      try{
        _local_services[i].close(()=> {
          // closed
        });
      }
      catch(e) {
        Utils.TagLog('*ERR*', 'An error occured on closing service "'+i+'"');
        console.log(e);
      }
    }
  };
}

module.exports = Service;
