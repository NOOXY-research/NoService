// NoService/NoService/service/worker/api_daemon/prototype.js
// Description:
// "prototype.js" provide interface of interacting with core. This module is desgined
// for multithreading.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
// All api tree's top should be callable! For worker calling.

const Utils = require('../../../../../library').Utilities;
const APIUtils = require('../../api_utilities');
const LocalCallbackTree = APIUtils.LocalCallbackTree;
const RemoteCallbackTree = APIUtils.RemoteCallbackTree;


function API(_coregateway) {
  let _clear_obj_garbage_timeout = 30000;
  // setup up remote shell service by daemon default connection
  let DEFAULT_SERVER = _coregateway.Daemon.Settings.connection.default_server;
  let DAEMONTYPE = _coregateway.Daemon.Settings.connection.servers[DEFAULT_SERVER].type;
  let DAEMONIP = _coregateway.Daemon.Settings.connection.servers[DEFAULT_SERVER].ip;
  let DAEMONPORT = _coregateway.Daemon.Settings.connection.servers[DEFAULT_SERVER].port;

  let _api = {};
  let _LocalCallbackTrees = {};
  let _emitRemoteCallback;
  let _destroyRemoteCallback;
  let _api_tree = {};

  // garbage cleaning
  setInterval(()=>{
    try {
      for(let key in _LocalCallbackTrees) {
        if(_LocalCallbackTrees[key].isReferCanceled() === false) {
          delete _LocalCallbackTrees[_id];
          _LocalCallbackTrees[key].destroy();
        }
      }
    }
    catch(e) {
      console.log(e);
    }

  }, _clear_obj_garbage_timeout);

  this.reset = ()=> {
    _LocalCallbackTrees = {};
  };

  let createLocalCallbackTree = (obj, obj_contructor, isOneTimeObj) => {
    let id = Utils.generateUniqueId();
    _LocalCallbackTrees[id] = new LocalCallbackTree(id, obj, obj_contructor, isOneTimeObj);
    return _LocalCallbackTrees[id];
  };


  this.emitAPIRq = (path, argsblob)=> {
    let args = APIUtils.decodeArgumentsFromBinary(argsblob);
    for(let i in args) {
      if(args[i] instanceof RemoteCallbackTree) {
        args[i].destroyRemoteCallback = _destroyRemoteCallback;
        args[i].emitRemoteCallback = _emitRemoteCallback;
      }
    }
    APIUtils.callObjCallback(_api, path, args);
  }

  this.emitCallbackRq = (cbtree, argsblob)=> {
    let _LocalCallbackTree = _LocalCallbackTrees[cbtree[0]];
    try {
      let args = APIUtils.decodeArgumentsFromBinary(argsblob);
      for(let i in args) {
        if(args[i] instanceof RemoteCallbackTree) {
          args[i].destroyRemoteCallback = _destroyRemoteCallback;
          args[i].emitRemoteCallback = _emitRemoteCallback;
        }
      }
      if(_LocalCallbackTree)
        _LocalCallbackTree.callCallback(cbtree[1], args);
    }
    catch(e) {
      console.log(e);
    }
  }

  this.returnLocalCallbackTreeCount = ()=> {
    return Object.keys(_LocalCallbackTrees).length;
  };

  this.returnObj = ()=> {
    return _api;
  }

  this.setRemoteCallbackEmitter = (emitter)=> {
    _emitRemoteCallback = emitter;
  };

  this.setRemoteCallbakcDestroyer = (emitter)=> {
    _destroyRemoteCallback = emitter;
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

    _target[list[list.length-1]] = construct_function(createLocalCallbackTree);
    // generate API Tree
    _api_tree = APIUtils.generateObjCallbacksTree(_api);
  }

  _api.getConstants = (callback)=> {
    callback(false, _coregateway.Constants);
  };

  let _generateASHandler = (remote_callback)=> {
    return((err, as)=> {
      let local_callback_tree = createLocalCallbackTree(as, (syncRefer)=> {
        return ({
            call: (name, data, remote_callback_2)=> {
              if(remote_callback_2&&as) {
                syncRefer(remote_callback_2);
                as.call(name, data, (err, rdata)=> {
                  remote_callback_2.apply([err, rdata]);
                  remote_callback_2.destory();
                });
              }
            },

            callBlob: (name, blob, meta, remote_callback_2)=> {
              if(remote_callback_2&&as) {
                syncRefer(remote_callback_2);
                as.callBlob(name, blob, meta, (err, rblob, rmeta)=> {
                  remote_callback_2.apply([err, rblob, rmeta]);
                  remote_callback_2.destory();
                });
              }
            },

            getEntityId: (remote_callback_2)=> {
              if(remote_callback_2&&as) {
                syncRefer(remote_callback_2);
                as.getEntityId((err, entityId)=>{
                  remote_callback_2.apply([err, entityId]);
                  remote_callback_2.destory();
                });
              }
            },

            on: (type, remote_callback_2)=> {
              if(remote_callback_2&&as) {
                syncRefer(remote_callback_2);
                as.on(type, (err, data)=>{
                  remote_callback_2.apply([err, data]);
                });
              }
            },

            onEvent: (event, remote_callback_2)=> {
              if(remote_callback_2&&as) {
                syncRefer(remote_callback_2);
                as.onEvent(event, (err, data)=>{
                  remote_callback_2.apply([err, data]);
                });
              }
            },

            onBlobEvent: (event, remote_callback_2)=> {
              if(remote_callback_2&&as) {
                syncRefer(remote_callback_2);
                as.onBlobEvent(event, (err, data, meta)=>{
                  remote_callback_2.apply([err, data, meta]);
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
      if(remote_callback) {
        remote_callback.apply([err, local_callback_tree]);
        remote_callback.destory();
      }
    })
  };

  _api.Service = {
    ActivitySocket: {
      createSocket: (method, targetip, targetport, service, owner, remote_callback) => {
        _coregateway.Activity.createActivitySocket(method, targetip, targetport, service, owner, _generateASHandler(remote_callback));
      },
      createDefaultDeamonSocket: (service, owner, remote_callback) => {
        _coregateway.Activity.createDaemonActivitySocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, service, owner, _generateASHandler(remote_callback));
      },
      createDeamonSocket: (method, targetip, targetport, service, owner, remote_callback) => {
        _coregateway.Activity.createDaemonActivitySocket(method, targetip, targetport, service, owner, _generateASHandler(remote_callback));
      },

      createAdminDeamonSocket: (method, targetip, targetport, service, remote_callback) => {
        _coregateway.Activity.createAdminDaemonActivitySocket(method, targetip, targetport, service, _generateASHandler(remote_callback));
      },

      createDefaultAdminDeamonSocket: (service, remote_callback) => {
        _coregateway.Activity.createAdminDaemonActivitySocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, service, _generateASHandler(remote_callback));
      },
    },

    Entity: {
      getFilteredEntitiesMetaData: (key, value, remote_callback) => {
        _coregateway.Entity.getFilteredEntitiesMetaData(key, value, (err, metatdata)=> {
          if(remote_callback) {
            remote_callback.apply([err, metatdata])
            remote_callback.destory();
          }
        });
      },
      getFilteredEntitiesList: (query, remote_callback) => {
        _coregateway.Entity.getFilteredEntitiesList(query, (err, list)=> {
          if(remote_callback) {
            remote_callback.apply([err, list])
            remote_callback.destory();
          }
        });
      },
      getEntityValue: (entityId, key, remote_callback) => {
        if(remote_callback) {
          remote_callback.apply([false, _coregateway.Entity.returnEntityValue(entityId, key)])
          remote_callback.destory();
        }
      },
      getEntityOwner: (entityId, remote_callback) => {
        if(remote_callback) {
          remote_callback.apply([false, _coregateway.Entity.returnEntityOwner(entityId)])
          remote_callback.destory();
        }
      },
      getEntityOwnerId: (entityId, remote_callback) => {
        if(remote_callback) {
          remote_callback.apply([false, _coregateway.Entity.returnEntityOwnerId(entityId)])
          remote_callback.destory();
        }
      },
      getEntitiesMetaData: (remote_callback) => {
        _coregateway.Entity.getEntitiesMetaData((err, metatdata)=> {
          if(remote_callback) {
            remote_callback.apply([err, metatdata])
            remote_callback.destory();
          }
        });
      },
      getEntityMetaData: (entityId, remote_callback) => {
        if(remote_callback) {
          remote_callback.apply([false, _coregateway.Entity.returnEntityMetaData(entityId)])
          remote_callback.destory();
        }
      },
      getCount: (remote_callback) => {
        if(remote_callback) {
          remote_callback.apply([false, _coregateway.Entity.returnEntitycount()])
          remote_callback.destory();
        }
      },
      getEntities: (remote_callback) => {
        _coregateway.Entity.getEntitiesMeta((err, meta)=> {
          if(remote_callback) {
            remote_callback.apply([err, meta]);
            remote_callback.destory();
          }
        });
      },
      getEntitiesId: (remote_callback) => {
        if(remote_callback) {
          remote_callback.apply([false, _coregateway.Entity.returnEntitiesId()]);
          remote_callback.destory();
        }
      },
      getEntityConnProfile: (entityId, remote_callback)=> {
        _coregateway.Entity.getEntityConnProfile(entityId, (err, conn_profile)=> {
          let local_callback_tree = createLocalCallbackTree(conn_profile, (conn_profile_syncRefer)=> {
            return ({
                getServerId: (remote_callback_2)=> {
                  if(remote_callback_2) {
                    conn_profile_syncRefer(remote_callback_2);
                    conn_profile.getServerId((err, serverid)=> {
                      if(remote_callback_2) {}
                      remote_callback_2.apply([err, serverid]);
                      remote_callback_2.destory();
                    });
                  }
                },

                getHostIP: (remote_callback_2)=> {
                  if(remote_callback_2) {
                    conn_profile_syncRefer(remote_callback_2);
                    conn_profile.getHostIP((err, hostip)=> {
                      remote_callback_2.apply([err, hostip]);
                      remote_callback_2.destory();
                    });
                  }
                },

                getHostPort: (remote_callback_2)=> {
                  if(remote_callback_2) {
                    conn_profile_syncRefer(remote_callback_2);
                    conn_profile.getHostPort((err, hostport)=> {
                      remote_callback_2.apply([err, hostport]);
                      remote_callback_2.destory();
                    });
                  }
                },

                getClientIP: (remote_callback_2)=> {
                  if(remote_callback_2) {
                    conn_profile_syncRefer(remote_callback_2);
                    conn_profile.getClientIP((err, clientip)=> {
                      remote_callback_2.apply([err, clientip]);
                      remote_callback_2.destory();
                    });
                  }
                },

                getConnMethod: (remote_callback_2)=> {
                  if(remote_callback_2) {
                    conn_profile_syncRefer(remote_callback_2);
                    conn_profile.getConnMethod((err, connMethod)=> {
                      remote_callback_2.apply([err, connMethod]);
                      remote_callback_2.destory();
                    });
                  }
                },

                getRemotePosition: (remote_callback_2)=> {
                  if(remote_callback_2) {
                    conn_profile_syncRefer(remote_callback_2);
                    conn_profile.getRemotePosition((err, remotepos)=> {
                      remote_callback_2.apply([err, remotepos]);
                      remote_callback_2.destory();
                    });
                  }
                },

                setBundle: (key, value)=> {
                  conn_profile.setBundle(key, value);
                },

                getBundle: (key, remote_callback_2)=> {
                  if(remote_callback_2) {
                    conn_profile_syncRefer(remote_callback_2);
                    conn_profile.getBundle(key, (err, bundle)=> {
                      remote_callback_2.apply([err, bundle]);
                      remote_callback_2.destory();
                    });
                  }
                },

                getGUID: (remote_callback_2)=> {
                  if(remote_callback_2) {
                    conn_profile_syncRefer(remote_callback_2);
                    conn_profile.getGUID((err, guid)=> {
                      remote_callback_2.apply([err, guid]);
                      remote_callback_2.destory();
                    });
                  }
                }
            })
          });
          if(remote_callback) {
            remote_callback.apply([err, local_callback_tree]);
            remote_callback.destory();
          }
        });
      },

      on: (type, remote_callback)=> {
        _coregateway.Entity.on(type, (entityId, entityJson)=> {
          if(remote_callback) {
            remote_callback.apply([entityId, entityJson])
          }
        });
      },

      addEntityToGroups:(entityId, grouplist, remote_callback)=> {
        _coregateway.Entity.addEntityToGroups(entityId, grouplist, (err)=> {
          if(remote_callback) {
            remote_callback.apply([err]);
            remote_callback.destory();
          }
        });
      },

      deleteEntityFromGroups:(entityId, grouplist, remote_callback)=> {
        _coregateway.Entity.deleteEntityFromGroups(entityId, grouplist, (err)=> {
          if(remote_callback) {
            remote_callback.apply([err]);
            remote_callback.destory();
          }
        });
      },

      clearAllGroupsOfEntity:(entityId, remote_callback)=> {
        _coregateway.Entity.clearAllGroupsOfEntity(entityId, (err)=> {
          if(remote_callback) {
            remote_callback.apply([err]);
            remote_callback.destory();
          }
        });
      },

      isEntityIncludingGroups:(entityId, grouplist, remote_callback)=> {
        _coregateway.Entity.isEntityIncludingGroups(entityId, grouplist, (err)=> {
          if(remote_callback) {
            remote_callback.apply([err]);
            remote_callback.destory();
          }
        });
      },

      isEntityInGroup:(entityId, grouplist, remote_callback)=> {
        _coregateway.Entity.isEntityInGroup(entityId, grouplist, (err)=> {
          if(remote_callback) {
            remote_callback.apply([err]);
            remote_callback.destory();
          }
        });
      },

      getGroupsofEntity:(entityId, remote_callback)=> {
        _coregateway.Entity.getGroupsofEntity(entityId, (err, results)=> {
          if(remote_callback) {
            remote_callback.apply([err, results]);
            remote_callback.destory();
          }
        });
      }
    },

    getList: (remote_callback) => {
      if(remote_callback) {
        remote_callback.apply([false, _coregateway.Service.returnList()]);
        remote_callback.destory();
      }
    },

    getServiceManifest: (service_name, remote_callback)=> {
      if(remote_callback) {
        remote_callback.apply([false, _coregateway.Service.returnServiceManifest(service_name)]);
        remote_callback.destory();
      }
    },

    getServicesManifest: (remote_callback)=> {
      _coregateway.Service.getServicesManifest((err, manifest)=> {
        if(remote_callback) {
          remote_callback.apply([err, manifest]);
          remote_callback.destory();
        }
      });
    },

    getServiceFunctionList: (service_name, remote_callback)=> {
      if(remote_callback) {
        remote_callback.apply([false, _coregateway.Service.returnServiceFunctionList(service_name)]);
        remote_callback.destory();
      }
    },

    getServiceFunctionDict: (service_name, remote_callback)=> {
      if(remote_callback) {
        remote_callback.apply([false, _coregateway.Service.returnServiceFunctionDict(service_name)]);
        remote_callback.destory();
      }
    },

    launch: (service_name, remote_callback)=> {
      _coregateway.Service.launchService(service_name, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    initialize: (service_name, remote_callback)=> {
      _coregateway.Service.initializeService(service_name, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    relaunch: (service_name, remote_callback)=> {
      _coregateway.Service.relaunchService(service_name, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    close: (service_name, remote_callback)=> {
      _coregateway.Service.closeService(service_name, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    isServiceLaunched: (service_name, remote_callback)=> {
      _coregateway.Service.isServiceLaunched(service_name, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    isServiceInitialized: (service_name, remote_callback)=> {
      _coregateway.Service.isServiceInitialized(service_name, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    // CBO is designed for prevent memleak
    getCBOCount: (remote_callback)=> {
      _coregateway.Service.getCBOCount((err, count)=> {
        if(remote_callback) {
          remote_callback.apply([err, count]);
          remote_callback.destory();
        }
      });
    },

    // CBO is designed for prevent memleak
    getWorkerMemoryUsage: (remote_callback)=> {
      _coregateway.Service.getWorkerMemoryUsage((err, usage)=> {
        if(remote_callback) {
          remote_callback.apply([err, usage]);
          remote_callback.destory();
        }
      });
    }
  };

  _api.Authorization = {
    Authby: {
      Token: (entityId, remote_callback) => {
        _coregateway.Authorization.Authby.Token(entityId, (err, pass)=> {
          if(remote_callback) {
            remote_callback.apply([err, pass]);
            remote_callback.destory();
          }
        });
      },
      Password: (entityId, remote_callback) => {
        _coregateway.Authorization.Authby.Password(entityId, (err, pass)=> {
          if(remote_callback) {
            remote_callback.apply([err, pass]);
            remote_callback.destory();
          }
        });
      },
      Action: (entityId, action_meta_data, callback)=> {

      },
      isSuperUserWithToken: (entityId, remote_callback) => {
        _coregateway.Authorization.Authby.isSuperUserWithToken(entityId, (err, pass)=> {
          if(remote_callback) {
            remote_callback.apply([err, pass]);
            remote_callback.destory();
          }
        });
      },
      isSuperUser: (entityId, remote_callback) => {
        _coregateway.Authorization.Authby.isSuperUser(entityId, (err, pass)=> {
          if(remote_callback) {
            remote_callback.apply([err, pass]);
            remote_callback.destory();
          }
        });
      },
      Domain: (entityId, remote_callback) => {
        _coregateway.Authorization.Authby.Domain(entityId, (err, pass)=> {
          if(remote_callback) {
            remote_callback.apply([err, pass]);
            remote_callback.destory();
          }
        });
      },
      DaemonAuthKey: (entityId, remote_callback) => {
        _coregateway.Authorization.Authby.DaemonAuthKey(entityId, (err, pass)=> {
          if(remote_callback) {
            remote_callback.apply([err, pass]);
            remote_callback.destory();
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
    getSettings: (remote_callback)=>{
      if(remote_callback) {
        remote_callback.apply([false, _coregateway.Daemon.Settings]);
        remote_callback.destory();
      }
    },

    getConstants: (remote_callback)=>{
      if(remote_callback) {
        remote_callback.apply([false, _coregateway.Daemon.Constants]);
        remote_callback.destory();
      }
    },

    close: ()=>{_coregateway.Daemon.close()},

    relaunch: ()=>{_coregateway.Daemon.relaunch()},
  };

  _api.Authenticity = {
    getUsernameByUserId: (userid, remote_callback) => {
      _coregateway.Authenticity.getUsernameByUserId(userid, (err, username)=> {
        if(remote_callback) {
          remote_callback.apply([err, username]);
          remote_callback.destory();
        }
      });
    },

    createUser: (username, displayname, password, privilege, detail, firstname, lastname, remote_callback) => {
      _coregateway.Authenticity.createUser(username, displayname, password, privilege, detail, firstname, lastname, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    deleteUserByUsername: (username, remote_callback) => {
      _coregateway.Authenticity.deleteUserByUsername(username, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    updatePasswordByUsername: (username, newpassword, remote_callback) => {
      _coregateway.Authenticity.updatePasswordByUsername(username, newpassword, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    updateTokenByUsername: (username, remote_callback) => {
      _coregateway.Authenticity.updateTokenByUsername(username, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    updatePrivilegeByUsername: (username, privilege, remote_callback) => {
      _coregateway.Authenticity.updatePrivilegeByUsername(username, privilege, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    updateNameByUsername: (username, firstname, lastname, remote_callback) => {
      _coregateway.Authenticity.updateNameByUsername(username, firstname, lastname, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    getUserMetaByUsername: (username, remote_callback) => {
      _coregateway.Authenticity.getUserMetaByUsername(username, (err, usermeta)=> {
        if(remote_callback) {
          remote_callback.apply([err, usermeta]);
          remote_callback.destory();
        }
      });
    },

    getUserIdByUsername: (username, remote_callback) => {
      _coregateway.Authenticity.getUserIdByUsername(username, (err, userid)=> {
        if(remote_callback) {
          remote_callback.apply([err, userid]);
          remote_callback.destory();
        }
      });
    },

    getUserExistenceByUsername: (username, remote_callback)=>{
      _coregateway.Authenticity.getUserExistenceByUsername(username, (err, exisitence)=> {
        if(remote_callback) {
          remote_callback.apply([err, exisitence]);
          remote_callback.destory();
        }
      });
    },

    getUserTokenByUsername: (username, remote_callback)=>{
      _coregateway.Authenticity.getUserTokenByUsername(username, (err, token)=> {
        if(remote_callback) {
          remote_callback.apply([err, token]);
          remote_callback.destory();
        }
      });
    },

    getUserPrivilegeByUsername: (username, remote_callback)=>{
      _coregateway.Authenticity.getUserPrivilegeByUsername(username, (err, privilege)=> {
        if(remote_callback) {
          remote_callback.apply([err, privilege]);
          remote_callback.destory();
        }
      });
    },

    searchUsersByUsernameNRows: (username, N, remote_callback)=>{
      _coregateway.Authenticity.searchUsersByUsernameNRows(username, N, (err, rows)=> {
        if(remote_callback) {
          remote_callback.apply([err, rows]);
          remote_callback.destory();
        }
      });
    },


    // By Id
    deleteUserByUserId: (userid, remote_callback) => {
      _coregateway.Authenticity.deleteUserByUserId(userid, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    updatePasswordByUserId: (userid, newpassword, remote_callback) => {
      _coregateway.Authenticity.updatePasswordByUserId(userid, newpassword, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    updateTokenByUserId: (userid, remote_callback) => {
      _coregateway.Authenticity.updateTokenByUserId(userid, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    updatePrivilegeByUserId: (userid, privilege, remote_callback) => {
      _coregateway.Authenticity.updatePrivilegeByUserId(userid, privilege, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    updateNameByUserId: (userid, firstname, lastname, remote_callback) => {
      _coregateway.Authenticity.updateNameByUserId(userid, firstname, lastname, (err)=> {
        if(remote_callback) {
          remote_callback.apply([err]);
          remote_callback.destory();
        }
      });
    },

    getUserMetaByUserId: (userid, remote_callback) => {
      _coregateway.Authenticity.getUserMetaByUserId(userid, (err, usermeta)=> {
        if(remote_callback) {
          remote_callback.apply([err, usermeta]);
          remote_callback.destory();
        }
      });
    },

    // getUsernameByUserId: (userid, remote_callback) => {
    //   _coregateway.Authenticity.getUsernameByUserId(userid, (err, userid)=> {
    //     if(remote_callback) {
    //       remote_callback.apply([err, userid]);
    //       remote_callback.destory();
    //     }
    //   });
    // },

    getUserExistenceByUserId: (userid, remote_callback)=>{
      _coregateway.Authenticity.getUserExistenceByUserId(userid, (err, exisitence)=> {
        if(remote_callback) {
          remote_callback.apply([err, exisitence]);
          remote_callback.destory();
        }
      });
    },

    getUserTokenByUserId: (username, remote_callback)=>{
      _coregateway.Authenticity.getUserTokenByUsername(username, (err, token)=> {
        if(remote_callback) {
          remote_callback.apply([err, token]);
          remote_callback.destory();
        }
      });
    },

    getUserPrivilegeByUserId: (username, remote_callback)=>{
      _coregateway.Authenticity.getUserPrivilegeByUsername(username, (err, privilege)=> {
        if(remote_callback) {
          remote_callback.apply([err, privilege]);
          remote_callback.destory();
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
    generateAESCBC256KeyByHash: (string1, string2, remote_callback)=>{
      _coregateway.NoCrypto.generateAESCBC256KeyByHash(string1, string2, (err, key)=> {
        if(remote_callback) {
          remote_callback.apply([err, key]);
          remote_callback.destory();
        }
      });
    },
    encryptString: (algo, key, toEncrypt, remote_callback)=>{
      _coregateway.NoCrypto.encryptString(algo, key, toEncrypt, (err, enstr)=> {
        if(remote_callback) {
          remote_callback.apply([err, enstr]);
          remote_callback.destory();
        }
      });
    },
    decryptString: (algo, key, toDecrypt, remote_callback) =>{
      _coregateway.NoCrypto.decryptString(algo, key, toDecrypt, (err, destr)=> {
        if(remote_callback) {
          remote_callback.apply([err, destr]);
          remote_callback.destory();
        }
      });
    }
  }

  // for sniffing data
  _api.Sniffer = {
    onRouterJSON: (remote_callback)=> {
      _coregateway.Router.addJSONSniffer((err, data)=> {
        if(remote_callback) {
          remote_callback.apply([err, data]);
        }
      });
    },
    onRouterRawData: (remote_callback)=> {
      _coregateway.Router.addRAWSniffer((err, data)=> {
        if(remote_callback) {
          remote_callback.apply([err, data]);
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
