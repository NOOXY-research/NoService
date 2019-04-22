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
    api.addAPI(['Service', 'ServiceSocket'], (createLocalCallbackTree)=> {
      return ({
        def: (name, remote_callback)=> {
          service_socket.def(name, (json, entityId, returnResult)=> {
            let returnResult_LocalCallbackTree = createLocalCallbackTree(returnResult, (returnResult_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnResult(err, json_be_returned);
              });
            }, true);
            if(remote_callback) {
              remote_callback.apply([json, entityId, returnResult_LocalCallbackTree]);
            }
          });
        },

        define: (name, remote_callback)=> {
          service_socket.def(name, (json, entityId, returnResult)=> {
            let returnResult_LocalCallbackTree = createLocalCallbackTree(returnResult, (returnResult_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnResult(err, json_be_returned);
              });
            }, true);
            if(remote_callback) {
              remote_callback.apply([json, entityId, returnResult_LocalCallbackTree]);
            }
          });
        },

        sdef: (name, remote_callback, remote_callback_2)=> {
          service_socket.sdef(name, (json, entityId, returnResult)=> {
            let returnResult_LocalCallbackTree = createLocalCallbackTree(returnResult, (returnResult_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnResult(err, json_be_returned);
              });
            }, true);
            if(remote_callback) {
              remote_callback.apply([json, entityId, returnResult_LocalCallbackTree]);
            }
          },
          (json, entityId, returnResult)=> {
            let returnResult_LocalCallbackTree = createLocalCallbackTree(returnResult, (returnResult_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnResult(err, json_be_returned);
              });
            }, true);
            if(remote_callback_2) {
              remote_callback_2.apply([json, entityId, returnResult_LocalCallbackTree]);
            }
          });
        },

        sdefine: (name, remote_callback, remote_callback_2)=> {
          service_socket.sdef(name, (json, entityId, returnResult)=> {
            let returnResult_LocalCallbackTree = createLocalCallbackTree(returnResult, (returnResult_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnResult(err, json_be_returned);
              });
            }, true);
            if(remote_callback) {
              remote_callback.apply([json, entityId, returnResult_LocalCallbackTree]);
            }
          },
          (json, entityId, returnResult)=> {
            let returnResult_LocalCallbackTree = createLocalCallbackTree(returnResult, (returnResult_syncRefer)=> {
              return ((err, json_be_returned)=>{
                returnResult(err, json_be_returned);
              });
            }, true);
            if(remote_callback_2) {
              remote_callback_2.apply([json, entityId, returnResult_LocalCallbackTree]);
            }
          });
        },

        defBlob: (name, remote_callback)=> {
          service_socket.defBlob(name, (data, meta, entityId, returnResult)=> {
            let returnResult_LocalCallbackTree = createLocalCallbackTree(returnResult, (returnResult_syncRefer)=> {
              return ((err, blob_be_returned, blob_meta_be_returned)=>{
                returnResult(err, blob_be_returned, blob_meta_be_returned);
              });
            }, true);
            if(remote_callback) {
              remote_callback.apply([data, meta, entityId, returnResult_LocalCallbackTree]);
            }
          });
        },

        defineBlob: (name, remote_callback)=> {
          service_socket.defBlob(name, (data, meta, entityId, returnResult)=> {
            let returnResult_LocalCallbackTree = createLocalCallbackTree(returnResult, (returnResult_syncRefer)=> {
              return ((err, blob_be_returned, blob_meta_be_returned)=>{
                returnResult(err, blob_be_returned, blob_meta_be_returned);
              });
            }, true);
            if(remote_callback) {
              remote_callback.apply([data, meta, entityId, returnResult_LocalCallbackTree]);
            }
          });
        },

        sdefBlob: (name, remote_callback, remote_callback_2)=> {
          service_socket.sdefBlob(name, (data, meta, entityId, returnResult)=> {
            let returnResult_LocalCallbackTree = createLocalCallbackTree(returnResult, (returnResult_syncRefer)=> {
              return ((err, blob_be_returned, blob_meta_be_returned)=>{
                returnResult(err, blob_be_returned, blob_meta_be_returned);
              });
            }, true);
            if(remote_callback) {
              remote_callback.apply([data, meta, entityId, returnResult_LocalCallbackTree]);
            }
          },
          (data, meta, entityId, returnResult)=> {
            let returnResult_LocalCallbackTree = createLocalCallbackTree(returnResult, (returnResult_syncRefer)=> {
              return ((err, blob_be_returned, blob_meta_be_returned)=>{
                returnResult(err, blob_be_returned, blob_meta_be_returned);
              });
            }, true);
            if(remote_callback_2) {
              remote_callback_2.apply([data, meta, entityId, returnResult_LocalCallbackTree]);
            }
          });
        },

        sdefineBlob: (name, remote_callback, remote_callback_2)=> {
          service_socket.sdefBlob(name, (data, meta, entityId, returnResult)=> {
            let returnResult_LocalCallbackTree = createLocalCallbackTree(returnResult, (returnResult_syncRefer)=> {
              return ((err, blob_be_returned, blob_meta_be_returned)=>{
                returnResult(err, blob_be_returned, blob_meta_be_returned);
              });
            }, true);
            if(remote_callback) {
              remote_callback.apply([data, meta, entityId, returnResult_LocalCallbackTree]);
            }
          },
          (data, meta, entityId, returnResult)=> {
            let returnResult_LocalCallbackTree = createLocalCallbackTree(returnResult, (returnResult_syncRefer)=> {
              return ((err, blob_be_returned, blob_meta_be_returned)=>{
                returnResult(err, blob_be_returned, blob_meta_be_returned);
              });
            }, true);
            if(remote_callback_2) {
              remote_callback_2.apply([data, meta, entityId, returnResult_LocalCallbackTree]);
            }
          });
        },

        on: (type, remote_callback)=> {
          if(type === 'data') {
            service_socket.on('data', (entityId, data)=> {
              if(remote_callback) {
                remote_callback.apply([entityId, data]);
              }
            });
          }
          else {
            service_socket.on(type, (entityId, callback)=> {
              let callback_LocalCallbackTree = createLocalCallbackTree(callback, (callback_syncRefer)=> {
                return ((err)=>{
                  callback(err);
                });
              }, true);
              if(remote_callback) {
                remote_callback.apply([entityId, callback_LocalCallbackTree]);
              }
            });
          }
        },

        sendData: (entityId, data)=> {
          service_socket.sendData(entityId, data);
        },

        sendDataAll: (data)=> {
          service_socket.broadcastData(data);
        },

        emit: (entityId, event, data)=> {
          service_socket.emit(entityId, event, data);
        },

        semit: (entityId, event, data)=> {
          service_socket.semit(entityId, event, data);
        },

        emitBlob: (entityId, event, data, meta)=> {
          service_socket.emitBlob(entityId, event, data, meta);
        },

        semitBlob: (entityId, event, data, meta)=> {
          service_socket.semitBlob(entityId, event, data, meta);
        },

        emitAll: (event, data)=> {
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
    api.addAPI(['getMe'], (createLocalCallbackTree)=> {
      return((remote_callback)=> {
        if(remote_callback) {
          remote_callback.apply([false, {
            Settings: manifest.settings,
            Manifest: manifest,
            FilesPath: _coregateway.Daemon.Settings.services_files_path+'/'+manifest.name
          }])
          remote_callback.destory();
        }
      });
    });

    let _turn_model_to_local_callback_obj = (model, createLocalCallbackTree)=> {
      if(!model){
        return null;
      }
      else if(model.ModelType === 'Object') {
        return(createLocalCallbackTree(model, (model_syncRefer)=> {
          return ({
              getModelType: (remote_callback)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply([err, model.ModelType]);
                  remote_callback.destory();
                }
              },
              get: (key_value, remote_callback)=> {
                model.get(key_value, (...args)=> {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                });
              },
              getAll: (remote_callback)=> {
                model.getAll(key_value, (...args)=> {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                });
              },
              getWhere: (where, query_values, remote_callback)=> {
                model.getWhere(where, query_values, (...args)=> {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                });
              },
              searchAll: (keyword, remote_callback)=> {
                model.searchAll(keyword, (...args)=> {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                });
              },
              searchColumns: (column_list, keyword, remote_callback)=> {
                model.searchColumns(column_list, keyword, (...args)=> {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                });
              },
              searchAllNRows: (keyword, N, remote_callback)=> {
                model.searchAllNRows(keyword, N, (...args)=> {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                });
              },
              searchColumnsNRows: (column_list, keyword, N, remote_callback)=> {
                model.searchColumnsNRows(column_list, keyword, N, (...args)=> {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                });
              },
              create: (properties_dict, remote_callback)=> {
                model.create(properties_dict, (...args)=> {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                });
              },
              replace: (properties_dict, remote_callback)=> {
                model.replace(properties_dict, (...args)=> {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                });
              },
              update: (properties_dict, remote_callback)=> {
                model.update(properties_dict, (...args)=> {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                });
              },
              addProperties: (properties_dict, remote_callback)=> {
                model.addProperties(properties_dict, (...args)=> {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                });
              },
              existProperty: (property_name, remote_callback)=> {
                model.existProperty(property_name, (...args)=> {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                });
              },
              removeProperties: (properties_list, remote_callback)=> {
                model.removeProperties(properties_list, (...args)=> {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                });
              },
              remove: ()=> {},
          });
        }));
      }
      else if(model.ModelType === 'Pair') {
        return(createLocalCallbackTree(model, (model_syncRefer)=> {
          return ({
              getModelType: (remote_callback)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply([err, model.ModelType]);
                  remote_callback.destory();
                }
              },
              create: (properties_dict, remote_callback)=> {
                model.create(properties_dict, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              searchAll: (keyword, remote_callback)=> {
                model.searchAll(keyword, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              searchColumns: (column_list, keyword, remote_callback)=> {
                model.searchColumns(column_list, keyword, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              searchAllNRows: (keyword, N, remote_callback)=> {
                model.searchAllNRows(keyword, N, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              searchColumnsNRows: (column_list, keyword, N, remote_callback)=> {
                model.searchColumnsNRows(column_list, keyword, N, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              getWhere: (where, query_values, remote_callback)=> {
                model.getWhere(where, query_values, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              getAll: (remote_callback)=> {
                model.whatever((...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              getByPair: (pair, remote_callback)=> {
                model.getByPair(pair, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              getByBoth: (both, remote_callback)=> {
                model.getByBoth(both, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              getByFirst: (first, remote_callback)=> {
                model.getByFirst(first, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              getBySecond: (second, remote_callback)=> {
                model.getBySecond(second, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              replace: (properties_dict, remote_callback)=> {
                model.replace(properties_dict, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              update: (properties_dict, remote_callback)=> {
                model.update(properties_dict, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              removeByPair: (pair, remote_callback)=> {
                model.removeByPair(pair, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              removeByBoth: (both, remote_callback)=> {
                model.removeByBoth(both, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              removeByFirst: (first, remote_callback)=> {
                model.removeByFirst(first, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              removeBySecond: (second, remote_callback)=> {
                model.removeBySecond(second, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              addProperties: (properties_dict, remote_callback)=> {
                model.addProperties(properties_dict, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              existProperty: (property_name, remote_callback)=> {
                model.existProperty(property_name, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              },
              removeProperty: (properties_list, remote_callback)=> {
                model.removeProperty(properties_list, (...args)=> {
                  if(remote_callback) {
                    model_syncRefer(remote_callback);
                    remote_callback.apply(args);
                    remote_callback.destory();
                  }
                });
              }
          });
        }));
      }
      else if(model.ModelType === 'IndexedList') {
        return(createLocalCallbackTree(model, (model_syncRefer)=> {
          return ({
            getModelType: (remote_callback)=> {
              if(remote_callback) {
                model_syncRefer(remote_callback);
                remote_callback.apply([err, model.ModelType]);
                remote_callback.destory();
              }
            },
            searchAll: (keyword, remote_callback)=> {
              model.searchAll(keyword, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            searchColumns: (column_list, remote_callback)=> {
              model.searchColumns(column_list, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            searchAllNRows: (keyword, N, remote_callback)=> {
              model.searchAllNRows(keyword, N, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            searchColumnsNRows: (column_list, keyword, N, remote_callback)=> {
              model.searchColumnsNRows(column_list, keyword, N, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            get: (key_value, remote_callback)=> {
              model.get(key_value, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            getWhere: (where, query_values, remote_callback)=> {
              model.getWhere(where, query_values, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            replaceRows: (rows, remote_callback)=> {
              model.replaceRows(rows, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            updateRows: (rows, remote_callback)=> {
              model.updateRows(rows, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            deleteRows: (begin, end, remote_callback)=> {
              model.deleteRows(begin, end, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            appendRows: (rows, remote_callback)=> {
              model.appendRows(rows, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            getLatestNRows: (n, remote_callback)=> {
              model.getLatestNRows(n, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            getRowsFromTo: (begin, end, remote_callback)=> {
              model.getRowsFromTo(begin, end, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            getAllRows: (remote_callback)=> {
              model.getAllRows((...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            getLatestIndex: (remote_callback)=> {
              model.getLatestIndex((...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            addFields: (fields_dict, remote_callback)=> {
              model.addFields(fields_dict, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            existField: (field_name, remote_callback)=> {
              model.existField(field_name, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            removeFields: (fields_dict, remote_callback)=> {
              model.removeFields(fields_dict, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            }
          });
        }));
      }
      else if(model.ModelType === 'GroupIndexedList') {
        return(createLocalCallbackTree(model, (model_syncRefer)=> {
          return ({
            getModelType: (remote_callback)=> {
              if(remote_callback) {
                model_syncRefer(remote_callback);
                remote_callback.apply([err, model.ModelType]);
                remote_callback.destory();
              }
            },
            existGroup: (group_name, remote_callback)=> {
              model.existGroup(group_name, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            searchAll: (group_name, keyword, remote_callback)=> {
              model.searchAll(group_name, keyword, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            searchColumns: (group_name, column_list, remote_callback)=> {
              model.searchColumns(group_name, column_list, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            searchAllNRows: (group_name, keyword, N, remote_callback)=> {
              model.searchAllNRows(group_name, keyword, N, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            searchColumnsNRows: (group_name, column_list, keyword, N, remote_callback)=> {
              model.searchColumnsNRows(group_name, column_list, keyword, N, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            get: (group_name, key_value, remote_callback)=> {
              model.get(group_name, key_value, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            getWhere: (where, query_values, remote_callback)=> {
              model.getWhere(where, query_values, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            replaceRows: (group_name, rows, remote_callback)=> {
              model.replaceRows(group_name, rows, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            updateRows: (group_name, rows, remote_callback)=> {
              model.updateRows(group_name, rows, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            deleteRows: (group_name, begin, end, remote_callback)=> {
              model.deleteRows(group_name, begin, end, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            appendRows: (group_name, rows, remote_callback)=> {
              model.appendRows(group_name, rows, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            appendRowsAllGroup: (rows, remote_callback)=> {
              model.appendRowsAllGroup(rows, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            getLatestNRows: (group_name, n, remote_callback)=> {
              model.getLatestNRows(group_name, n, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            getRowsFromTo: (group_name, begin, end, remote_callback)=> {
              model.getRowsFromTo(group_name, begin, end, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            getAllRows: (group_name, remote_callback)=> {
              model.getAllRows(group_name, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            getLatestIndex: (group_name, remote_callback)=> {
              model.getLatestIndex(group_name, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            addFields: (fields_dict, remote_callback)=> {
              model.addFields(fields_dict, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            existField: (field_name, remote_callback)=> {
              model.existField(field_name, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            },
            removeFields: (fields_dict, remote_callback)=> {
              model.removeFields(fields_dict, (...args)=> {
                if(remote_callback) {
                  model_syncRefer(remote_callback);
                  remote_callback.apply(args);
                  remote_callback.destory();
                }
              });
            }
          });
        }));
      }

    };
    api.addAPI(['Database', 'Database'], (createLocalCallbackTree)=> {
      return({
        query: (query, remote_callback)=> {
          _coregateway.Database.Database.query(query, (...args)=> {
            if(remote_callback) {
              remote_callback.apply(args);
              remote_callback.destory();
            }
          });
        }
      })
    });
    api.addAPI(['Database', 'Model'], (createLocalCallbackTree)=> {
      return({
        remove: (model_name, remote_callback)=> {
          _coregateway.Model.remove(_service_name+'_'+model_name, (err)=> {
            if(remote_callback) {
              remote_callback.apply([err]);
              remote_callback.destory();
            }
          });
        },

        exist: (model_name, remote_callback)=> {
          _coregateway.Model.get(_service_name+'_'+model_name, (err, exist)=> {
            if(remote_callback) {
              remote_callback.apply([err, exist]);
              remote_callback.destory();
            }
          });
        },

        get: (model_name, remote_callback)=> {
          _coregateway.Model.get(_service_name+'_'+model_name, (err, the_model)=> {
            if(remote_callback) {
              remote_callback.apply([err, _turn_model_to_local_callback_obj(the_model, createLocalCallbackTree)]);
              remote_callback.destory();
            }
          });
        },

        define: (model_name, model_structure, remote_callback)=> {
          _coregateway.Model.define(_service_name+'_'+model_name, model_structure, (err, the_model)=> {
            if(remote_callback) {
              remote_callback.apply([err, _turn_model_to_local_callback_obj(the_model, createLocalCallbackTree)]);
              remote_callback.destory();
            }
          });
        },

        doBatchSetup: (models_dict, remote_callback)=> {
          _new_model_dict = {}
          for(let model_name in models_dict) {
            _new_model_dict[_service_name+'_'+model_name] = models_dict[model_name];
          }
          _coregateway.Model.doBatchSetup(_new_model_dict, (err, models)=> {
            let local_callback_obj = createLocalCallbackTree(models, (models_syncRefer)=> {
              let dict = {};
              for(let key in models) {
                dict[key] = _turn_model_to_local_callback_obj(models[key], createLocalCallbackTree);
              };
              return dict;
            });
            if(remote_callback) {
              remote_callback.apply([err, local_callback_obj]);
              remote_callback.destory();
            }
          })
        }
      });
      // close cannot be implemented this time compare to worker.js
    });
    api.addAPI(['Database', 'RAWModel'], (createLocalCallbackTree)=> {
      return({
        get: (model_name, remote_callback)=> {
          _coregateway.Model.get(model_name, (err, the_model)=> {
            if(remote_callback) {
              let local_callback_obj;
              local_callback_obj = createLocalCallbackTree(the_model, (the_model_syncRefer)=> {
                return ({
                    getModelType: (remote_callback_2)=> {
                      if(remote_callback_2) {
                        the_model_syncRefer(remote_callback_2);
                        remote_callback_2.apply([err, the_model.ModelType]);
                        remote_callback_2.destory();
                      }
                    }
                })
              });
              remote_callback.apply([err, local_callback_obj]);
              remote_callback.destory();
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

  this.close = () => {
    _coregateway = null;
  };
}

module.exports = ServiceAPI;
