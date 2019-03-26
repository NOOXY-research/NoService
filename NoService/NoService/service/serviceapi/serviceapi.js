// NoService/NoService/service/serviceapi.js
// Description:
// "serviceapi.js" provide interface of interacting with core. This module is desgined
// for multithreading.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
// All api tree's top should be callable! For worker calling.

'use strict';

const APIUtils = require('./serviceapi_utils');
function ServiceAPI() {
  let _coregateway;

  let _API_generators = [];

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
          if(type === 'data') {
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
            FilesPath: _coregateway.Daemon.Settings.services_files_path+'/'+manifest.name
          }])
          remote_callback_obj.unbindRemote();
        }
      });
    });

    let _turn_model_to_local_callback_obj = (model, LCBO)=> {
      if(!model){
        return null;
      }
      else if(model.ModelType === 'Object') {
        return(new LCBO(model, (model_syncRefer)=> {
          return ({
              getModelType: (remote_callback_obj)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], [err, model.ModelType]);
                  remote_callback_obj.unbindRemote();
                }
              },
              get: (key_value, remote_callback_obj)=> {
                model.get(key_value, (...args)=> {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                });
              },
              getAll: (remote_callback_obj)=> {
                model.getAll(key_value, (...args)=> {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                });
              },
              getWhere: (where, query_values, remote_callback_obj)=> {
                model.getWhere(where, query_values, (...args)=> {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                });
              },
              searchAll: (keyword, remote_callback_obj)=> {
                model.searchAll(keyword, (...args)=> {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                });
              },
              searchColumns: (column_list, keyword, remote_callback_obj)=> {
                model.searchColumns(column_list, keyword, (...args)=> {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                });
              },
              searchAllNRows: (keyword, N, remote_callback_obj)=> {
                model.searchAllNRows(keyword, N, (...args)=> {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                });
              },
              searchColumnsNRows: (column_list, keyword, N, remote_callback_obj)=> {
                model.searchColumnsNRows(column_list, keyword, N, (...args)=> {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                });
              },
              create: (properties_dict, remote_callback_obj)=> {
                model.create(properties_dict, (...args)=> {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                });
              },
              replace: (properties_dict, remote_callback_obj)=> {
                model.replace(properties_dict, (...args)=> {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                });
              },
              update: (properties_dict, remote_callback_obj)=> {
                model.update(properties_dict, (...args)=> {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                });
              },
              addProperties: (properties_dict, remote_callback_obj)=> {
                model.addProperties(properties_dict, (...args)=> {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                });
              },
              existProperty: (property_name, remote_callback_obj)=> {
                model.existProperty(property_name, (...args)=> {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                });
              },
              removeProperties: (properties_list, remote_callback_obj)=> {
                model.removeProperties(properties_list, (...args)=> {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                });
              },
              remove: ()=> {},
          });
        }));
      }
      else if(model.ModelType === 'Pair') {
        return(new LCBO(model, (model_syncRefer)=> {
          return ({
              getModelType: (remote_callback_obj)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], [err, model.ModelType]);
                  remote_callback_obj.unbindRemote();
                }
              },
              create: (properties_dict, remote_callback_obj)=> {
                model.create(properties_dict, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              searchAll: (keyword, remote_callback_obj)=> {
                model.searchAll(keyword, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              searchColumns: (column_list, keyword, remote_callback_obj)=> {
                model.searchColumns(column_list, keyword, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              searchAllNRows: (keyword, N, remote_callback_obj)=> {
                model.searchAllNRows(keyword, N, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              searchColumnsNRows: (column_list, keyword, N, remote_callback_obj)=> {
                model.searchColumnsNRows(column_list, keyword, N, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              getWhere: (where, query_values, remote_callback_obj)=> {
                model.getWhere(where, query_values, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              getAll: (remote_callback_obj)=> {
                model.whatever((...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              getByPair: (pair, remote_callback_obj)=> {
                model.getByPair(pair, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              getByBoth: (both, remote_callback_obj)=> {
                model.getByBoth(both, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              getByFirst: (first, remote_callback_obj)=> {
                model.getByFirst(first, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              getBySecond: (second, remote_callback_obj)=> {
                model.getBySecond(second, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              replace: (properties_dict, remote_callback_obj)=> {
                model.replace(properties_dict, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              update: (properties_dict, remote_callback_obj)=> {
                model.update(properties_dict, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              removeByPair: (pair, remote_callback_obj)=> {
                model.removeByPair(pair, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              removeByBoth: (both, remote_callback_obj)=> {
                model.removeByBoth(both, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              removeByFirst: (first, remote_callback_obj)=> {
                model.removeByFirst(first, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              removeBySecond: (second, remote_callback_obj)=> {
                model.removeBySecond(second, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              addProperties: (properties_dict, remote_callback_obj)=> {
                model.addProperties(properties_dict, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              existProperty: (property_name, remote_callback_obj)=> {
                model.existProperty(property_name, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              },
              removeProperty: (properties_list, remote_callback_obj)=> {
                model.removeProperty(properties_list, (...args)=> {
                  if(remote_callback_obj) {
                    model_syncRefer(remote_callback_obj);
                    remote_callback_obj.run([], args);
                    remote_callback_obj.unbindRemote();
                  }
                });
              }
          });
        }));
      }
      else if(model.ModelType === 'IndexedList') {
        return(new LCBO(model, (model_syncRefer)=> {
          return ({
            getModelType: (remote_callback_obj)=> {
              if(remote_callback_obj) {
                model_syncRefer(remote_callback_obj);
                remote_callback_obj.run([], [err, model.ModelType]);
                remote_callback_obj.unbindRemote();
              }
            },
            searchAll: (keyword, remote_callback_obj)=> {
              model.searchAll(keyword, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            searchColumns: (column_list, remote_callback_obj)=> {
              model.searchColumns(column_list, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            searchAllNRows: (keyword, N, remote_callback_obj)=> {
              model.searchAllNRows(keyword, N, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            searchColumnsNRows: (column_list, keyword, N, remote_callback_obj)=> {
              model.searchColumnsNRows(column_list, keyword, N, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            get: (key_value, remote_callback_obj)=> {
              model.get(key_value, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            getWhere: (where, query_values, remote_callback_obj)=> {
              model.getWhere(where, query_values, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            replaceRows: (rows, remote_callback_obj)=> {
              model.replaceRows(rows, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            updateRows: (rows, remote_callback_obj)=> {
              model.updateRows(rows, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            deleteRows: (begin, end, remote_callback_obj)=> {
              model.deleteRows(begin, end, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            appendRows: (rows, remote_callback_obj)=> {
              model.appendRows(rows, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            getLatestNRows: (n, remote_callback_obj)=> {
              model.getLatestNRows(n, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            getRowsFromTo: (begin, end, remote_callback_obj)=> {
              model.getRowsFromTo(begin, end, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            getAllRows: (remote_callback_obj)=> {
              model.getAllRows((...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            getLatestIndex: (remote_callback_obj)=> {
              model.getLatestIndex((...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            addFields: (fields_dict, remote_callback_obj)=> {
              model.addFields(fields_dict, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            existField: (field_name, remote_callback_obj)=> {
              model.existField(field_name, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            removeFields: (fields_dict, remote_callback_obj)=> {
              model.removeFields(fields_dict, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            }
          });
        }));
      }
      else if(model.ModelType === 'GroupIndexedList') {
        return(new LCBO(model, (model_syncRefer)=> {
          return ({
            getModelType: (remote_callback_obj)=> {
              if(remote_callback_obj) {
                model_syncRefer(remote_callback_obj);
                remote_callback_obj.run([], [err, model.ModelType]);
                remote_callback_obj.unbindRemote();
              }
            },
            existGroup: (group_name, remote_callback_obj)=> {
              model.existGroup(group_name, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            searchAll: (group_name, keyword, remote_callback_obj)=> {
              model.searchAll(group_name, keyword, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            searchColumns: (group_name, column_list, remote_callback_obj)=> {
              model.searchColumns(group_name, column_list, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            searchAllNRows: (group_name, keyword, N, remote_callback_obj)=> {
              model.searchAllNRows(group_name, keyword, N, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            searchColumnsNRows: (group_name, column_list, keyword, N, remote_callback_obj)=> {
              model.searchColumnsNRows(group_name, column_list, keyword, N, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            get: (group_name, key_value, remote_callback_obj)=> {
              model.get(group_name, key_value, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            getWhere: (where, query_values, remote_callback_obj)=> {
              model.getWhere(where, query_values, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            replaceRows: (group_name, rows, remote_callback_obj)=> {
              model.replaceRows(group_name, rows, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            updateRows: (group_name, rows, remote_callback_obj)=> {
              model.updateRows(group_name, rows, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            deleteRows: (group_name, begin, end, remote_callback_obj)=> {
              model.deleteRows(group_name, begin, end, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            appendRows: (group_name, rows, remote_callback_obj)=> {
              model.appendRows(group_name, rows, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            appendRowsAllGroup: (rows, remote_callback_obj)=> {
              model.appendRowsAllGroup(rows, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            getLatestNRows: (group_name, n, remote_callback_obj)=> {
              model.getLatestNRows(group_name, n, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            getRowsFromTo: (group_name, begin, end, remote_callback_obj)=> {
              model.getRowsFromTo(group_name, begin, end, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            getAllRows: (group_name, remote_callback_obj)=> {
              model.getAllRows(group_name, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            getLatestIndex: (group_name, remote_callback_obj)=> {
              model.getLatestIndex(group_name, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            addFields: (fields_dict, remote_callback_obj)=> {
              model.addFields(fields_dict, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            existField: (field_name, remote_callback_obj)=> {
              model.existField(field_name, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            },
            removeFields: (fields_dict, remote_callback_obj)=> {
              model.removeFields(fields_dict, (...args)=> {
                if(remote_callback_obj) {
                  model_syncRefer(remote_callback_obj);
                  remote_callback_obj.run([], args);
                  remote_callback_obj.unbindRemote();
                }
              });
            }
          });
        }));
      }

    };
    api.addAPI(['Database', 'Database'], (LCBO)=> {
      return({
        query: (query, remote_callback_obj)=> {
          _coregateway.Database.Database.query(query, (...args)=> {
            if(remote_callback_obj) {
              remote_callback_obj.run([], args);
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
              remote_callback_obj.run([], [err, _turn_model_to_local_callback_obj(the_model, LCBO)]);
              remote_callback_obj.unbindRemote();
            }
          });
        },

        define: (model_name, model_structure, remote_callback_obj)=> {
          _coregateway.Model.define(_service_name+'_'+model_name, model_structure, (err, the_model)=> {
            if(remote_callback_obj) {
              remote_callback_obj.run([], [err, _turn_model_to_local_callback_obj(the_model, LCBO)]);
              remote_callback_obj.unbindRemote();
            }
          });
        },

        doBatchSetup: (models_dict, remote_callback_obj)=> {
          _new_model_dict = {}
          for(let model_name in models_dict) {
            _new_model_dict[_service_name+'_'+model_name] = models_dict[model_name];
          }
          _coregateway.Model.doBatchSetup(_new_model_dict, (err, models)=> {
            let local_callback_obj = new LCBO(models, (models_syncRefer)=> {
              let dict = {};
              for(let key in models) {
                dict[key] = _turn_model_to_local_callback_obj(models[key], LCBO);
              };
              return dict;
            });
            if(remote_callback_obj) {
              remote_callback_obj.run([], [err, local_callback_obj]);
              remote_callback_obj.unbindRemote();
            }
          })
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

  // for plugins
  this.addAPIGenerator = (callback)=> {
    _API_generators.push(callback);
  };

  this.createServiceAPI = (service_socket, manifest, callback) => {
    APIUtils.geneateNormalAPI(_coregateway, (err, api) => {
      _addNormalAPIs(api, service_socket, manifest);
      for(let i in _API_generators) {
        _API_generators(api, service_socket, manifest);
      }
      callback(false, api);
    });
  };

  this.createServiceAPIwithImplementaion = (service_socket, manifest, callback) => {
    APIUtils.geneateNormalAPI(_coregateway, (err, api) => {
      _addNormalAPIs(api, service_socket, manifest);
      for(let i in _API_generators) {
        _API_generators(api, service_socket, manifest);
      }
      api.addAPI(['getImplementationModule'], (LCBO)=> {
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
