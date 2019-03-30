// NoService/NoService/service/serviceservices.js
// Description:
// "services.js" provide functions of services stuff.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const fs = require('fs');
const Utils = require('../../library').Utilities;
const SocketPair = require('../socketpair');

function Service() {
  // need add service event system
  let _local_services = {};
  let _local_services_path;
  let _local_services_files_path;
  let _local_service_owner;
  let _entity_module;
  let _serviceapi_module;
  let _authorization_module;
  let _authenticity_module;

  let _debug = false;
  let _worker_module;
  let _master_service;
  let _debug_service;
  let _on_handler = {};

  let _emmiter;

  // object for managing service.
  function ServiceObj(service_name) {
    let _entity_id;
    let _service_socket;
    let _service_path;
    let _service_files_path;
    let _service_name = service_name;
    let _worker;
    let _service_manifest;

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
          this.init((err)=> {
            if(err) {
              callback(err);
            }
            else {
              this.launch(callback);
            }
          });
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
      let erreport;
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

      _worker = _worker_module.generateWorker(_service_manifest, _service_path+'/entry', _service_manifest.language);
      // load module from local service directory
      _authenticity_module.getUserIdByUsername(_local_service_owner, (err, ownerid)=> {
        // create a description of this service entity.
        let _entity_json = {
          serverid: "Local",
          service: _service_name,
          type: "Service",
          spawndomain: "Local",
          owner: _local_service_owner,
          ownerid: ownerid,
          ownerdomain: "Local",
          connectiontype: null,
          description: "A Serverside Entity. Service Entity"
        };

        // register this service to entity system
        _entity_module.registerEntity(_entity_json, null, (entity_id) => {
          _entity_id = entity_id;
        });

        _emmiter = {
          Data: _on_handler['EmitASDataRq'],
          Event: _on_handler['EmitASEventRq'],
          Close: _on_handler['EmitASCloseRq'],
        }

        _service_socket = new SocketPair.ServiceSocket(_service_name, _service_manifest.servicefunctions, _emmiter, _debug, _entity_module, _authorization_module); // _onServiceFunctionCAll = on ServiceFunction call

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

          _worker.createServiceAPI(_service_socket, (err) => {
            _worker.init((err)=> {
              if(!err) {
                _isInitialized = true;
              }
              callback(err);
            });
          });
        }
        catch(err) {
          erreport = new Error('Launching service "'+_service_name+'" ended with failure.\n'+err.stack);
          callback(erreport);
          return err;
        }
      });
    };

    this.returnServiceFunctionList = () => {
      return _service_socket.returnServiceFunctionList();
    };

    this.returnServiceFunctionDict = () => {
      return _service_socket.returnServiceFunctionDict();
    };

    this.setupPath = (path) => {
      _service_path = path;
      try{
        _service_manifest = require(_service_path+'/manifest.json');
      }
      catch(err) {
        throw new Error('Service "'+_service_name+'" load manifest.json with failure.');
      };
    };

    this.setupFilesPath = (path) => {
      _service_files_path = path;
    };

    this.emitSSConnection = (entityId, callback) => {
      _service_socket._emitConnect(entityId, callback);
    };

    this.emitSSClose = (entityId, remoteClosed) => {
      _service_socket._closeSocket(entityId, remoteClosed);
    };

    this.emitSSData = (entityId, data) => {
      _service_socket._emitData(entityId, data);
    };

    this.emitSSServiceFunctionCall = (entityId, SFname, jsons, callback) => {
      _service_socket._emitFunctionCall(entityId, SFname, jsons, callback);
    };

    this.returnManifest = () => {
      _service_manifest = require(_service_path+'/manifest.json');
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

  this.setDebug = (boolean) => {
    _debug = boolean;
  };

  this.importWorkerModule = (wd)=> {
    _worker_module = wd;
  };



  this.importAuthorization = (mod) => {
    _authorization_module = mod;
  };

  this.importAuthenticity = (mod) => {
    _authenticity_module = mod;
  };

  this.importOwner = (owner) => {
    _local_service_owner = owner;
  }

  this.importServicesList = (service_list) => {
    for(let i=0; i<service_list.length; i++) {
      let _s = new ServiceObj(service_list[i]);
      _s.setupPath(_local_services_path+'/'+service_list[i]);
      _s.setupFilesPath(_local_services_files_path+'/'+service_list[i]);
      _local_services[service_list[i]] = _s;
    }
  };

  this.importEntity = (entity_module) => {
    _entity_module = entity_module;
  };

  this.importAPI = (serviceapi_module) => {
    _serviceapi_module = serviceapi_module;
    _worker_module.importAPI(serviceapi_module);
  };

  this.emitConnectionClose = (connprofile, callback) => {
    let _entitiesId = connprofile.returnBundle('bundle_entities');
    if(!_entitiesId) {
      callback(true);
    }
    else if(_entitiesId.length) {
      for(let i in _entitiesId) {
        let theservice = _local_services[_entity_module.returnEntityValue(_entitiesId[i], 'service')];
        if(theservice)
          theservice.emitSSClose(_entitiesId[i], true);
      }

      callback(false);
    }
    else {
      callback(false);
    }
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
          Utils.TagLog('*ERR*', err.stack);
          callback(new Error('Error occured while initializing debug service "'+_debug_service+'".'));
        }
        else {
          _local_services[_debug_service].launch((err)=> {
            if(err) {
              Utils.TagLog('*ERR*', 'Error occured while launching debug service "'+_debug_service+'".');
              Utils.TagLog('*ERR*', err.stack);
              callback(new Error('Error occured while launching debug service "'+_debug_service+'".'));

            }
            else {
              Utils.TagLog('Service', 'Debug Service "'+_debug_service+'" launched.');
              _local_services[_master_service].init((err)=> {
                if(err) {
                  Utils.TagLog('*ERR*', 'Error occured while initializing master service "'+_master_service+'".');
                  console.log(err);
                  callback(new Error('Error occured while initializing master service "'+_master_service+'".'));

                }
                else {
                  _local_services[_master_service].launch((err)=> {
                    if(err) {
                      Utils.TagLog('*ERR*', 'Error occured while launching master service "'+_master_service+'".');
                      console.log(err);
                      callback(new Error('Error occured while launching master service "'+_master_service+'".'));

                    }
                    else {
                      Utils.TagLog('Service', 'Master Service "'+_master_service+'" launched.');
                      callback(false);
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
          Utils.TagLog('*ERR*', 'Error occured while initializing master service "'+_master_service+'".');
          Utils.TagLog('*ERR*', err.stack);
          callback(new Error('Error occured while initializing master service "'+_master_service+'".'));
        }
        else {
          _local_services[_master_service].launch((err)=> {
            if(err) {
              Utils.TagLog('*ERR*', 'Error occured while launching master service "'+_master_service+'".');
              Utils.TagLog('*ERR*', err.stack);
              callback(new Error('Error occured while launching master service "'+_master_service+'".'));

            }
            else {
              Utils.TagLog('Service', 'Master Service "'+_master_service+'" launched.');
              callback(false);
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
    _local_service_owner = username;
  };

  this.returnServiceManifest = (service_name)=> {
    return _local_services[service_name].returnManifest();
  };

  this.returnServiceFunctionList = (service_name) => {
    if(_local_services[service_name])
      return _local_services[service_name].returnServiceFunctionList();
    return null;
  };

  this.returnServiceFunctionDict = (service_name) => {
    if(_local_services[service_name])
      return _local_services[service_name].returnServiceFunctionDict();
    return null;
  };

  this.returnServiceFunctionDict = (service_name) => {
    if(_local_services[service_name])
      return _local_services[service_name].returnServiceFunctionDict();
    return null;
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

  this.getServiceInstanceByEntityId = (entityId, callback)=> {
    let i = _local_services[_entity_module.returnEntityValue(entityId, 'service')];
    callback((!i)?(new Error('Service not exist.')):false, i);
  };

  this.createEntity = (connprofile, service_name, mode, daemon_authkey, spawn_domain, owner,
    owner_domain, serverid, connection_type, description, callback) => {
    if(_local_services[service_name] != null) {
      // create a description of this service entity.
      let _entity_json = {
        service: service_name,
        mode: mode,
        daemonauthkey: daemon_authkey,
        type: "Activity",
        spawndomain: spawn_domain,
        owner: owner,
        ownerdomain: owner_domain,
        serverid: serverid,
        connectiontype: connection_type,
        description: description
      };

      if(_entity_json.owner === "") {
        _entity_json.owner = null;
      }

      if(!_entity_json.mode) {
        _entity_json.mode = 'normal';
      }

      if(!_entity_json.ownerdomain) {
        _entity_json.ownerdomain === connprofile.returnHostIP();
      }

      _authenticity_module.getUserIdByUsername(owner, (err, ownerid)=> {
        if(err&&_entity_json.owner) {
          _entity_json.owner = null;
        }
        _entity_json.ownerid = ownerid;
        _entity_module.registerEntity(_entity_json, connprofile, (err, id) => {
          if(err) {
            callback(err);
          }
          else {
            let entities_prev = connprofile.returnBundle('bundle_entities');
            if(entities_prev != null) {
              connprofile.setBundle('bundle_entities', [id].concat(entities_prev));
            }
            else {
              connprofile.setBundle('bundle_entities', [id]);
            }
            callback(false, id);
          }
        });
      });
    }
    else {
      if(_debug) {

      }
      callback(new Error('The service "'+service_name+'" does not exist.'));
    }
  };


// ----------------------------

  // get Callback Obj count
  this.getCBOCount = (callback)=> {
    _worker_module.getCBOCount(callback);
  };

  // get Callback Obj count
  this.getWorkerMemoryUsage = (callback)=> {
    _worker_module.getMemoryUsage(callback);
  };

  this.returnList = () => {
    return Object.keys(_local_services);
  };

  this.on = (type, callback)=> {
    _on_handler[type] = callback;
  };

  // service module close
  this.close = (callback) => {
    // move debug service and master back
    let _debug_service_obj = _local_services[_debug_service];
    let _master_service_obj = _local_services[_master_service];
    delete _local_services[_debug_service];
    delete _local_services[_master_service];

    _local_services[_master_service] = _master_service_obj;
    _local_services[_debug_service] = _debug_service_obj;

    let max = Object.keys(_local_services).length;
    let i=0;
    let _clear_var = ()=> {
      // need add service event system
      _local_services = {};
      _local_services_path = null;
      _local_services_files_path = null;
      _local_service_owner = null;
      _entity_module = null;
      _serviceapi_module = null;
      _authorization_module = null;
      _authenticity_module = null;
      _debug = false;
      _worker_module = null;
      _master_service = null;
      _debug_service = null;
      _on_handler = {};
      _emmiter = null;
    };

    let _close_next =()=> {
      try{
        _local_services[Object.keys(_local_services)[i]].close(()=> {
          i++;
          if(i<max){
            _close_next();
          }
          else {
            _clear_var();
            callback(false);
          }
        });
      }
      catch(e) {
        Utils.TagLog('*ERR*', 'An error occured on closing service "'+Object.keys(_local_services)[i]+'"');
        console.log(e);
        i++;
        if(i<max){
          _close_next();
        }
        else {
          _clear_var();
          callback(false);
        }
      }
    };
    _close_next();
  };
}

module.exports = Service;
