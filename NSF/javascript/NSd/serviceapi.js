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
    function LCBO(obj, obj_contructor, isOneTimeObj, isNastyCallback) {
      let _RCBOs = {};
      let _id = Utils.generateUniqueID();
      _LCBOs[_id] = this;

      let _syncRefer = ()=> {

      }

      let _obj = obj;
      let _callbacks;
      if(obj_contructor)
        _callbacks = obj_contructor(_syncRefer);

      this.isLCBO = true;

      this.returnId = ()=> {return _id};

      this.isReferCanceled = ()=>{
        if(obj) {
          return obj.worker_cancel_refer;
        }
        else {
          return true;
        }

      }

      this.destroy = ()=> {
        delete _LCBOs[_id];
        for(let id in _RCBOs) {
          _RCBOs[id].unbindRemote();
        }
      };

      this.callCallback = (path, args, arg_objs_trees)=>{
        if(isNastyCallback) {
          Utils.callObjCallback(obj, path, args, arg_objs_trees, ([r_obj_id, r_path], r_args)=> {
            let _args_objs = {};
            for(let i in r_args) {
              if(Utils.hasFunction(r_args[i])) {
                let _arg_LCBO = new LCBO(r_args[i], null, false, true);
                _LCBOs[_arg_LCBO.returnId()] = _arg_LCBO;
                r_args[i] = null;
                // console.log(Object.keys(_local_obj_callbacks_dict).length);
                _args_objs[i] = _arg_LCBO.returnTree();
              }
            }
            _emitRemoteCallback([r_obj_id, r_path], r_args, _args_objs);
          }, Utils.generateObjCallbacks);
        }
        else {
          Utils.callObjCallback(_callbacks, path, args, arg_objs_trees, null,
          (remoteobjid, remoteobjtree)=>{
              return(new RCBO(remoteobjid, remoteobjtree));
          });
        }
        if(isOneTimeObj) {
          delete _LCBOs[_id]
        }
      }

      this.returnTree = ()=> {
        if(isNastyCallback) {
          return [_id, Utils.generateObjCallbacksTree(obj)];
        }
        else {
          return [_id, Utils.generateObjCallbacksTree(_callbacks)];
        }

      }
    };

    // Remote callback object
    function RCBO(obj_id, obj_tree) {

      this.run = (path, args)=> {
        let _runable = Utils.generateObjCallbacks(obj_id, obj_tree, ([obj_id, path], args)=>{
          let _arg_objs_trees = {};
          for(let i in args) {
            if(args[i]) {
              if(args[i].isLCBO) {
                _arg_objs_trees[i] = args[i].returnTree();
                args[i] = null;
              }
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

    _api.getVariables = (callback)=> {
      callback(false, _coregateway.Variables);
    };

    _api.Service = {
      ActivitySocket: {
        createSocket: (method, targetip, targetport, service, owner, remote_callback_obj) => {
          _coregateway.Service.createActivitySocket(method, targetip, targetport, service, owner, (err, as)=> {
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
                    as.on(type, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  },

                  sendData: (data)=> {
                    as.sendData(data);
                  },

                  close: ()=> {
                    as.close();
                  }
              })
            });
            remote_callback_obj.run([], [err, local_callback_obj]);
            remote_callback_obj.unbindRemote();
          });
        },
        createDefaultDeamonSocket: (service, owner, callback) => {
          _coregateway.Service.createDaemonActivitySocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, service, owner, (err, as)=> {
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
                    as.on(type, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  },

                  sendData: (data)=> {
                    as.sendData(data);
                  },

                  close: ()=> {
                    as.close();
                  }
              })
            });
            remote_callback_obj.run([], [err, local_callback_obj]);
            remote_callback_obj.unbindRemote();
          });
        },
        createDeamonSocket: (method, targetip, targetport, service, owner, callback) => {
          _coregateway.Service.createDaemonActivitySocket(method, targetip, targetport, service, owner, (err, as)=> {
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
                    as.on(type, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  },

                  sendData: (data)=> {
                    as.sendData(data);
                  },

                  close: ()=> {
                    as.close();
                  }
              })
            });
            remote_callback_obj.run([], [err, local_callback_obj]);
            remote_callback_obj.unbindRemote();
          });
        },
        createAdminDeamonSocket: (method, targetip, targetport, service, callback) => {
          _coregateway.Service.createAdminDaemonActivitySocket(method, targetip, targetport, service, (err, as)=> {
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
                    as.on(type, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  },

                  sendData: (data)=> {
                    as.sendData(data);
                  },

                  close: ()=> {
                    as.close();
                  }
              })
            });
            remote_callback_obj.run([], [err, local_callback_obj]);
            remote_callback_obj.unbindRemote();
          });
        },

        createDefaultAdminDeamonSocket: (service, remote_callback_obj) => {
          _coregateway.Service.createAdminDaemonActivitySocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, service, (err, as)=> {
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
                    as.on(type, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  },

                  sendData: (data)=> {
                    as.sendData(data);
                  },

                  close: ()=> {
                    as.close();
                  }
              })
            });
            remote_callback_obj.run([], [err, local_callback_obj]);
            remote_callback_obj.unbindRemote();
          });
        },
      },

      Entity: {
        getfliteredEntitiesMetaData: (key, value, remote_callback_obj) => {
          _coregateway.Entity.getfliteredEntitiesMetaData(key, value, (err, metatdata)=> {
            remote_callback_obj.run([], [err, metatdata])
            remote_callback_obj.unbindRemote();
          });
        },
        getfliteredEntitiesList: (query, remote_callback_obj) => {
          _coregateway.Entity.getfliteredEntitiesList(query, (err, list)=> {
            remote_callback_obj.run([], [err, list])
            remote_callback_obj.unbindRemote();
          });
        },
        getEntityValue: (entityID, key, remote_callback_obj) => {
          remote_callback_obj.run([], [false, _coregateway.Entity.returnEntityValue(entityID, key)])
          remote_callback_obj.unbindRemote();
        },
        getEntityOwner: (entityID, remote_callback_obj) => {
          remote_callback_obj.run([], [false, _coregateway.Entity.returnEntityOwner(entityID)])
          remote_callback_obj.unbindRemote();
        },
        getEntitiesMetaData: (remote_callback_obj) => {
          _coregateway.Entity.getEntitiesMeta((err, metatdata)=> {
            remote_callback_obj.run([], [err, metatdata])
            remote_callback_obj.unbindRemote();
          });
        },
        getEntityMetaData: (entityID, remote_callback_obj) => {
          remote_callback_obj.run([], [false, _coregateway.Entity.returnEntityMetaData(entityID)])
          remote_callback_obj.unbindRemote();
        },
        getCount: (remote_callback_obj) => {
          remote_callback_obj.run([], [false, _coregateway.Entity.returnEntitycount()])
          remote_callback_obj.unbindRemote();
        },
        getEntities: (remote_callback_obj) => {
          _coregateway.Entity.getEntitiesMeta((err, meta)=> {
            remote_callback_obj.run([], [err, meta]);
            remote_callback_obj.unbindRemote();
          });
        },
        getEntitiesID: (remote_callback_obj) => {
          remote_callback_obj.run([], [false, _coregateway.Entity.returnEntitiesID()]);
          remote_callback_obj.unbindRemote();
        },
        getEntityConnProfile: (entityID, remote_callback_obj)=> {
          _coregateway.Entity.getEntityConnProfile(entityID, (err, conn_profile)=> {
            let local_callback_obj = new LCBO(conn_profile, (conn_profile_syncRefer)=> {
              return ({
                  getServerID: (remote_callback_obj_2)=> {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getServerID((err, serverid)=> {
                      remote_callback_obj_2.run([], [err, serverid]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  },

                  getHostIP: (remote_callback_obj_2)=> {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getHostIP((err, hostip)=> {
                      remote_callback_obj_2.run([], [err, hostip]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  },

                  getHostPort: (remote_callback_obj_2)=> {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getHostPort((err, hostport)=> {
                      remote_callback_obj_2.run([], [err, hostport]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  },

                  getClientIP: (remote_callback_obj_2)=> {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getClientIP((err, clientip)=> {
                      remote_callback_obj_2.run([], [err, clientip]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  },

                  getConnMethod: (remote_callback_obj_2)=> {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getConnMethod((err, connMethod)=> {
                      remote_callback_obj_2.run([], [err, connMethod]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  },

                  getRemotePosition: (remote_callback_obj_2)=> {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getRemotePosition((err, remotepos)=> {
                      remote_callback_obj_2.run([], [err, remotepos]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  },

                  setBundle: (key, value)=> {
                    conn_profile.setBundle(key, value);
                  },

                  getBundle: (key, remote_callback_obj_2)=> {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getBundle(key, (err, bundle)=> {
                      remote_callback_obj_2.run([], [err, bundle]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  },

                  getGUID: (remote_callback_obj_2)=> {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getGUID((err, guid)=> {
                      remote_callback_obj_2.run([], [err, guid]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
              })
            });
            remote_callback_obj.run([], [err, local_callback_obj]);
            remote_callback_obj.unbindRemote();
          });
        },
        on: (type, remote_callback_obj)=> {
          _coregateway.Entity.on(type, (entityID, entityJson)=> {
            remote_callback_obj.run([], [entityID, entityJson])
          });
        }
      },

      getList: (remote_callback_obj) => {
        remote_callback_obj.run([], [false, _coregateway.Service.returnList()]);
        remote_callback_obj.unbindRemote();
      },

      getServiceManifest: (service_name, remote_callback_obj)=> {
        remote_callback_obj.run([], [false, _coregateway.Service.returnServiceManifest(service_name)]);
        remote_callback_obj.unbindRemote();
      },

      getJSONfuncList: (service_name, remote_callback_obj)=> {
        remote_callback_obj.run([], [false, _coregateway.Service.returnJSONfuncList(service_name)]);
        remote_callback_obj.unbindRemote();
      },

      getJSONfuncDict: (service_name, remote_callback_obj)=> {
        remote_callback_obj.run([], [false, _coregateway.Service.returnJSONfuncDict(service_name)]);
        remote_callback_obj.unbindRemote();
      },

      relaunch: (service_name)=> {
        _coregateway.Service.relaunch(service_name);
      }
    };

    _api.Authorization = {
      Authby: {
        Token: (entityID, remote_callback_obj) => {
          _coregateway.Authorization.Authby.Token(entityID, (err, pass)=> {
            remote_callback_obj.run([], [err, pass]);
            remote_callback_obj.unbindRemote();
          });
        },
        Password: (entityID, remote_callback_obj) => {
          _coregateway.Authorization.Authby.Password(entityID, (err, pass)=> {
            remote_callback_obj.run([], [err, pass]);
            remote_callback_obj.unbindRemote();
          });
        },
        Action: (entityID, action_meta_data, callback)=> {

        },
        isSuperUser: (entityID, remote_callback_obj) => {
          _coregateway.Authorization.Authby.isSuperUser(entityID, (err, pass)=> {
            remote_callback_obj.run([], [err, pass]);
            remote_callback_obj.unbindRemote();
          });
        },
        Domain: (entityID, remote_callback_obj) => {
          _coregateway.Authorization.Authby.Domain(entityID, (err, pass)=> {
            remote_callback_obj.run([], [err, pass]);
            remote_callback_obj.unbindRemote();
          });
        },
        DaemonAuthKey: (entityID, remote_callback_obj) => {
          _coregateway.Authorization.Authby.DaemonAuthKey(entityID, (err, pass)=> {
            remote_callback_obj.run([], [err, pass]);
            remote_callback_obj.unbindRemote();
          });
        }
      },
      importTrustDomains: (domains) => {
        _coregateway.importDaemonAuthKey(domains);
      }
    };

    _api.Daemon = {
      getSettings: (remote_callback_obj)=>{
        remote_callback_obj.run([], [false, _coregateway.Daemon.Settings]);
        remote_callback_obj.unbindRemote();
      },

      close: ()=>{_coregateway.Daemon.close()}
    };

    _api.Authenticity = {
      createUser: (username, displayname, password, privilege, detail, firstname, lastname, remote_callback_obj) => {
        _coregateway.Authenticity.createUser(username, displayname, password, privilege, detail, firstname, lastname, (err)=> {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        });
      },

      deleteUser: (username, remote_callback_obj) => {
        _coregateway.Authenticity.deleteUser(username, (err)=> {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        });
      },

      updatePassword: (username, newpassword, remote_callback_obj) => {
        _coregateway.Authenticity.updatePassword(username, newpassword, (err)=> {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        });
      },

      updateToken: (username, remote_callback_obj) => {
        _coregateway.Authenticity.updateToken(username, (err)=> {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        });
      },

      updatePrivilege: (username, privilege, remote_callback_obj) => {
        _coregateway.Authenticity.updatePrivilege(username, privilege, (err)=> {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        });
      },

      updateName: (username, firstname, lastname, remote_callback_obj) => {
        _coregateway.Authenticity.updateName(username, firstname, lastname, (err)=> {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        });
      },

      getUserMeta: (username, remote_callback_obj) => {
        _coregateway.Authenticity.getUserMeta(username, (err, usermeta)=> {
          remote_callback_obj.run([], [err, usermeta]);
          remote_callback_obj.unbindRemote();
        });
      },

      getUserID: (username, remote_callback_obj) => {
        _coregateway.Authenticity.getUserID(username, (err, userid)=> {
          remote_callback_obj.run([], [err, userid]);
          remote_callback_obj.unbindRemote();
        });
      },

      getUsernamebyId: (userid, remote_callback_obj) => {
        _coregateway.Authenticity.getUsernamebyId(userid, (err, username)=> {
          remote_callback_obj.run([], [err, username]);
          remote_callback_obj.unbindRemote();
        });
      },

      getUserExistence: (username, remote_callback_obj)=>{
        _coregateway.Authenticity.getUserExistence(username, (err, exisitence)=> {
          remote_callback_obj.run([], [err, exisitence]);
          remote_callback_obj.unbindRemote();
        });
      }
    };

    _api.Connection = {
      addServer: (conn_method, ip, port) => {
        _coregateway.Connection.addServer(conn_method, ip, port);
      }
    };

    _api.Crypto = {
      generateAESCBC256KeyByHash: (string1, string2, remote_callback_obj)=>{
        _coregateway.NoCrypto.generateAESCBC256KeyByHash(string1, string2, (err, key)=> {
          remote_callback_obj.run([], [err, key]);
          remote_callback_obj.unbindRemote();
        });
      },
      encryptString: (algo, key, toEncrypt, remote_callback_obj)=>{
        _coregateway.NoCrypto.encryptString(algo, key, toEncrypt, (err, enstr)=> {
          remote_callback_obj.run([], [err, enstr]);
          remote_callback_obj.unbindRemote();
        });
      },
      decryptString: (algo, key, toDecrypt, remote_callback_obj) =>{
        _coregateway.NoCrypto.decryptString(algo, key, toDecrypt, (err, destr)=> {
          remote_callback_obj.run([], [err, destr]);
          remote_callback_obj.unbindRemote();
        });
      }
    }

    // for sniffing data
    _api.Sniffer = {
      onRouterJSON: (remote_callback_obj)=> {
        _coregateway.Router.addJSONSniffer((err, data)=> {
          remote_callback_obj.run([], [err, data]);
        });
      },
      onRouterRawData: (remote_callback_obj)=> {
        _coregateway.Router.addRAWSniffer((err, data)=> {
          remote_callback_obj.run([], [err, data]);
        });
      },
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
              remote_callback_obj.run([], [json, entityID, returnJSON_LCBO]);
            });
          },

          sdef: (name, remote_callback_obj, remote_callback_obj_2)=> {
            service_socket.sdef(name, (json, entityID, returnJSON)=> {
              let returnJSON_LCBO = new LCBO(returnJSON, (returnJSON_syncRefer)=> {
                return ((err, json_be_returned)=>{
                  returnJSON(err, json_be_returned);
                });
              }, true);
              remote_callback_obj.run([], [json, entityID, returnJSON_LCBO]);
            },
            (json, entityID, returnJSON)=> {
              let returnJSON_LCBO = new LCBO(returnJSON, (returnJSON_syncRefer)=> {
                return ((err, json_be_returned)=>{
                  returnJSON(err, json_be_returned);
                });
              }, true);
              remote_callback_obj_2.run([], [json, entityID, returnJSON_LCBO]);
            });
          },

          on: (type, remote_callback_obj)=> {
            if(type == 'data') {
              service_socket.on('data', (entityID, data)=> {
                remote_callback_obj.run([], [entityID, data]);
              });
            }
            else {
              service_socket.on(type, (entityID, callback)=> {
                let callback_LCBO = new LCBO(callback, (callback_syncRefer)=> {
                  return ((err)=>{
                    callback(err);
                  });
                }, true);
                remote_callback_obj.run([], [entityID, callback_LCBO]);
              });
            }
          },

          sendData: (entityID, data)=> {
            service_socket.sendData(entityID, data);
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
      api.addAPI(['Service', 'ServiceSocket'], (LCBO)=> {
        return ({
          def: (name, remote_callback_obj)=> {
            service_socket.def(name, (json, entityID, returnJSON)=> {
              let returnJSON_LCBO = new LCBO(returnJSON, (returnJSON_syncRefer)=> {
                return ((err, json_be_returned)=>{
                  returnJSON(err, json_be_returned);
                });
              }, true);
              remote_callback_obj.run([], [json, entityID, returnJSON_LCBO]);
            });
          },

          sdef: (name, remote_callback_obj, remote_callback_obj_2)=> {
            service_socket.sdef(name, (json, entityID, returnJSON)=> {
              let returnJSON_LCBO = new LCBO(returnJSON, (returnJSON_syncRefer)=> {
                return ((err, json_be_returned)=>{
                  returnJSON(err, json_be_returned);
                });
              }, true);
              remote_callback_obj.run([], [json, entityID, returnJSON_LCBO]);
            },
            (json, entityID, returnJSON)=> {
              let returnJSON_LCBO = new LCBO(returnJSON, (returnJSON_syncRefer)=> {
                return ((err, json_be_returned)=>{
                  returnJSON(err, json_be_returned);
                });
              }, true);
              remote_callback_obj_2.run([], [json, entityID, returnJSON_LCBO]);
            });
          },

          on: (type, remote_callback_obj)=> {
            if(type == 'data') {
              service_socket.on('data', (entityID, data)=> {
                remote_callback_obj.run([], [entityID, data]);
              });
            }
            else {
              service_socket.on(type, (entityID, callback)=> {
                let callback_LCBO = new LCBO(callback, (callback_syncRefer)=> {
                  return ((err)=>{
                    callback(err);
                  });
                }, true);
                remote_callback_obj.run([], [entityID, callback_LCBO]);
              });
            }
          },

          sendData: (entityID, data)=> {
            service_socket.sendData(entityID, data);
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

      api.addAPI(['getImplementation'], (LCBO)=> {
        return((remote_callback_obj)=> {
          let Implementation_LCBO = new LCBO(_coregateway.Implementation, null, false, true);
          remote_callback_obj.run([], [false, Implementation_LCBO]);
          remote_callback_obj.unbindRemote();
        });
      });

      callback(false, api);
    });
  }

  this.close = () => {
    _coregateway = null;
  };
}

module.exports = ServiceAPI;
