// NSF/NSd/api.js
// Description:
// "api.js" provide interface of interacting with core. This module is desgined
// for multithreading.
// Copyright 2018 NOOXY. All Rights Reserved.
// All api tree's top should be callable! For worker calling.

'use strict';

let Utils = require('./utilities');

function ServiceAPI() {
  let _coregateway = null;
  let _clear_obj_garbage_timeout = 30000;

  // prevent callback crash whole nooxy service framework system
  let _safe_callback = (callback) => {
    return (...args) => {
      try {
        callback.apply(null, args);
      }
      catch (err) {
        Utils.tagLog('*ERR*', 'Service API occured error. Please restart daemon.');
        console.log(err);
      }
    }
  };

  // import core in order to bind realtime modules to api
  this.importCore = (coregateway) => {
    _coregateway = coregateway;
  };

  function API() {
    // setup up remote shell service by daemon default connciton
    let DEFAULT_SERVER = _coregateway.Daemon.Settings.default_server;
    let DAEMONTYPE = _coregateway.Daemon.Settings.connection_servers[DEFAULT_SERVER].type;
    let DAEMONIP = _coregateway.Daemon.Settings.connection_servers[DEFAULT_SERVER].ip;
    let DAEMONPORT = _coregateway.Daemon.Settings.connection_servers[DEFAULT_SERVER].port;

    let _api = {};
    let _LCBOs = {};
    let _emitRemoteCallback;
    let _emitRemoteUnbind;
    let _api_tree = {};

    // garbage cleaning
    setInterval(()=>{
      try {
        for(let key in _LCBOs) {
          if(_LCBOs[key].isReferCanceled() == false) {
            _LCBOs[key].destroy();
          }
        }
      }
      catch(e) {
        console.log(e);
      }

    }, _clear_obj_garbage_timeout);

    // Local callback object
    function LCBO(obj, obj_contructor, isOneTimeObj) {
      let _RCBOs = {};
      let _id = Utils.generateUniqueID();
      _LCBOs[_id] = this;

      let _syncRefer = ()=> {

      }

      let _obj = obj;
      let _callbacks = obj_contructor(_syncRefer);

      this.isLCBO = true;

      this.isReferCanceled = ()=>{
        return obj.worker_cancel_refer;
      }

      this.destroy = ()=> {
        delete _LCBOs[_id];
        for(let id in _RCBOs) {
          _RCBOs[id].unbindRemote();
        }
      };

      this.callCallback = (path, args, arg_objs_trees)=>{
        Utils.callObjCallback(_callbacks, path, args, arg_objs_trees, null,
        (remoteobjid, remoteobjtree)=>{
          return(new RCBO(remoteobjid, remoteobjtree));
        });
        if(isOneTimeObj) {
          delete _LCBOs[_id]
        }
      }

      this.returnTree = ()=> {
        return [_id, Utils.generateObjCallbacksTree(_callbacks)];
      }
    };

    // Remote callback object
    function RCBO(obj_id, obj_tree) {

      this.run = (path, args)=> {
        let _runable = Utils.generateObjCallbacks(obj_id, obj_tree, ([obj_id, path], args)=>{
          let _arg_objs_trees = {};
          for(let i in args) {
            if(args[i].isLCBO) {
              _arg_objs_trees[i] = args[i].returnTree();
              args[i] = null;
            }
          }
          _emitRemoteCallback([obj_id, path], args, _arg_objs_trees);
        });
        _runable.apply(null, args);
      };

      this.unbindRemote = ()=> {
        _emitRemoteUnbind(obj_id);
      };
    }

    this.emitAPIRq = (path, args, argsobj)=> {
      Utils.callObjCallback(_api, path, args, argsobj, null,
      (remoteobjid, remoteobjtree)=>{
        return(new RCBO(remoteobjid, remoteobjtree));
      });
    }

    this.emitCallbackRq = ([id, path], args, argsobj)=> {
      let _LCBO = _LCBOs[id];
      _LCBO.callCallback(path, args, argsobj);
    }

    this.returnObj = ()=> {
      return _api;
    }

    this.setRemoteCallbackEmitter = (emitter)=> {
      _emitRemoteCallback = emitter;
    };

    this.setRemoteUnbindEmitter = (emitter)=> {
      _emitRemoteUnbind = emitter;
    };

    this.returnAPITree = () => {
      return _api_tree;
    };

    this.addAPI = (list, construct_function)=> {
      let _target = _api;
      for(let i=0; i<list.length-1; i++) {
        let key = list[i];
        if( !_target[key] ) _target[key] = {}
        _target = _target[key];
      }

      _target[list[list.length-1]] = construct_function(LCBO);
      // generate API Tree
      _api_tree = Utils.generateObjCallbacksTree(_api);
    }

    _api.SafeCallback = _safe_callback;

    _api.getVariables = (callback)=> {
      _safe_callback(callback(false, _coregateway.Variables));
    };

    _api.Service = {
      ActivitySocket: {
        createSocket: (method, targetip, targetport, service, owner, remote_callback_obj) => {
          _coregateway.Service.createActivitySocket(method, targetip, targetport, service, owner, (err, activitysocket)=> {
            let activitysocket_LCBO = new LCBO(as, (syncRefer)=> {
              return ({
                  call: (name, Json, remote_callback_obj_2)=> {
                    syncRefer(remote_callback_obj_2);
                    as.call(name, Json, (err, json)=> {
                      remote_callback_obj_2.run([], [err, json]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  },

                  getEntityID: (remote_callback_obj_2)=> {
                    syncRefer(remote_callback_obj_2);
                    as.getEntityID((err, entityID)=>{
                      remote_callback_obj_2.run([], [err, entityID]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  },

                  on: (type, remote_callback_obj_2)=> {
                    syncRefer(remote_callback_obj_2);
                    as.getEntityID((err, entityID)=>{
                      remote_callback_obj_2.run([], [err, entityID]);
                    });
                  }
              })
            });
            remote_callback_obj.run([], [err, activitysocket_LCBO]);
            remote_callback_obj.unbindRemote();
          });
        },
        createDefaultDeamonSocket: (service, owner, callback) => {
          _coregateway.Service.createDaemonActivitySocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, service, owner, _safe_callback(callback));
        },
        createDeamonSocket: (method, targetip, targetport, service, owner, callback) => {
          _coregateway.Service.createDaemonActivitySocket(method, targetip, targetport, service, owner, _safe_callback(callback));
        },
        createAdminDeamonSocket: (method, targetip, targetport, service, callback) => {
          _coregateway.Service.createAdminDaemonActivitySocket(method, targetip, targetport, service, _safe_callback(callback));
        },

        createDefaultAdminDeamonSocket: (service, remote_callback_obj) => {
          _coregateway.Service.createAdminDaemonActivitySocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, service, _safe_callback((err, as)=> {
            let local_callback_obj = new LCBO(as, (syncRefer)=> {
              return ({
                  call: (name, Json, remote_callback_obj_2)=> {
                    syncRefer(remote_callback_obj_2);
                    as.call(name, Json, (err, json)=> {
                      remote_callback_obj_2.run([], [err, json]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  },

                  getEntityID: (remote_callback_obj_2)=> {
                    syncRefer(remote_callback_obj_2);
                    as.getEntityID((err, entityID)=>{
                      remote_callback_obj_2.run([], [err, entityID]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  },

                  on: (type, remote_callback_obj_2)=> {
                    syncRefer(remote_callback_obj_2);
                    as.getEntityID((err, entityID)=>{
                      remote_callback_obj_2.run([], [err, entityID]);
                    });
                  },

                  close: ()=> {
                    as.close();
                  }
              })
            });
            remote_callback_obj.run([], [err, local_callback_obj]);
            remote_callback_obj.unbindRemote();
          }));
        },
      },

      Entity: {
        getfliteredEntitiesMetaData: (key, value, callback) => {
          _coregateway.Entity.getfliteredEntitiesMetaData(key, value, _safe_callback(callback));
        },
        getfliteredEntitiesList: (query, callback) => {
          _coregateway.Entity.getfliteredEntitiesList(query, callback);
        },
        getEntityValue: (entityID, key, callback) => {
          _safe_callback(callback(false, _coregateway.Entity.returnEntityValue(entityID, key)));
        },
        getEntityOwner: (entityID, callback) => {
          _safe_callback(callback(false, _coregateway.Entity.returnEntityOwner(entityID)));
        },
        getEntitiesMetaData: (callback) => {
          _coregateway.Entity.getEntitiesMeta(_safe_callback(callback));
        },
        getEntityMetaData: (entityID, callback) => {
          _safe_callback(callback(false, _coregateway.Entity.returnEntityMetaData(entityID)));
        },
        getCount: (callback) => {
          _safe_callback(callback(false, _coregateway.Entity.returnEntitycount()));
        },
        getEntities: (callback) => {
          _coregateway.Entity.getEntitiesMeta(_safe_callback(callback));
        },
        returnEntitiesID: (callback) => {
          _safe_callback(callback(false, _coregateway.Entity.returnEntitiesID()));
        },
        getEntityConnProfile: (entityID, callback)=> {
            _coregateway.Entity.getEntityConnProfile(entityID, _safe_callback(callback));
        },
        on: (type, callback)=> {
          // type:
          // EntityCreated
          _coregateway.Entity.on(type, _safe_callback(callback));
        }
      },

      getList: (callback) => {
        _safe_callback(callback(false, _coregateway.Service.returnList()));
      },

      getServiceManifest: (service_name, callback)=> {
        _safe_callback(callback(false, _coregateway.Service.returnServiceManifest(service_name)));
      },

      getJSONfuncList: (service_name, callback)=> {
        _safe_callback(callback(false, _coregateway.Service.returnJSONfuncList(service_name)));
      },

      getJSONfuncDict: (service_name)=> {
        _safe_callback(callback(false, _coregateway.Service.returnJSONfuncDict(service_name)));
      }

    };

    _api.Authorization = {
      Authby: {
        Token: (entityID, callback) => {
          _coregateway.Authorization.Authby.Token(entityID, _safe_callback(callback));
        },
        Password: (entityID, callback) => {
          _coregateway.Authorization.Authby.Password(entityID, _safe_callback(callback));
        },
        Action: (entityID, action_meta_data, callback)=> {

        },
        isSuperUser: (entityID, callback) => {
          _coregateway.Authorization.Authby.isSuperUser(entityID, _safe_callback(callback));
        },
        Domain: (entityID, callback) => {
          _coregateway.Authorization.Authby.Domain(entityID, _safe_callback(callback));
        },
        DaemonAuthKey: (entityID, callback) => {
          _coregateway.Authorization.Authby.DaemonAuthKey(entityID, _safe_callback(callback));
        }
      },
      importTrustDomains: (domains) => {
        _coregateway.importDaemonAuthKey(domains);
      }
    };

    _api.Daemon = {
      getSettings: (callback)=>{
        _safe_callback(callback(false, _coregateway.Daemon.Settings));
      },
      close: ()=>{_coregateway.Daemon.close()}
    };

    _api.Authenticity = {
      createUser: (username, displayname, password, privilege, detail, firstname, lastname, callback) => {
        _coregateway.Authenticity.createUser(username, displayname, password, privilege, detail, firstname, lastname, _safe_callback(callback));
      },

      deleteUser: (username, callback) => {
        _coregateway.Authenticity.deleteUser(username, _safe_callback(callback));
      },

      updatePassword: (username, newpassword, callback) => {
        _coregateway.Authenticity.updatePassword(username, newpassword, _safe_callback(callback));
      },

      updateToken: (username, callback) => {
        _coregateway.Authenticity.updateToken(username, _safe_callback(callback));
      },

      updatePrivilege: (username, privilege, callback) => {
        _coregateway.Authenticity.updatePrivilege(username, privilege, _safe_callback(callback));
      },

      updateName: (username, firstname, lastname, callback) => {
        _coregateway.Authenticity.updateName(username, firstname, lastname, _safe_callback(callback));
      },

      getUserMeta: (username, callback) => {
        _coregateway.Authenticity.getUserMeta(username, _safe_callback(callback));
      },

      getUserID: (username, callback) => {
        _coregateway.Authenticity.getUserID(username, _safe_callback(callback));
      },

      getUsernamebyId: (userid, callback) => {
        _coregateway.Authenticity.getUsernamebyId(userid, _safe_callback(callback));
      },

      getUserExistence: (username, callback)=>{
        _coregateway.Authenticity.getUserExistence(username, _safe_callback(callback));
      }
    };

    _api.Connection = {
      getServers: (callback) => {
        _coregateway.Connection.getServers(_safe_callback(callback));
      },
      getClients: (callback) => {
        _coregateway.Connection.getClients(_safe_callback(callback));
      },
      addServer: (conn_method, ip, port) => {
        _coregateway.Connection.addServer(conn_method, ip, port);
      }
    };

    _api.Crypto = {
      generateAESCBC256KeyByHash: (string1, string2, callback)=>{
        _coregateway.NoCrypto.generateAESCBC256KeyByHash(string1, string2, _safe_callback(callback));
      },
      encryptString: (algo, key, toEncrypt, callback)=>{
        _coregateway.NoCrypto.encryptString(algo, key, toEncrypt, _safe_callback(callback));
      },
      decryptString: (algo, key, toDecrypt, callback) =>{
        _coregateway.NoCrypto.decryptString(algo, key, toDecrypt, _safe_callback(callback));
      }
    }

    // for sniffing data
    _api.Sniffer = {
      onRouterJSON: _coregateway.Router.addJSONSniffer,
      onRouterRawData: _coregateway.Router.addRAWSniffer,
    }

    // generate API Tree
    _api_tree = Utils.generateObjCallbacksTree(_api);
  }

  let _get_normal_api = (callback_with_api)=> {
    callback_with_api(false, new API());
  };

  let _block_super_user_api = (api, callback) => {
    callback(false, api);
  };

  this.createServiceAPI = (service_socket, manifest, callback) => {
    _get_normal_api((err, api) => {
      api.addAPI(['Service', 'ServiceSocket'], (LCBO)=> {
        return ({
          def: (name, remote_callback_obj)=> {
            service_socket.def(name, (json, entityID, returnJSON)=> {
              let returnJSON_LCBO = new LCBO(returnJSON, (returnJSON_syncRefer)=> {
                return ((err, json_be_returned)=>{
                  returnJSON(err, json_be_returned);
                });
              }, true);
              remote_callback_obj.run([], [json, entityID, returnJSON_LCBO])
            });
          },

          sdef: (remote_callback_obj)=> {

          },

          on: (type, remote_callback_obj)=> {

          }
        })
      });
      api.addAPI(['getMe'], (LCBO)=> {
        return((remote_callback_obj)=> {
          remote_callback_obj.run([], [false, {
            Settings: manifest.settings,
            Manifest: manifest,
            FilesPath: _coregateway.Daemon.Settings.services_files_path+manifest.name+'/'
          }])
          remote_callback_obj.unbindRemote();
        });
      });
      callback(false, api);
    });
  };

  this.createServiceAPIwithImplementaion = (service_socket, manifest, callback) => {
    _get_normal_api((err, api) => {
      // console.log(api);
      api.Service.ServiceSocket = service_socket;
      api.getImplementation = (callback)=>{
        callback(false, _coregateway.Implementation);
      };

      api.getMe = (callback)=>{
        callback(false, {
          Settings: manifest.settings,
          Manifest: manifest,
          FilesPath: _coregateway.Daemon.Settings.services_files_path+manifest.name+'/'
        });
      }
      callback(false, api);
    });
  }

  this.close = () => {
    _coregateway = null;
  };
}

module.exports = ServiceAPI;
