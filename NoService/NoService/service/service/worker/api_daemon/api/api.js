// NoService/NoService/service/worker/api_daemon/api.js
// Description:
// "api.js" provide interface of interacting with core. This module is desgined
// for multithreading.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
// All api tree's top should be callable! For worker calling.

'use strict';

const APIPrototype = require('./prototype');

function ServiceAPI() {
  let _coregateway;

  let _API_generators = [];

  let _addNormalAPIs = (api, service_socket, manifest)=> {
    let _service_name = manifest.name;
    api.addAPI(['Service', 'ServiceSocket'], (BeMirroredObject)=> {
      return ({
        def: (name, mirrored_object)=> {
          service_socket.def(name, (json, entityId, returnJSON)=> {
            let returnJSON_BeMirroredObject = new BeMirroredObject(returnJSON, (returnJSON_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnJSON(err, json_be_returned);
              });
            }, true);
            if(mirrored_object) {
              mirrored_object.run([], [json, entityId, returnJSON_BeMirroredObject]);
            }
          });
        },

        define: (name, mirrored_object)=> {
          service_socket.def(name, (json, entityId, returnJSON)=> {
            let returnJSON_BeMirroredObject = new BeMirroredObject(returnJSON, (returnJSON_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnJSON(err, json_be_returned);
              });
            }, true);
            if(mirrored_object) {
              mirrored_object.run([], [json, entityId, returnJSON_BeMirroredObject]);
            }
          });
        },

        sdef: (name, mirrored_object, mirrored_object_2)=> {
          service_socket.sdef(name, (json, entityId, returnJSON)=> {
            let returnJSON_BeMirroredObject = new BeMirroredObject(returnJSON, (returnJSON_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnJSON(err, json_be_returned);
              });
            }, true);
            if(mirrored_object) {
              mirrored_object.run([], [json, entityId, returnJSON_BeMirroredObject]);
            }
          },
          (json, entityId, returnJSON)=> {
            let returnJSON_BeMirroredObject = new BeMirroredObject(returnJSON, (returnJSON_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnJSON(err, json_be_returned);
              });
            }, true);
            if(mirrored_object_2) {
              mirrored_object_2.run([], [json, entityId, returnJSON_BeMirroredObject]);
            }
          });
        },

        sdefine: (name, mirrored_object, mirrored_object_2)=> {
          service_socket.sdef(name, (json, entityId, returnJSON)=> {
            let returnJSON_BeMirroredObject = new BeMirroredObject(returnJSON, (returnJSON_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnJSON(err, json_be_returned);
              });
            }, true);
            if(mirrored_object) {
              mirrored_object.run([], [json, entityId, returnJSON_BeMirroredObject]);
            }
          },
          (json, entityId, returnJSON)=> {
            let returnJSON_BeMirroredObject = new BeMirroredObject(returnJSON, (returnJSON_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnJSON(err, json_be_returned);
              });
            }, true);
            if(mirrored_object_2) {
              mirrored_object_2.run([], [json, entityId, returnJSON_BeMirroredObject]);
            }
          });
        },

        on: (type, mirrored_object)=> {
          if(type === 'data') {
            service_socket.on('data', (entityId, data)=> {
              if(mirrored_object) {
                mirrored_object.run([], [entityId, data]);
              }
            });
          }
          else {
            service_socket.on(type, (entityId, callback)=> {
              let callback_BeMirroredObject = new BeMirroredObject(callback, (callback_syncRefer)=> {
                return ((err)=>{
                  callback(err);
                });
              }, true);
              if(mirrored_object) {
                mirrored_object.run([], [entityId, callback_BeMirroredObject]);
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
    api.addAPI(['getMe'], (BeMirroredObject)=> {
      return((mirrored_object)=> {
        if(mirrored_object) {
          mirrored_object.run([], [false, {
            Settings: manifest.settings,
            Manifest: manifest,
            FilesPath: _coregateway.Daemon.Settings.services_files_path+'/'+manifest.name
          }])
          mirrored_object.destory();
        }
      });
    });

    let _turn_model_to_local_callback_obj = (model, BeMirroredObject)=> {
      if(!model){
        return null;
      }
      else if(model.ModelType === 'Object') {
        return(new BeMirroredObject(model, (model_syncRefer)=> {
          return ({
              getModelType: (mirrored_object)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], [err, model.ModelType]);
                  mirrored_object.destory();
                }
              },
              get: (key_value, mirrored_object)=> {
                model.get(key_value, (...args)=> {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                });
              },
              getAll: (mirrored_object)=> {
                model.getAll(key_value, (...args)=> {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                });
              },
              getWhere: (where, query_values, mirrored_object)=> {
                model.getWhere(where, query_values, (...args)=> {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                });
              },
              searchAll: (keyword, mirrored_object)=> {
                model.searchAll(keyword, (...args)=> {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                });
              },
              searchColumns: (column_list, keyword, mirrored_object)=> {
                model.searchColumns(column_list, keyword, (...args)=> {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                });
              },
              searchAllNRows: (keyword, N, mirrored_object)=> {
                model.searchAllNRows(keyword, N, (...args)=> {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                });
              },
              searchColumnsNRows: (column_list, keyword, N, mirrored_object)=> {
                model.searchColumnsNRows(column_list, keyword, N, (...args)=> {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                });
              },
              create: (properties_dict, mirrored_object)=> {
                model.create(properties_dict, (...args)=> {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                });
              },
              replace: (properties_dict, mirrored_object)=> {
                model.replace(properties_dict, (...args)=> {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                });
              },
              update: (properties_dict, mirrored_object)=> {
                model.update(properties_dict, (...args)=> {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                });
              },
              addProperties: (properties_dict, mirrored_object)=> {
                model.addProperties(properties_dict, (...args)=> {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                });
              },
              existProperty: (property_name, mirrored_object)=> {
                model.existProperty(property_name, (...args)=> {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                });
              },
              removeProperties: (properties_list, mirrored_object)=> {
                model.removeProperties(properties_list, (...args)=> {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                });
              },
              remove: ()=> {},
          });
        }));
      }
      else if(model.ModelType === 'Pair') {
        return(new BeMirroredObject(model, (model_syncRefer)=> {
          return ({
              getModelType: (mirrored_object)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], [err, model.ModelType]);
                  mirrored_object.destory();
                }
              },
              create: (properties_dict, mirrored_object)=> {
                model.create(properties_dict, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              searchAll: (keyword, mirrored_object)=> {
                model.searchAll(keyword, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              searchColumns: (column_list, keyword, mirrored_object)=> {
                model.searchColumns(column_list, keyword, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              searchAllNRows: (keyword, N, mirrored_object)=> {
                model.searchAllNRows(keyword, N, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              searchColumnsNRows: (column_list, keyword, N, mirrored_object)=> {
                model.searchColumnsNRows(column_list, keyword, N, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              getWhere: (where, query_values, mirrored_object)=> {
                model.getWhere(where, query_values, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              getAll: (mirrored_object)=> {
                model.whatever((...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              getByPair: (pair, mirrored_object)=> {
                model.getByPair(pair, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              getByBoth: (both, mirrored_object)=> {
                model.getByBoth(both, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              getByFirst: (first, mirrored_object)=> {
                model.getByFirst(first, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              getBySecond: (second, mirrored_object)=> {
                model.getBySecond(second, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              replace: (properties_dict, mirrored_object)=> {
                model.replace(properties_dict, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              update: (properties_dict, mirrored_object)=> {
                model.update(properties_dict, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              removeByPair: (pair, mirrored_object)=> {
                model.removeByPair(pair, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              removeByBoth: (both, mirrored_object)=> {
                model.removeByBoth(both, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              removeByFirst: (first, mirrored_object)=> {
                model.removeByFirst(first, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              removeBySecond: (second, mirrored_object)=> {
                model.removeBySecond(second, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              addProperties: (properties_dict, mirrored_object)=> {
                model.addProperties(properties_dict, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              existProperty: (property_name, mirrored_object)=> {
                model.existProperty(property_name, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              },
              removeProperty: (properties_list, mirrored_object)=> {
                model.removeProperty(properties_list, (...args)=> {
                  if(mirrored_object) {
                    model_syncRefer(mirrored_object);
                    mirrored_object.run([], args);
                    mirrored_object.destory();
                  }
                });
              }
          });
        }));
      }
      else if(model.ModelType === 'IndexedList') {
        return(new BeMirroredObject(model, (model_syncRefer)=> {
          return ({
            getModelType: (mirrored_object)=> {
              if(mirrored_object) {
                model_syncRefer(mirrored_object);
                mirrored_object.run([], [err, model.ModelType]);
                mirrored_object.destory();
              }
            },
            searchAll: (keyword, mirrored_object)=> {
              model.searchAll(keyword, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            searchColumns: (column_list, mirrored_object)=> {
              model.searchColumns(column_list, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            searchAllNRows: (keyword, N, mirrored_object)=> {
              model.searchAllNRows(keyword, N, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            searchColumnsNRows: (column_list, keyword, N, mirrored_object)=> {
              model.searchColumnsNRows(column_list, keyword, N, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            get: (key_value, mirrored_object)=> {
              model.get(key_value, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            getWhere: (where, query_values, mirrored_object)=> {
              model.getWhere(where, query_values, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            replaceRows: (rows, mirrored_object)=> {
              model.replaceRows(rows, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            updateRows: (rows, mirrored_object)=> {
              model.updateRows(rows, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            deleteRows: (begin, end, mirrored_object)=> {
              model.deleteRows(begin, end, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            appendRows: (rows, mirrored_object)=> {
              model.appendRows(rows, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            getLatestNRows: (n, mirrored_object)=> {
              model.getLatestNRows(n, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            getRowsFromTo: (begin, end, mirrored_object)=> {
              model.getRowsFromTo(begin, end, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            getAllRows: (mirrored_object)=> {
              model.getAllRows((...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            getLatestIndex: (mirrored_object)=> {
              model.getLatestIndex((...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            addFields: (fields_dict, mirrored_object)=> {
              model.addFields(fields_dict, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            existField: (field_name, mirrored_object)=> {
              model.existField(field_name, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            removeFields: (fields_dict, mirrored_object)=> {
              model.removeFields(fields_dict, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            }
          });
        }));
      }
      else if(model.ModelType === 'GroupIndexedList') {
        return(new BeMirroredObject(model, (model_syncRefer)=> {
          return ({
            getModelType: (mirrored_object)=> {
              if(mirrored_object) {
                model_syncRefer(mirrored_object);
                mirrored_object.run([], [err, model.ModelType]);
                mirrored_object.destory();
              }
            },
            existGroup: (group_name, mirrored_object)=> {
              model.existGroup(group_name, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            searchAll: (group_name, keyword, mirrored_object)=> {
              model.searchAll(group_name, keyword, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            searchColumns: (group_name, column_list, mirrored_object)=> {
              model.searchColumns(group_name, column_list, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            searchAllNRows: (group_name, keyword, N, mirrored_object)=> {
              model.searchAllNRows(group_name, keyword, N, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            searchColumnsNRows: (group_name, column_list, keyword, N, mirrored_object)=> {
              model.searchColumnsNRows(group_name, column_list, keyword, N, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            get: (group_name, key_value, mirrored_object)=> {
              model.get(group_name, key_value, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            getWhere: (where, query_values, mirrored_object)=> {
              model.getWhere(where, query_values, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            replaceRows: (group_name, rows, mirrored_object)=> {
              model.replaceRows(group_name, rows, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            updateRows: (group_name, rows, mirrored_object)=> {
              model.updateRows(group_name, rows, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            deleteRows: (group_name, begin, end, mirrored_object)=> {
              model.deleteRows(group_name, begin, end, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            appendRows: (group_name, rows, mirrored_object)=> {
              model.appendRows(group_name, rows, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            appendRowsAllGroup: (rows, mirrored_object)=> {
              model.appendRowsAllGroup(rows, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            getLatestNRows: (group_name, n, mirrored_object)=> {
              model.getLatestNRows(group_name, n, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            getRowsFromTo: (group_name, begin, end, mirrored_object)=> {
              model.getRowsFromTo(group_name, begin, end, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            getAllRows: (group_name, mirrored_object)=> {
              model.getAllRows(group_name, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            getLatestIndex: (group_name, mirrored_object)=> {
              model.getLatestIndex(group_name, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            addFields: (fields_dict, mirrored_object)=> {
              model.addFields(fields_dict, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            existField: (field_name, mirrored_object)=> {
              model.existField(field_name, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            },
            removeFields: (fields_dict, mirrored_object)=> {
              model.removeFields(fields_dict, (...args)=> {
                if(mirrored_object) {
                  model_syncRefer(mirrored_object);
                  mirrored_object.run([], args);
                  mirrored_object.destory();
                }
              });
            }
          });
        }));
      }

    };
    api.addAPI(['Database', 'Database'], (BeMirroredObject)=> {
      return({
        query: (query, mirrored_object)=> {
          _coregateway.Database.Database.query(query, (...args)=> {
            if(mirrored_object) {
              mirrored_object.run([], args);
              mirrored_object.destory();
            }
          });
        }
      })
    });
    api.addAPI(['Database', 'Model'], (BeMirroredObject)=> {
      return({
        remove: (model_name, mirrored_object)=> {
          _coregateway.Model.remove(_service_name+'_'+model_name, (err)=> {
            if(mirrored_object) {
              mirrored_object.run([], [err]);
              mirrored_object.destory();
            }
          });
        },

        exist: (model_name, mirrored_object)=> {
          _coregateway.Model.get(_service_name+'_'+model_name, (err, exist)=> {
            if(mirrored_object) {
              mirrored_object.run([], [err, exist]);
              mirrored_object.destory();
            }
          });
        },

        get: (model_name, mirrored_object)=> {
          _coregateway.Model.get(_service_name+'_'+model_name, (err, the_model)=> {
            if(mirrored_object) {
              mirrored_object.run([], [err, _turn_model_to_local_callback_obj(the_model, BeMirroredObject)]);
              mirrored_object.destory();
            }
          });
        },

        define: (model_name, model_structure, mirrored_object)=> {
          _coregateway.Model.define(_service_name+'_'+model_name, model_structure, (err, the_model)=> {
            if(mirrored_object) {
              mirrored_object.run([], [err, _turn_model_to_local_callback_obj(the_model, BeMirroredObject)]);
              mirrored_object.destory();
            }
          });
        },

        doBatchSetup: (models_dict, mirrored_object)=> {
          _new_model_dict = {}
          for(let model_name in models_dict) {
            _new_model_dict[_service_name+'_'+model_name] = models_dict[model_name];
          }
          _coregateway.Model.doBatchSetup(_new_model_dict, (err, models)=> {
            let local_callback_obj = new BeMirroredObject(models, (models_syncRefer)=> {
              let dict = {};
              for(let key in models) {
                dict[key] = _turn_model_to_local_callback_obj(models[key], BeMirroredObject);
              };
              return dict;
            });
            if(mirrored_object) {
              mirrored_object.run([], [err, local_callback_obj]);
              mirrored_object.destory();
            }
          })
        }
      });
      // close cannot be implemented this time compare to worker.js
    });
    api.addAPI(['Database', 'RAWModel'], (BeMirroredObject)=> {
      return({
        get: (model_name, mirrored_object)=> {
          _coregateway.Model.get(model_name, (err, the_model)=> {
            if(mirrored_object) {
              let local_callback_obj;
              local_callback_obj = new BeMirroredObject(the_model, (the_model_syncRefer)=> {
                return ({
                    getModelType: (mirrored_object_2)=> {
                      if(mirrored_object_2) {
                        the_model_syncRefer(mirrored_object_2);
                        mirrored_object_2.run([], [err, the_model.ModelType]);
                        mirrored_object_2.destory();
                      }
                    }
                })
              });
              mirrored_object.run([], [err, local_callback_obj]);
              mirrored_object.destory();
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
    APIPrototype.geneateNormalAPI(_coregateway, (err, api) => {
      _addNormalAPIs(api, service_socket, manifest);
      for(let i in _API_generators) {
        _API_generators[i](api, service_socket, manifest);
      }
      callback(false, api);
    });
  };

  // this.createServiceAPIwithImplementaion = (service_socket, manifest, callback) => {
  //   APIPrototype.geneateNormalAPI(_coregateway, (err, api) => {
  //     _addNormalAPIs(api, service_socket, manifest);
  //     for(let i in _API_generators) {
  //       _API_generators[i](api, service_socket, manifest);
  //     }
  //     api.addAPI(['getImplementationModule'], (BeMirroredObject)=> {
  //       return((mirrored_object)=> {
  //         let Implementation_BeMirroredObject = new BeMirroredObject(_coregateway.Implementation, null, false, true);
  //         if(mirrored_object) {
  //           mirrored_object.run([], [false, Implementation_BeMirroredObject]);
  //           mirrored_object.destory();
  //         }
  //       });
  //     });
  //
  //     callback(false, api);
  //   });
  // }

  this.close = () => {
    _coregateway = null;
  };
}

module.exports = ServiceAPI;
