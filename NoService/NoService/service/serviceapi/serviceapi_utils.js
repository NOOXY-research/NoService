// NoService/NoService/service/serviceapi_utils.js
// Description:
// "serviceapi_utils.js" provide interface of interacting with core. This module is desgined
// for multithreading.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
// All api tree's top should be callable! For worker calling.

const Utils = require('../../library').Utilities;

function API(_coregateway) {
  let _clear_obj_garbage_timeout = 30000;
  // setup up remote shell service by daemon default connection
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
        if(_LCBOs[key].isReferCanceled() === false) {
          _LCBOs[key].destroy();
        }
      }
    }
    catch(e) {
      console.log(e);
    }

  }, _clear_obj_garbage_timeout);

  this.reset = ()=> {
    _LCBOs = [];
  };
  // Local callback object
  function LCBO(obj, obj_contructor, isOneTimeObj, isNastyCallback) {
    let _RCBOs = [];
    let _id = Utils.generateUniqueId();
    _LCBOs[_id] = this;

    let _syncRefer = (MyRCBO)=> {
      _RCBOs.push(MyRCBO);
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
        delete _RCBOs[id];
      }
      obj = null;
      _obj = null;
    };

    this.callCallback = (path, args, arg_objs_trees)=>{
      try {
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
      }
      catch(e) {
        Utils.TagLog('*ERR*', 'LCBO occured error.');
        console.log(e);
        Utils.TagLog('*ERR*', 'LCBO detail.');
        Utils.TagLog('*ERR*', 'Object: ');
        console.log(obj);
        Utils.TagLog('*ERR*', 'Tree: ');
        console.log(Utils.generateObjCallbacksTree(obj));
        Utils.TagLog('*ERR*', 'Arguments: ');
        console.log(path, args, arg_objs_trees);
      }
      if(isOneTimeObj) {
        this.destroy();
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
    // let _My_LCBOs = [];
    //
    // this.syncRefer = (MyLCBO)=> {
    //   _My_LCBOs.push(MyLCBO);
    // };

    this.run = (path, args)=> {
      let _runable = Utils.generateObjCallbacks(obj_id, obj_tree, ([obj_id, path], args)=> {
        let _arg_objs_trees = {};
        for(let i in args) {
          if(args[i]) {
            if(args[i].isLCBO) {
              _arg_objs_trees[i] = args[i].returnTree();
              args[i] = null;
            }
            else if (args[i] instanceof Error) {
              args[i] = args[i].toString();
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

  this.returnLCBOCount = ()=> {
    return Object.keys(_LCBOs).length;
  };

  this.emitCallbackRq = ([id, path], args, argsobj)=> {
    let _LCBO = _LCBOs[id];
    if(_LCBO)
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
        _coregateway.Activity.createActivitySocket(method, targetip, targetport, service, owner, (err, as)=> {
          let local_callback_obj = new LCBO(as, (syncRefer)=> {
            return ({
                call: (name, Json, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.call(name, Json, (err, json)=> {
                      if(remote_callback_obj_2) {}
                      remote_callback_obj_2.run([], [err, json]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                getEntityId: (remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.getEntityId((err, entityId)=>{
                      remote_callback_obj_2.run([], [err, entityId]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                on: (type, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.on(type, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  }
                },

                onEvent: (event, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.onEvent(event, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  }
                },

                sendData: (data)=> {
                  as.sendData(data);
                },

                close: ()=> {
                  as.close();
                }
            })
          });
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, local_callback_obj]);
            remote_callback_obj.unbindRemote();
          }
        });
      },
      createDefaultDeamonSocket: (service, owner, remote_callback_obj) => {
        _coregateway.Activity.createDaemonActivitySocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, service, owner, (err, as)=> {
          let local_callback_obj = new LCBO(as, (syncRefer)=> {
            return ({
                call: (name, Json, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.call(name, Json, (err, json)=> {
                      remote_callback_obj_2.run([], [err, json]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                getEntityId: (remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.getEntityId((err, entityId)=>{
                      remote_callback_obj_2.run([], [err, entityId]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                on: (type, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.on(type, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  }
                },

                onEvent: (event, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.onEvent(event, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  }
                },

                sendData: (data)=> {
                  as.sendData(data);
                },

                close: ()=> {
                  as.close();
                }
            })
          });
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, local_callback_obj]);
            remote_callback_obj.unbindRemote();
          }
        });
      },
      createDeamonSocket: (method, targetip, targetport, service, owner, remote_callback_obj) => {
        _coregateway.Activity.createDaemonActivitySocket(method, targetip, targetport, service, owner, (err, as)=> {
          let local_callback_obj = new LCBO(as, (syncRefer)=> {
            return ({
                call: (name, Json, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.call(name, Json, (err, json)=> {
                      remote_callback_obj_2.run([], [err, json]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }

                },

                getEntityId: (remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.getEntityId((err, entityId)=>{
                      remote_callback_obj_2.run([], [err, entityId]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }

                },

                on: (type, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.on(type, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  }
                },

                onEvent: (event, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.onEvent(event, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  }
                },

                sendData: (data)=> {
                  as.sendData(data);
                },

                close: ()=> {
                  as.close();
                }
            })
          });
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, local_callback_obj]);
            remote_callback_obj.unbindRemote();
          }
        });
      },
      createAdminDeamonSocket: (method, targetip, targetport, service, remote_callback_obj) => {
        _coregateway.Activity.createAdminDaemonActivitySocket(method, targetip, targetport, service, (err, as)=> {
          let local_callback_obj = new LCBO(as, (syncRefer)=> {
            return ({
                call: (name, Json, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.call(name, Json, (err, json)=> {
                      remote_callback_obj_2.run([], [err, json]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                getEntityId: (remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.getEntityId((err, entityId)=>{
                      remote_callback_obj_2.run([], [err, entityId]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                on: (type, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.on(type, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  }
                },

                onEvent: (event, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.onEvent(event, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  }
                },

                sendData: (data)=> {
                  as.sendData(data);
                },

                close: ()=> {
                  as.close();
                }
            })
          });
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, local_callback_obj]);
            remote_callback_obj.unbindRemote();
          }
        });
      },

      createDefaultAdminDeamonSocket: (service, remote_callback_obj) => {
        _coregateway.Activity.createAdminDaemonActivitySocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, service, (err, as)=> {
          let local_callback_obj = new LCBO(as, (syncRefer)=> {
            return ({
                call: (name, Json, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.call(name, Json, (err, json)=> {
                      remote_callback_obj_2.run([], [err, json]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                getEntityId: (remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.getEntityId((err, entityId)=>{
                      remote_callback_obj_2.run([], [err, entityId]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                on: (type, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.on(type, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  }
                },

                onEvent: (event, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    syncRefer(remote_callback_obj_2);
                    as.onEvent(event, (err, data)=>{
                      remote_callback_obj_2.run([], [err, data]);
                    });
                  }
                },

                sendData: (data)=> {
                  as.sendData(data);
                },

                close: ()=> {
                  as.close();
                }
            })
          });
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, local_callback_obj]);
            remote_callback_obj.unbindRemote();
          }
        });
      },
    },

    Entity: {
      getFilteredEntitiesMetaData: (key, value, remote_callback_obj) => {
        _coregateway.Entity.getFilteredEntitiesMetaData(key, value, (err, metatdata)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, metatdata])
            remote_callback_obj.unbindRemote();
          }
        });
      },
      getFilteredEntitiesList: (query, remote_callback_obj) => {
        _coregateway.Entity.getFilteredEntitiesList(query, (err, list)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, list])
            remote_callback_obj.unbindRemote();
          }
        });
      },
      getEntityValue: (entityId, key, remote_callback_obj) => {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [false, _coregateway.Entity.returnEntityValue(entityId, key)])
          remote_callback_obj.unbindRemote();
        }
      },
      getEntityOwner: (entityId, remote_callback_obj) => {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [false, _coregateway.Entity.returnEntityOwner(entityId)])
          remote_callback_obj.unbindRemote();
        }
      },
      getEntityOwnerId: (entityId, remote_callback_obj) => {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [false, _coregateway.Entity.returnEntityOwnerId(entityId)])
          remote_callback_obj.unbindRemote();
        }
      },
      getEntitiesMetaData: (remote_callback_obj) => {
        _coregateway.Entity.getEntitiesMeta((err, metatdata)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, metatdata])
            remote_callback_obj.unbindRemote();
          }
        });
      },
      getEntityMetaData: (entityId, remote_callback_obj) => {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [false, _coregateway.Entity.returnEntityMetaData(entityId)])
          remote_callback_obj.unbindRemote();
        }
      },
      getCount: (remote_callback_obj) => {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [false, _coregateway.Entity.returnEntitycount()])
          remote_callback_obj.unbindRemote();
        }
      },
      getEntities: (remote_callback_obj) => {
        _coregateway.Entity.getEntitiesMeta((err, meta)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, meta]);
            remote_callback_obj.unbindRemote();
          }
        });
      },
      getEntitiesId: (remote_callback_obj) => {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [false, _coregateway.Entity.returnEntitiesId()]);
          remote_callback_obj.unbindRemote();
        }
      },
      getEntityConnProfile: (entityId, remote_callback_obj)=> {
        _coregateway.Entity.getEntityConnProfile(entityId, (err, conn_profile)=> {
          let local_callback_obj = new LCBO(conn_profile, (conn_profile_syncRefer)=> {
            return ({
                getServerId: (remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getServerId((err, serverid)=> {
                      if(remote_callback_obj_2) {}
                      remote_callback_obj_2.run([], [err, serverid]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                getHostIP: (remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getHostIP((err, hostip)=> {
                      remote_callback_obj_2.run([], [err, hostip]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                getHostPort: (remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getHostPort((err, hostport)=> {
                      remote_callback_obj_2.run([], [err, hostport]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                getClientIP: (remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getClientIP((err, clientip)=> {
                      remote_callback_obj_2.run([], [err, clientip]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                getConnMethod: (remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getConnMethod((err, connMethod)=> {
                      remote_callback_obj_2.run([], [err, connMethod]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                getRemotePosition: (remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getRemotePosition((err, remotepos)=> {
                      remote_callback_obj_2.run([], [err, remotepos]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                setBundle: (key, value)=> {
                  conn_profile.setBundle(key, value);
                },

                getBundle: (key, remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getBundle(key, (err, bundle)=> {
                      remote_callback_obj_2.run([], [err, bundle]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                },

                getGUID: (remote_callback_obj_2)=> {
                  if(remote_callback_obj_2) {
                    conn_profile_syncRefer(remote_callback_obj_2);
                    conn_profile.getGUID((err, guid)=> {
                      remote_callback_obj_2.run([], [err, guid]);
                      remote_callback_obj_2.unbindRemote();
                    });
                  }
                }
            })
          });
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, local_callback_obj]);
            remote_callback_obj.unbindRemote();
          }
        });
      },

      on: (type, remote_callback_obj)=> {
        _coregateway.Entity.on(type, (entityId, entityJson)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [entityId, entityJson])
          }
        });
      },

      addEntityToGroups:(entityId, grouplist, remote_callback_obj)=> {
        _coregateway.Entity.addEntityToGroups(entityId, grouplist, (err)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err]);
            remote_callback_obj.unbindRemote();
          }
        });
      },

      deleteEntityFromGroups:(entityId, grouplist, remote_callback_obj)=> {
        _coregateway.Entity.deleteEntityFromGroups(entityId, grouplist, (err)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err]);
            remote_callback_obj.unbindRemote();
          }
        });
      },

      clearAllGroupsOfEntity:(entityId, remote_callback_obj)=> {
        _coregateway.Entity.clearAllGroupsOfEntity(entityId, (err)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err]);
            remote_callback_obj.unbindRemote();
          }
        });
      },

      isEntityIncludingGroups:(entityId, grouplist, remote_callback_obj)=> {
        _coregateway.Entity.isEntityIncludingGroups(entityId, grouplist, (err)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err]);
            remote_callback_obj.unbindRemote();
          }
        });
      },

      isEntityInGroup:(entityId, grouplist, remote_callback_obj)=> {
        _coregateway.Entity.isEntityInGroup(entityId, grouplist, (err)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err]);
            remote_callback_obj.unbindRemote();
          }
        });
      },

      getGroupsofEntity:(entityId, remote_callback_obj)=> {
        _coregateway.Entity.getGroupsofEntity(entityId, (err, results)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, results]);
            remote_callback_obj.unbindRemote();
          }
        });
      }
    },

    getList: (remote_callback_obj) => {
      if(remote_callback_obj) {
        remote_callback_obj.run([], [false, _coregateway.Service.returnList()]);
        remote_callback_obj.unbindRemote();
      }
    },

    getServiceManifest: (service_name, remote_callback_obj)=> {
      if(remote_callback_obj) {
        remote_callback_obj.run([], [false, _coregateway.Service.returnServiceManifest(service_name)]);
        remote_callback_obj.unbindRemote();
      }
    },

    getServicesManifest: (remote_callback_obj)=> {
      _coregateway.Service.getServicesManifest((err, manifest)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, manifest]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    getServiceFunctionList: (service_name, remote_callback_obj)=> {
      if(remote_callback_obj) {
        remote_callback_obj.run([], [false, _coregateway.Service.returnServiceFunctionList(service_name)]);
        remote_callback_obj.unbindRemote();
      }
    },

    getServiceFunctionDict: (service_name, remote_callback_obj)=> {
      if(remote_callback_obj) {
        remote_callback_obj.run([], [false, _coregateway.Service.returnServiceFunctionDict(service_name)]);
        remote_callback_obj.unbindRemote();
      }
    },

    launch: (service_name, remote_callback_obj)=> {
      _coregateway.Service.launchService(service_name, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    initialize: (service_name, remote_callback_obj)=> {
      _coregateway.Service.initializeService(service_name, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    relaunch: (service_name, remote_callback_obj)=> {
      _coregateway.Service.relaunchService(service_name, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    close: (service_name, remote_callback_obj)=> {
      _coregateway.Service.closeService(service_name, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    isServiceLaunched: (service_name, remote_callback_obj)=> {
      _coregateway.Service.isServiceLaunched(service_name, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    isServiceInitialized: (service_name, remote_callback_obj)=> {
      _coregateway.Service.isServiceInitialized(service_name, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    // CBO is designed for prevent memleak
    getCBOCount: (remote_callback_obj)=> {
      _coregateway.Service.getCBOCount((err, count)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, count]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    // CBO is designed for prevent memleak
    getWorkerMemoryUsage: (remote_callback_obj)=> {
      _coregateway.Service.getWorkerMemoryUsage((err, usage)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, usage]);
          remote_callback_obj.unbindRemote();
        }
      });
    }
  };

  _api.Authorization = {
    Authby: {
      Token: (entityId, remote_callback_obj) => {
        _coregateway.Authorization.Authby.Token(entityId, (err, pass)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, pass]);
            remote_callback_obj.unbindRemote();
          }
        });
      },
      Password: (entityId, remote_callback_obj) => {
        _coregateway.Authorization.Authby.Password(entityId, (err, pass)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, pass]);
            remote_callback_obj.unbindRemote();
          }
        });
      },
      Action: (entityId, action_meta_data, callback)=> {

      },
      isSuperUser: (entityId, remote_callback_obj) => {
        _coregateway.Authorization.Authby.isSuperUser(entityId, (err, pass)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, pass]);
            remote_callback_obj.unbindRemote();
          }
        });
      },
      Domain: (entityId, remote_callback_obj) => {
        _coregateway.Authorization.Authby.Domain(entityId, (err, pass)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, pass]);
            remote_callback_obj.unbindRemote();
          }
        });
      },
      DaemonAuthKey: (entityId, remote_callback_obj) => {
        _coregateway.Authorization.Authby.DaemonAuthKey(entityId, (err, pass)=> {
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, pass]);
            remote_callback_obj.unbindRemote();
          }
        });
      }
    },

    importTrustDomains: (domains) => {
      _coregateway.Authorization.importDaemonAuthKey(domains);
    },

    emitSignin: (entityId) => {
      _coregateway.Authorization.emitSignin(entityId);
    },
  };

  _api.Daemon = {
    getSettings: (remote_callback_obj)=>{
      if(remote_callback_obj) {
        remote_callback_obj.run([], [false, _coregateway.Daemon.Settings]);
        remote_callback_obj.unbindRemote();
      }
    },

    getVariables: (remote_callback_obj)=>{
      if(remote_callback_obj) {
        remote_callback_obj.run([], [false, _coregateway.Daemon.Variables]);
        remote_callback_obj.unbindRemote();
      }
    },

    close: ()=>{_coregateway.Daemon.close()},

    relaunch: ()=>{_coregateway.Daemon.relaunch()},
  };

  _api.Authenticity = {
    getUsernameByUserId: (userid, remote_callback_obj) => {
      _coregateway.Authenticity.getUsernameByUserId(userid, (err, username)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, username]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    createUser: (username, displayname, password, privilege, detail, firstname, lastname, remote_callback_obj) => {
      _coregateway.Authenticity.createUser(username, displayname, password, privilege, detail, firstname, lastname, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    deleteUserByUsername: (username, remote_callback_obj) => {
      _coregateway.Authenticity.deleteUserByUsername(username, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    updatePasswordByUsername: (username, newpassword, remote_callback_obj) => {
      _coregateway.Authenticity.updatePasswordByUsername(username, newpassword, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    updateTokenByUsername: (username, remote_callback_obj) => {
      _coregateway.Authenticity.updateTokenByUsername(username, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    updatePrivilegeByUsername: (username, privilege, remote_callback_obj) => {
      _coregateway.Authenticity.updatePrivilegeByUsername(username, privilege, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    updateNameByUsername: (username, firstname, lastname, remote_callback_obj) => {
      _coregateway.Authenticity.updateNameByUsername(username, firstname, lastname, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    getUserMetaByUsername: (username, remote_callback_obj) => {
      _coregateway.Authenticity.getUserMetaByUsername(username, (err, usermeta)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, usermeta]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    getUserIdByUsername: (username, remote_callback_obj) => {
      _coregateway.Authenticity.getUserIdByUsername(username, (err, userid)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, userid]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    getUserExistenceByUsername: (username, remote_callback_obj)=>{
      _coregateway.Authenticity.getUserExistenceByUsername(username, (err, exisitence)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, exisitence]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    getUserTokenByUsername: (username, remote_callback_obj)=>{
      _coregateway.Authenticity.getUserTokenByUsername(username, (err, token)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, token]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    getUserPrivilegeByUsername: (username, remote_callback_obj)=>{
      _coregateway.Authenticity.getUserPrivilegeByUsername(username, (err, privilege)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, privilege]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    searchUsersByUsernameNRows: (username, N, remote_callback_obj)=>{
      _coregateway.Authenticity.searchUsersByUsernameNRows(username, N, (err, rows)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, rows]);
          remote_callback_obj.unbindRemote();
        }
      });
    },


    // By Id
    deleteUserByUserId: (userid, remote_callback_obj) => {
      _coregateway.Authenticity.deleteUserByUserId(userid, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    updatePasswordByUserId: (userid, newpassword, remote_callback_obj) => {
      _coregateway.Authenticity.updatePasswordByUserId(userid, newpassword, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    updateTokenByUserId: (userid, remote_callback_obj) => {
      _coregateway.Authenticity.updateTokenByUserId(userid, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    updatePrivilegeByUserId: (userid, privilege, remote_callback_obj) => {
      _coregateway.Authenticity.updatePrivilegeByUserId(userid, privilege, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    updateNameByUserId: (userid, firstname, lastname, remote_callback_obj) => {
      _coregateway.Authenticity.updateNameByUserId(userid, firstname, lastname, (err)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    getUserMetaByUserId: (userid, remote_callback_obj) => {
      _coregateway.Authenticity.getUserMetaByUserId(userid, (err, usermeta)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, usermeta]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    // getUsernameByUserId: (userid, remote_callback_obj) => {
    //   _coregateway.Authenticity.getUsernameByUserId(userid, (err, userid)=> {
    //     if(remote_callback_obj) {
    //       remote_callback_obj.run([], [err, userid]);
    //       remote_callback_obj.unbindRemote();
    //     }
    //   });
    // },

    getUserExistenceByUserId: (userid, remote_callback_obj)=>{
      _coregateway.Authenticity.getUserExistenceByUserId(userid, (err, exisitence)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, exisitence]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    getUserTokenByUserId: (username, remote_callback_obj)=>{
      _coregateway.Authenticity.getUserTokenByUsername(username, (err, token)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, token]);
          remote_callback_obj.unbindRemote();
        }
      });
    },

    getUserPrivilegeByUserId: (username, remote_callback_obj)=>{
      _coregateway.Authenticity.getUserPrivilegeByUsername(username, (err, privilege)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, privilege]);
          remote_callback_obj.unbindRemote();
        }
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
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, key]);
          remote_callback_obj.unbindRemote();
        }
      });
    },
    encryptString: (algo, key, toEncrypt, remote_callback_obj)=>{
      _coregateway.NoCrypto.encryptString(algo, key, toEncrypt, (err, enstr)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, enstr]);
          remote_callback_obj.unbindRemote();
        }
      });
    },
    decryptString: (algo, key, toDecrypt, remote_callback_obj) =>{
      _coregateway.NoCrypto.decryptString(algo, key, toDecrypt, (err, destr)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, destr]);
          remote_callback_obj.unbindRemote();
        }
      });
    }
  }

  // for sniffing data
  _api.Sniffer = {
    onRouterJSON: (remote_callback_obj)=> {
      _coregateway.Router.addJSONSniffer((err, data)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, data]);
        }
      });
    },
    onRouterRawData: (remote_callback_obj)=> {
      _coregateway.Router.addRAWSniffer((err, data)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [err, data]);
        }
      });
    },
  }

  // generate API Tree
  _api_tree = Utils.generateObjCallbacksTree(_api);
}

module.exports.geneateNormalAPI = (_coregateway, callback)=> {
  callback(false, new API(_coregateway));
};
