// NoService/NoService/service/worker/api_daemon/prototype.js
// Description:
// "prototype.js" provide interface of interacting with core. This module is desgined
// for multithreading.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
// All api tree's top should be callable! For worker calling.

const Utils = require('../../../../../library').Utilities;
const APIUtils = require('../../api_utilities');

function API(_coregateway) {
  let _clear_obj_garbage_timeout = 30000;
  // setup up remote shell service by daemon default connection
  let DEFAULT_SERVER = _coregateway.Daemon.Settings.default_server;
  let DAEMONTYPE = _coregateway.Daemon.Settings.connection_servers[DEFAULT_SERVER].type;
  let DAEMONIP = _coregateway.Daemon.Settings.connection_servers[DEFAULT_SERVER].ip;
  let DAEMONPORT = _coregateway.Daemon.Settings.connection_servers[DEFAULT_SERVER].port;

  let _api = {};
  let _BeMirroredObjects = {};
  let _emitRemoteCallback;
  let _emitRemoteUnbind;
  let _api_tree = {};

  // garbage cleaning
  setInterval(()=>{
    try {
      for(let key in _BeMirroredObjects) {
        if(_BeMirroredObjects[key].isReferCanceled() === false) {
          _BeMirroredObjects[key].destroy();
        }
      }
    }
    catch(e) {
      console.log(e);
    }

  }, _clear_obj_garbage_timeout);

  this.reset = ()=> {
    _BeMirroredObjects = [];
  };
  // Local callback object
  function BeMirroredObject(obj, obj_contructor, isOneTimeObj, isNastyCallback) {
    let _MirroredObjects = [];
    let _id = Utils.generateUniqueId();
    _BeMirroredObjects[_id] = this;

    let _syncRefer = (MyMirroredObject)=> {
      _MirroredObjects.push(MyMirroredObject);
    }

    let _obj = obj;
    let _callbacks;
    if(obj_contructor)
      _callbacks = obj_contructor(_syncRefer);

    this.isBeMirroredObject = true;

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
      delete _BeMirroredObjects[_id];
      for(let id in _MirroredObjects) {
        _MirroredObjects[id].destory();
        delete _MirroredObjects[id];
      }
      obj = null;
      _obj = null;
    };

    this.callCallback = (path, args, arg_objs_trees)=>{
      try {
        if(isNastyCallback) {
          APIUtils.callObjCallback(obj, path, args, arg_objs_trees, ([r_obj_id, r_path], r_args)=> {
            let _args_objs = {};
            for(let i in r_args) {
              if(APIUtils.hasFunction(r_args[i])) {
                let _arg_BeMirroredObject = new BeMirroredObject(r_args[i], null, false, true);
                _BeMirroredObjects[_arg_BeMirroredObject.returnId()] = _arg_BeMirroredObject;
                r_args[i] = null;
                // console.log(Object.keys(_local_obj_callbacks_dict).length);
                _args_objs[i] = _arg_BeMirroredObject.returnTree();
              }
            }
            _emitRemoteCallback([r_obj_id, r_path], r_args, _args_objs);
          }, APIUtils.generateObjCallbacks);
        }
        else {
          APIUtils.callObjCallback(_callbacks, path, args, arg_objs_trees, null,
          (remoteobjid, remoteobjtree)=>{
              return(new MirroredObject(remoteobjid, remoteobjtree));
          });
        }
      }
      catch(e) {
        Utils.TagLog('*ERR*', 'BeMirroredObject occured error.');
        console.log(e);
        Utils.TagLog('*ERR*', 'BeMirroredObject detail.');
        Utils.TagLog('*ERR*', 'Object: ');
        console.log(obj);
        Utils.TagLog('*ERR*', 'Tree: ');
        console.log(APIUtils.generateObjCallbacksTree(obj));
        Utils.TagLog('*ERR*', 'Arguments: ');
        console.log(path, args, arg_objs_trees);
      }
      if(isOneTimeObj) {
        this.destroy();
      }
    }

    this.returnTree = ()=> {
      if(isNastyCallback) {
        return [_id, APIUtils.generateObjCallbacksTree(obj)];
      }
      else {
        return [_id, APIUtils.generateObjCallbacksTree(_callbacks)];
      }

    }
  };

  // Remote callback object
  function MirroredObject(obj_id, obj_tree) {
    // let _My_BeMirroredObjects = [];
    //
    // this.syncRefer = (MyBeMirroredObject)=> {
    //   _My_BeMirroredObjects.push(MyBeMirroredObject);
    // };

    this.run = (path, args)=> {
      let _runable = APIUtils.generateObjCallbacks(obj_id, obj_tree, ([obj_id, path], args)=> {
        let _arg_objs_trees = {};
        for(let i in args) {
          if(args[i]) {
            if(args[i].isBeMirroredObject) {
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

    this.destory = ()=> {
      _emitRemoteUnbind(obj_id);
    };
  }

  this.emitAPIRq = (path, args, argsobj)=> {
    APIUtils.callObjCallback(_api, path, args, argsobj, null,
    (remoteobjid, remoteobjtree)=>{
      return(new MirroredObject(remoteobjid, remoteobjtree));
    });
  }

  this.returnBeMirroredObjectCount = ()=> {
    return Object.keys(_BeMirroredObjects).length;
  };

  this.emitCallbackRq = ([id, path], args, argsobj)=> {
    let _BeMirroredObject = _BeMirroredObjects[id];
    if(_BeMirroredObject)
      _BeMirroredObject.callCallback(path, args, argsobj);
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

    _target[list[list.length-1]] = construct_function(BeMirroredObject);
    // generate API Tree
    _api_tree = APIUtils.generateObjCallbacksTree(_api);
  }

  _api.getVariables = (callback)=> {
    callback(false, _coregateway.Variables);
  };

  _api.Service = {
    ActivitySocket: {
      createSocket: (method, targetip, targetport, service, owner, mirrored_object) => {
        _coregateway.Activity.createActivitySocket(method, targetip, targetport, service, owner, (err, as)=> {
          let be_mirrored_object = new BeMirroredObject(as, (syncRefer)=> {
            return ({
                call: (name, Json, mirrored_object_2)=> {
                  if(mirrored_object_2) {
                    syncRefer(mirrored_object_2&&as);
                    as.call(name, Json, (err, json)=> {
                      if(mirrored_object_2) {}
                      mirrored_object_2.run([], [err, json]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                getEntityId: (mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.getEntityId((err, entityId)=>{
                      mirrored_object_2.run([], [err, entityId]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                on: (type, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.on(type, (err, data)=>{
                      mirrored_object_2.run([], [err, data]);
                    });
                  }
                },

                onEvent: (event, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.onEvent(event, (err, data)=>{
                      mirrored_object_2.run([], [err, data]);
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
          if(mirrored_object) {
            mirrored_object.run([], [err, be_mirrored_object]);
            mirrored_object.destory();
          }
        });
      },
      createDefaultDeamonSocket: (service, owner, mirrored_object) => {
        _coregateway.Activity.createDaemonActivitySocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, service, owner, (err, as)=> {
          let be_mirrored_object = new BeMirroredObject(as, (syncRefer)=> {
            return ({
                call: (name, Json, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.call(name, Json, (err, json)=> {
                      mirrored_object_2.run([], [err, json]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                getEntityId: (mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.getEntityId((err, entityId)=>{
                      mirrored_object_2.run([], [err, entityId]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                on: (type, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.on(type, (err, data)=>{
                      mirrored_object_2.run([], [err, data]);
                    });
                  }
                },

                onEvent: (event, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.onEvent(event, (err, data)=>{
                      mirrored_object_2.run([], [err, data]);
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
          if(mirrored_object) {
            mirrored_object.run([], [err, be_mirrored_object]);
            mirrored_object.destory();
          }
        });
      },
      createDeamonSocket: (method, targetip, targetport, service, owner, mirrored_object) => {
        _coregateway.Activity.createDaemonActivitySocket(method, targetip, targetport, service, owner, (err, as)=> {
          let be_mirrored_object = new BeMirroredObject(as, (syncRefer)=> {
            return ({
                call: (name, Json, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.call(name, Json, (err, json)=> {
                      mirrored_object_2.run([], [err, json]);
                      mirrored_object_2.destory();
                    });
                  }

                },

                getEntityId: (mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.getEntityId((err, entityId)=>{
                      mirrored_object_2.run([], [err, entityId]);
                      mirrored_object_2.destory();
                    });
                  }

                },

                on: (type, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.on(type, (err, data)=>{
                      mirrored_object_2.run([], [err, data]);
                    });
                  }
                },

                onEvent: (event, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.onEvent(event, (err, data)=>{
                      mirrored_object_2.run([], [err, data]);
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
          if(mirrored_object) {
            mirrored_object.run([], [err, be_mirrored_object]);
            mirrored_object.destory();
          }
        });
      },
      createAdminDeamonSocket: (method, targetip, targetport, service, mirrored_object) => {
        _coregateway.Activity.createAdminDaemonActivitySocket(method, targetip, targetport, service, (err, as)=> {
          let be_mirrored_object = new BeMirroredObject(as, (syncRefer)=> {
            return ({
                call: (name, Json, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.call(name, Json, (err, json)=> {
                      mirrored_object_2.run([], [err, json]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                getEntityId: (mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.getEntityId((err, entityId)=>{
                      mirrored_object_2.run([], [err, entityId]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                on: (type, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.on(type, (err, data)=>{
                      mirrored_object_2.run([], [err, data]);
                    });
                  }
                },

                onEvent: (event, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.onEvent(event, (err, data)=>{
                      mirrored_object_2.run([], [err, data]);
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
          if(mirrored_object) {
            mirrored_object.run([], [err, be_mirrored_object]);
            mirrored_object.destory();
          }
        });
      },

      createDefaultAdminDeamonSocket: (service, mirrored_object) => {
        _coregateway.Activity.createAdminDaemonActivitySocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, service, (err, as)=> {
          let be_mirrored_object = new BeMirroredObject(as, (syncRefer)=> {
            return ({
                call: (name, Json, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.call(name, Json, (err, json)=> {
                      mirrored_object_2.run([], [err, json]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                getEntityId: (mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.getEntityId((err, entityId)=>{
                      mirrored_object_2.run([], [err, entityId]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                on: (type, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.on(type, (err, data)=>{
                      mirrored_object_2.run([], [err, data]);
                    });
                  }
                },

                onEvent: (event, mirrored_object_2)=> {
                  if(mirrored_object_2&&as) {
                    syncRefer(mirrored_object_2);
                    as.onEvent(event, (err, data)=>{
                      mirrored_object_2.run([], [err, data]);
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
          if(mirrored_object) {
            mirrored_object.run([], [err, be_mirrored_object]);
            mirrored_object.destory();
          }
        });
      },
    },

    Entity: {
      getFilteredEntitiesMetaData: (key, value, mirrored_object) => {
        _coregateway.Entity.getFilteredEntitiesMetaData(key, value, (err, metatdata)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err, metatdata])
            mirrored_object.destory();
          }
        });
      },
      getFilteredEntitiesList: (query, mirrored_object) => {
        _coregateway.Entity.getFilteredEntitiesList(query, (err, list)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err, list])
            mirrored_object.destory();
          }
        });
      },
      getEntityValue: (entityId, key, mirrored_object) => {
        if(mirrored_object) {
          mirrored_object.run([], [false, _coregateway.Entity.returnEntityValue(entityId, key)])
          mirrored_object.destory();
        }
      },
      getEntityOwner: (entityId, mirrored_object) => {
        if(mirrored_object) {
          mirrored_object.run([], [false, _coregateway.Entity.returnEntityOwner(entityId)])
          mirrored_object.destory();
        }
      },
      getEntityOwnerId: (entityId, mirrored_object) => {
        if(mirrored_object) {
          mirrored_object.run([], [false, _coregateway.Entity.returnEntityOwnerId(entityId)])
          mirrored_object.destory();
        }
      },
      getEntitiesMetaData: (mirrored_object) => {
        _coregateway.Entity.getEntitiesMeta((err, metatdata)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err, metatdata])
            mirrored_object.destory();
          }
        });
      },
      getEntityMetaData: (entityId, mirrored_object) => {
        if(mirrored_object) {
          mirrored_object.run([], [false, _coregateway.Entity.returnEntityMetaData(entityId)])
          mirrored_object.destory();
        }
      },
      getCount: (mirrored_object) => {
        if(mirrored_object) {
          mirrored_object.run([], [false, _coregateway.Entity.returnEntitycount()])
          mirrored_object.destory();
        }
      },
      getEntities: (mirrored_object) => {
        _coregateway.Entity.getEntitiesMeta((err, meta)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err, meta]);
            mirrored_object.destory();
          }
        });
      },
      getEntitiesId: (mirrored_object) => {
        if(mirrored_object) {
          mirrored_object.run([], [false, _coregateway.Entity.returnEntitiesId()]);
          mirrored_object.destory();
        }
      },
      getEntityConnProfile: (entityId, mirrored_object)=> {
        _coregateway.Entity.getEntityConnProfile(entityId, (err, conn_profile)=> {
          let be_mirrored_object = new BeMirroredObject(conn_profile, (conn_profile_syncRefer)=> {
            return ({
                getServerId: (mirrored_object_2)=> {
                  if(mirrored_object_2) {
                    conn_profile_syncRefer(mirrored_object_2);
                    conn_profile.getServerId((err, serverid)=> {
                      if(mirrored_object_2) {}
                      mirrored_object_2.run([], [err, serverid]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                getHostIP: (mirrored_object_2)=> {
                  if(mirrored_object_2) {
                    conn_profile_syncRefer(mirrored_object_2);
                    conn_profile.getHostIP((err, hostip)=> {
                      mirrored_object_2.run([], [err, hostip]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                getHostPort: (mirrored_object_2)=> {
                  if(mirrored_object_2) {
                    conn_profile_syncRefer(mirrored_object_2);
                    conn_profile.getHostPort((err, hostport)=> {
                      mirrored_object_2.run([], [err, hostport]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                getClientIP: (mirrored_object_2)=> {
                  if(mirrored_object_2) {
                    conn_profile_syncRefer(mirrored_object_2);
                    conn_profile.getClientIP((err, clientip)=> {
                      mirrored_object_2.run([], [err, clientip]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                getConnMethod: (mirrored_object_2)=> {
                  if(mirrored_object_2) {
                    conn_profile_syncRefer(mirrored_object_2);
                    conn_profile.getConnMethod((err, connMethod)=> {
                      mirrored_object_2.run([], [err, connMethod]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                getRemotePosition: (mirrored_object_2)=> {
                  if(mirrored_object_2) {
                    conn_profile_syncRefer(mirrored_object_2);
                    conn_profile.getRemotePosition((err, remotepos)=> {
                      mirrored_object_2.run([], [err, remotepos]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                setBundle: (key, value)=> {
                  conn_profile.setBundle(key, value);
                },

                getBundle: (key, mirrored_object_2)=> {
                  if(mirrored_object_2) {
                    conn_profile_syncRefer(mirrored_object_2);
                    conn_profile.getBundle(key, (err, bundle)=> {
                      mirrored_object_2.run([], [err, bundle]);
                      mirrored_object_2.destory();
                    });
                  }
                },

                getGUID: (mirrored_object_2)=> {
                  if(mirrored_object_2) {
                    conn_profile_syncRefer(mirrored_object_2);
                    conn_profile.getGUID((err, guid)=> {
                      mirrored_object_2.run([], [err, guid]);
                      mirrored_object_2.destory();
                    });
                  }
                }
            })
          });
          if(mirrored_object) {
            mirrored_object.run([], [err, be_mirrored_object]);
            mirrored_object.destory();
          }
        });
      },

      on: (type, mirrored_object)=> {
        _coregateway.Entity.on(type, (entityId, entityJson)=> {
          if(mirrored_object) {
            mirrored_object.run([], [entityId, entityJson])
          }
        });
      },

      addEntityToGroups:(entityId, grouplist, mirrored_object)=> {
        _coregateway.Entity.addEntityToGroups(entityId, grouplist, (err)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err]);
            mirrored_object.destory();
          }
        });
      },

      deleteEntityFromGroups:(entityId, grouplist, mirrored_object)=> {
        _coregateway.Entity.deleteEntityFromGroups(entityId, grouplist, (err)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err]);
            mirrored_object.destory();
          }
        });
      },

      clearAllGroupsOfEntity:(entityId, mirrored_object)=> {
        _coregateway.Entity.clearAllGroupsOfEntity(entityId, (err)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err]);
            mirrored_object.destory();
          }
        });
      },

      isEntityIncludingGroups:(entityId, grouplist, mirrored_object)=> {
        _coregateway.Entity.isEntityIncludingGroups(entityId, grouplist, (err)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err]);
            mirrored_object.destory();
          }
        });
      },

      isEntityInGroup:(entityId, grouplist, mirrored_object)=> {
        _coregateway.Entity.isEntityInGroup(entityId, grouplist, (err)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err]);
            mirrored_object.destory();
          }
        });
      },

      getGroupsofEntity:(entityId, mirrored_object)=> {
        _coregateway.Entity.getGroupsofEntity(entityId, (err, results)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err, results]);
            mirrored_object.destory();
          }
        });
      }
    },

    getList: (mirrored_object) => {
      if(mirrored_object) {
        mirrored_object.run([], [false, _coregateway.Service.returnList()]);
        mirrored_object.destory();
      }
    },

    getServiceManifest: (service_name, mirrored_object)=> {
      if(mirrored_object) {
        mirrored_object.run([], [false, _coregateway.Service.returnServiceManifest(service_name)]);
        mirrored_object.destory();
      }
    },

    getServicesManifest: (mirrored_object)=> {
      _coregateway.Service.getServicesManifest((err, manifest)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, manifest]);
          mirrored_object.destory();
        }
      });
    },

    getServiceFunctionList: (service_name, mirrored_object)=> {
      if(mirrored_object) {
        mirrored_object.run([], [false, _coregateway.Service.returnServiceFunctionList(service_name)]);
        mirrored_object.destory();
      }
    },

    getServiceFunctionDict: (service_name, mirrored_object)=> {
      if(mirrored_object) {
        mirrored_object.run([], [false, _coregateway.Service.returnServiceFunctionDict(service_name)]);
        mirrored_object.destory();
      }
    },

    launch: (service_name, mirrored_object)=> {
      _coregateway.Service.launchService(service_name, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    initialize: (service_name, mirrored_object)=> {
      _coregateway.Service.initializeService(service_name, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    relaunch: (service_name, mirrored_object)=> {
      _coregateway.Service.relaunchService(service_name, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    close: (service_name, mirrored_object)=> {
      _coregateway.Service.closeService(service_name, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    isServiceLaunched: (service_name, mirrored_object)=> {
      _coregateway.Service.isServiceLaunched(service_name, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    isServiceInitialized: (service_name, mirrored_object)=> {
      _coregateway.Service.isServiceInitialized(service_name, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    // CBO is designed for prevent memleak
    getCBOCount: (mirrored_object)=> {
      _coregateway.Service.getCBOCount((err, count)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, count]);
          mirrored_object.destory();
        }
      });
    },

    // CBO is designed for prevent memleak
    getWorkerMemoryUsage: (mirrored_object)=> {
      _coregateway.Service.getWorkerMemoryUsage((err, usage)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, usage]);
          mirrored_object.destory();
        }
      });
    }
  };

  _api.Authorization = {
    Authby: {
      Token: (entityId, mirrored_object) => {
        _coregateway.Authorization.Authby.Token(entityId, (err, pass)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err, pass]);
            mirrored_object.destory();
          }
        });
      },
      Password: (entityId, mirrored_object) => {
        _coregateway.Authorization.Authby.Password(entityId, (err, pass)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err, pass]);
            mirrored_object.destory();
          }
        });
      },
      Action: (entityId, action_meta_data, callback)=> {

      },
      isSuperUser: (entityId, mirrored_object) => {
        _coregateway.Authorization.Authby.isSuperUser(entityId, (err, pass)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err, pass]);
            mirrored_object.destory();
          }
        });
      },
      Domain: (entityId, mirrored_object) => {
        _coregateway.Authorization.Authby.Domain(entityId, (err, pass)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err, pass]);
            mirrored_object.destory();
          }
        });
      },
      DaemonAuthKey: (entityId, mirrored_object) => {
        _coregateway.Authorization.Authby.DaemonAuthKey(entityId, (err, pass)=> {
          if(mirrored_object) {
            mirrored_object.run([], [err, pass]);
            mirrored_object.destory();
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
    getSettings: (mirrored_object)=>{
      if(mirrored_object) {
        mirrored_object.run([], [false, _coregateway.Daemon.Settings]);
        mirrored_object.destory();
      }
    },

    getVariables: (mirrored_object)=>{
      if(mirrored_object) {
        mirrored_object.run([], [false, _coregateway.Daemon.Variables]);
        mirrored_object.destory();
      }
    },

    close: ()=>{_coregateway.Daemon.close()},

    relaunch: ()=>{_coregateway.Daemon.relaunch()},
  };

  _api.Authenticity = {
    getUsernameByUserId: (userid, mirrored_object) => {
      _coregateway.Authenticity.getUsernameByUserId(userid, (err, username)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, username]);
          mirrored_object.destory();
        }
      });
    },

    createUser: (username, displayname, password, privilege, detail, firstname, lastname, mirrored_object) => {
      _coregateway.Authenticity.createUser(username, displayname, password, privilege, detail, firstname, lastname, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    deleteUserByUsername: (username, mirrored_object) => {
      _coregateway.Authenticity.deleteUserByUsername(username, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    updatePasswordByUsername: (username, newpassword, mirrored_object) => {
      _coregateway.Authenticity.updatePasswordByUsername(username, newpassword, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    updateTokenByUsername: (username, mirrored_object) => {
      _coregateway.Authenticity.updateTokenByUsername(username, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    updatePrivilegeByUsername: (username, privilege, mirrored_object) => {
      _coregateway.Authenticity.updatePrivilegeByUsername(username, privilege, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    updateNameByUsername: (username, firstname, lastname, mirrored_object) => {
      _coregateway.Authenticity.updateNameByUsername(username, firstname, lastname, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    getUserMetaByUsername: (username, mirrored_object) => {
      _coregateway.Authenticity.getUserMetaByUsername(username, (err, usermeta)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, usermeta]);
          mirrored_object.destory();
        }
      });
    },

    getUserIdByUsername: (username, mirrored_object) => {
      _coregateway.Authenticity.getUserIdByUsername(username, (err, userid)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, userid]);
          mirrored_object.destory();
        }
      });
    },

    getUserExistenceByUsername: (username, mirrored_object)=>{
      _coregateway.Authenticity.getUserExistenceByUsername(username, (err, exisitence)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, exisitence]);
          mirrored_object.destory();
        }
      });
    },

    getUserTokenByUsername: (username, mirrored_object)=>{
      _coregateway.Authenticity.getUserTokenByUsername(username, (err, token)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, token]);
          mirrored_object.destory();
        }
      });
    },

    getUserPrivilegeByUsername: (username, mirrored_object)=>{
      _coregateway.Authenticity.getUserPrivilegeByUsername(username, (err, privilege)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, privilege]);
          mirrored_object.destory();
        }
      });
    },

    searchUsersByUsernameNRows: (username, N, mirrored_object)=>{
      _coregateway.Authenticity.searchUsersByUsernameNRows(username, N, (err, rows)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, rows]);
          mirrored_object.destory();
        }
      });
    },


    // By Id
    deleteUserByUserId: (userid, mirrored_object) => {
      _coregateway.Authenticity.deleteUserByUserId(userid, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    updatePasswordByUserId: (userid, newpassword, mirrored_object) => {
      _coregateway.Authenticity.updatePasswordByUserId(userid, newpassword, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    updateTokenByUserId: (userid, mirrored_object) => {
      _coregateway.Authenticity.updateTokenByUserId(userid, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    updatePrivilegeByUserId: (userid, privilege, mirrored_object) => {
      _coregateway.Authenticity.updatePrivilegeByUserId(userid, privilege, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    updateNameByUserId: (userid, firstname, lastname, mirrored_object) => {
      _coregateway.Authenticity.updateNameByUserId(userid, firstname, lastname, (err)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err]);
          mirrored_object.destory();
        }
      });
    },

    getUserMetaByUserId: (userid, mirrored_object) => {
      _coregateway.Authenticity.getUserMetaByUserId(userid, (err, usermeta)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, usermeta]);
          mirrored_object.destory();
        }
      });
    },

    // getUsernameByUserId: (userid, mirrored_object) => {
    //   _coregateway.Authenticity.getUsernameByUserId(userid, (err, userid)=> {
    //     if(mirrored_object) {
    //       mirrored_object.run([], [err, userid]);
    //       mirrored_object.destory();
    //     }
    //   });
    // },

    getUserExistenceByUserId: (userid, mirrored_object)=>{
      _coregateway.Authenticity.getUserExistenceByUserId(userid, (err, exisitence)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, exisitence]);
          mirrored_object.destory();
        }
      });
    },

    getUserTokenByUserId: (username, mirrored_object)=>{
      _coregateway.Authenticity.getUserTokenByUsername(username, (err, token)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, token]);
          mirrored_object.destory();
        }
      });
    },

    getUserPrivilegeByUserId: (username, mirrored_object)=>{
      _coregateway.Authenticity.getUserPrivilegeByUsername(username, (err, privilege)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, privilege]);
          mirrored_object.destory();
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
    generateAESCBC256KeyByHash: (string1, string2, mirrored_object)=>{
      _coregateway.NoCrypto.generateAESCBC256KeyByHash(string1, string2, (err, key)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, key]);
          mirrored_object.destory();
        }
      });
    },
    encryptString: (algo, key, toEncrypt, mirrored_object)=>{
      _coregateway.NoCrypto.encryptString(algo, key, toEncrypt, (err, enstr)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, enstr]);
          mirrored_object.destory();
        }
      });
    },
    decryptString: (algo, key, toDecrypt, mirrored_object) =>{
      _coregateway.NoCrypto.decryptString(algo, key, toDecrypt, (err, destr)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, destr]);
          mirrored_object.destory();
        }
      });
    }
  }

  // for sniffing data
  _api.Sniffer = {
    onRouterJSON: (mirrored_object)=> {
      _coregateway.Router.addJSONSniffer((err, data)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, data]);
        }
      });
    },
    onRouterRawData: (mirrored_object)=> {
      _coregateway.Router.addRAWSniffer((err, data)=> {
        if(mirrored_object) {
          mirrored_object.run([], [err, data]);
        }
      });
    },
  }

  // generate API Tree
  _api_tree = APIUtils.generateObjCallbacksTree(_api);
}

module.exports.geneateNormalAPI = (_coregateway, callback)=> {
  callback(false, new API(_coregateway));
};
