// NoService/NoService/serviceapi.js
// Description:
// "serviceapi.js" provide interface of interacting with core. This module is desgined
// for multithreading.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
// All api tree's top should be callable! For worker calling.

'use strict';

const APIUtils = require('./serviceapi_utils');
function ServiceAPI() {
  let _coregateway = null;

  let _addNormalAPIs = (api, service_socket, manifest)=> {
    let _service_name = manifest.name;
    api.addAPI(['Service', 'ServiceSocket'], (LCBO)=> {
      return ({
        def: (name, remote_callback_obj)=> {
          service_socket.def(name, (json, entityId, returnJSON)=> {
            let returnJSON_LCBO = new LCBO(returnJSON, (returnJSON_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnJSON(err, json_be_returned);
              });
            }, true);
            if(remote_callback_obj) {
              remote_callback_obj.run([], [json, entityId, returnJSON_LCBO]);
            }
          });
        },

        define: (name, remote_callback_obj)=> {
          service_socket.def(name, (json, entityId, returnJSON)=> {
            let returnJSON_LCBO = new LCBO(returnJSON, (returnJSON_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnJSON(err, json_be_returned);
              });
            }, true);
            if(remote_callback_obj) {
              remote_callback_obj.run([], [json, entityId, returnJSON_LCBO]);
            }
          });
        },

        sdef: (name, remote_callback_obj, remote_callback_obj_2)=> {
          service_socket.sdef(name, (json, entityId, returnJSON)=> {
            let returnJSON_LCBO = new LCBO(returnJSON, (returnJSON_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnJSON(err, json_be_returned);
              });
            }, true);
            if(remote_callback_obj) {
              remote_callback_obj.run([], [json, entityId, returnJSON_LCBO]);
            }
          },
          (json, entityId, returnJSON)=> {
            let returnJSON_LCBO = new LCBO(returnJSON, (returnJSON_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnJSON(err, json_be_returned);
              });
            }, true);
            if(remote_callback_obj_2) {
              remote_callback_obj_2.run([], [json, entityId, returnJSON_LCBO]);
            }
          });
        },

        sdefine: (name, remote_callback_obj, remote_callback_obj_2)=> {
          service_socket.sdef(name, (json, entityId, returnJSON)=> {
            let returnJSON_LCBO = new LCBO(returnJSON, (returnJSON_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnJSON(err, json_be_returned);
              });
            }, true);
            if(remote_callback_obj) {
              remote_callback_obj.run([], [json, entityId, returnJSON_LCBO]);
            }
          },
          (json, entityId, returnJSON)=> {
            let returnJSON_LCBO = new LCBO(returnJSON, (returnJSON_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnJSON(err, json_be_returned);
              });
            }, true);
            if(remote_callback_obj_2) {
              remote_callback_obj_2.run([], [json, entityId, returnJSON_LCBO]);
            }
          });
        },

        on: (type, remote_callback_obj)=> {
          if(type == 'data') {
            service_socket.on('data', (entityId, data)=> {
              if(remote_callback_obj) {
                remote_callback_obj.run([], [entityId, data]);
              }
            });
          }
          else {
            service_socket.on(type, (entityId, callback)=> {
              let callback_LCBO = new LCBO(callback, (callback_syncRefer)=> {
                return ((err)=>{
                  callback(err);
                });
              }, true);
              if(remote_callback_obj) {
                remote_callback_obj.run([], [entityId, callback_LCBO]);
              }
            });
          }
        },

        sendData: (entityId, data)=> {
          service_socket.sendData(entityId, data);
        },

        broadcastData: (data)=> {
          service_socket.broadcastData(data);
        },

        emit: (entityId, event, data)=> {
          service_socket.emit(entityId, event, data);
        },

        semit: (entityId, event, data)=> {
          service_socket.semit(entityId, event, data);
        },

        broadcastEvent: (event, data)=> {
          service_socket.broadcastEvent(event, data);
        },

        emitToUsername: (username, event, data)=> {
          service_socket.emitToUsername(username, event, data);
        },

        sendDataToUsername: (username, data)=> {
          service_socket.sendDataToUsername(username, data);
        },

        emitToGroups: (groups, event, data)=> {
          service_socket.emitToGroups(groups, event, data);
        },

        sendDataToGroups: (groups, data)=> {
          service_socket.sendDataToGroups(groups, data);
        },

        emitToIncludingGroups: (groups, event, data)=> {
          service_socket.emitToIncludingGroups(groups, event, data);
        },

        sendDataToIncludingGroups: (groups, data)=> {
          service_socket.sendDataToIncludingGroups(groups, data);
        },
      })
    });
    api.addAPI(['getMe'], (LCBO)=> {
      return((remote_callback_obj)=> {
        if(remote_callback_obj) {
          remote_callback_obj.run([], [false, {
            Settings: manifest.settings,
            Manifest: manifest,
            FilesPath: _coregateway.Daemon.Settings.services_files_path+manifest.name+'/'
          }])
          remote_callback_obj.unbindRemote();
        }
      });
    });

    api.addAPI(['Database', 'Database'], (LCBO)=> {
      return({
        query: (query, remote_callback_obj)=> {
          _coregateway.Database.Database.query(query, (err, result)=> {
            if(remote_callback_obj) {
              remote_callback_obj.run([], [err, result]);
              remote_callback_obj.unbindRemote();
            }
          });
        }
      })
    });
    api.addAPI(['Database', 'Model'], (LCBO)=> {
      return({
        remove: (model_name, remote_callback_obj)=> {
          _coregateway.Model.remove(_service_name+'_'+model_name, (err)=> {
            if(remote_callback_obj) {
              remote_callback_obj.run([], [err]);
              remote_callback_obj.unbindRemote();
            }
          });
        },

        exist: (model_name, remote_callback_obj)=> {
          _coregateway.Model.get(_service_name+'_'+model_name, (err, exist)=> {
            if(remote_callback_obj) {
              remote_callback_obj.run([], [err, exist]);
              remote_callback_obj.unbindRemote();
            }
          });
        },

        get: (model_name, remote_callback_obj)=> {
          _coregateway.Model.get(_service_name+'_'+model_name, (err, the_model)=> {
            if(remote_callback_obj) {
              let local_callback_obj;
              local_callback_obj = new LCBO(the_model, (the_model_syncRefer)=> {
                return ({
                    getModelType: (remote_callback_obj_2)=> {
                      if(remote_callback_obj_2) {
                        the_model_syncRefer(remote_callback_obj_2);
                        remote_callback_obj_2.run([], [err, the_model.ModelType]);
                        remote_callback_obj_2.unbindRemote();
                      }
                    }
                })
              });
              remote_callback_obj.run([], [err, local_callback_obj]);
              remote_callback_obj.unbindRemote();
            }
          });
        },

        define: (model_name, model_structure, remote_callback_obj)=> {

        },

        doBatchSetup: (models_dict, remote_callback_obj)=> {

        }
      });
      // close cannot be implemented this time compare to worker.js
    });
    api.addAPI(['Database', 'RAWModel'], (LCBO)=> {
      return({
        get: (model_name, remote_callback_obj)=> {
          _coregateway.Model.get(model_name, (err, the_model)=> {
            if(remote_callback_obj) {
              let local_callback_obj;
              local_callback_obj = new LCBO(the_model, (the_model_syncRefer)=> {
                return ({
                    getModelType: (remote_callback_obj_2)=> {
                      if(remote_callback_obj_2) {
                        the_model_syncRefer(remote_callback_obj_2);
                        remote_callback_obj_2.run([], [err, the_model.ModelType]);
                        remote_callback_obj_2.unbindRemote();
                      }
                    }
                })
              });
              remote_callback_obj.run([], [err, local_callback_obj]);
              remote_callback_obj.unbindRemote();
            }
          });
        }
      });
      // return({
      //   return({
      //     remove:,
      //     exist:,
      //     get:,
      //     define:,
      //     getModelsDict:
      //   });
      // });
      // close cannot be implemented this time compare to worker.js
    });
  };

  // import core in order to bind realtime modules to api
  this.importCore = (coregateway) => {
    _coregateway = coregateway;
  };

  this.createServiceAPI = (service_socket, manifest, callback) => {

    APIUtils.geneateNormalAPI(_coregateway, (err, api) => {
      _addNormalAPIs(api, service_socket, manifest);
      callback(false, api);
    });
  };

  this.createServiceAPIwithImplementaion = (service_socket, manifest, callback) => {
    APIUtils.geneateNormalAPI(_coregateway, (err, api) => {
      _addNormalAPIs(api, service_socket, manifest);

      api.addAPI(['getImplementation'], (LCBO)=> {
        return((remote_callback_obj)=> {
          let Implementation_LCBO = new LCBO(_coregateway.Implementation, null, false, true);
          if(remote_callback_obj) {
            remote_callback_obj.run([], [false, Implementation_LCBO]);
            remote_callback_obj.unbindRemote();
          }
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
