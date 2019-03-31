// NoService/NoService/service/worker.js
// Description:
// "worker.js" is service worker client for NOOXY service framework.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

// NOOXY Service WorkerDaemon protocol
// message.t
// 0 worker established {t, a: api tree, p: service module path, c: closetimeout}
// 1 launch
// 2 callback {t, p: [obj_id, callback_path], a: arguments, o:{arg_index, [obj_id, callback_tree]}}
// 3 unbindobj {t, i: id};
// 4 getLCBOcount {t, i}
// 5 getMemoryUsage
// 99 close
'use strict';

const Library = require('../../../../../library');
const Utils = Library.Utilities;
const APIUtils = require('../../api_utilities');
// For injecting database to api
const Database = require('../../../../../database').Database;
const Model = require('../../../../../database').Model;
const fs = require('fs');

process.title = 'NoService_worker';

function WorkerClient() {
  try {
    let _local_obj_callbacks_dict = {};
    let _service_module;
    let _api;
    let _clear_obj_garbage_timeout = 3000;
    let _close_timeout = 1000;
    let _service_name = 'NOOXY Service';
    let _closed = false;

    let createLocalObjCallbacks = (obj)=> {
      let _Id = Utils.generateUniqueId();
      _local_callbacks[_Id] = obj;
      return _Id;
    };

    let onLocalCallback = (Id, args)=> {
      _local_callbacks[Id].apply(null, args);
      delete _local_callbacks[Id];
    };

    let callRemoteObjCallback = ()=> {

    };

    const callParentAPI = ([id, APIpath], args) => {
      let _data = {
        t: 4,
        p: APIpath,
        a: args,
        o: {}
      };
      for(let i in args) {
        if(APIUtils.hasFunction(args[i])) {
          let _Id = Utils.generateUniqueId();
          _local_obj_callbacks_dict[_Id] = args[i];
          // console.log(Object.keys(_local_obj_callbacks_dict).length);
          _data.o[i] = [_Id, APIUtils.generateObjCallbacksTree(args[i])];
        }
      }
      process.send(_data);
    }

    this.emitParentCallback = ([obj_id, path], args) => {
      let _data = {
        t: 5,
        p: [obj_id, path],
        a: args,
        o: {}
      }

      for(let i in args) {
        if(APIUtils.hasFunction(args[i])) {
          let _Id = Utils.generateUniqueId();
          _local_obj_callbacks_dict[_Id] = args[i];
          // console.log(Object.keys(_local_obj_callbacks_dict).length);

          _data.o[i] = [_Id, APIUtils.generateObjCallbacksTree(args[i])];
        }
      }
      process.send(_data);
    }

    process.on('message', message => {
      this.onMessage(message);
    });

    this.onMessage = (message)=>{
      // init worker
      if(message.t === 0) {
        _service_name = /.*\/([^\/]*)\/entry/g.exec(message.p)[1];
        process.title = 'NoService_worker: '+_service_name;
        _close_timeout = message.c;
        _clear_obj_garbage_timeout = message.g;
        _api = APIUtils.generateObjCallbacks('API', message.a, callParentAPI);
        _api.getMe((err, Me)=>{
          // add api
          _api.SafeCallback = (callback) => {
            return (...args) => {
              try {
                callback.apply(null, args);
              }
              catch (err) {
                Utils.TagLog('*ERR*', 'Service API occured error. Please restart daemon.');
                console.log(err);
              }
            }
          };

          _api.Utils = Utils;
          // setting up database
          _api.Daemon.getSettings((err, daemon_setting)=>{
            // inject Library API
            if(Me.Manifest.LibraryAPI)
              _api.Library = Library;

            _api.Constants = require(message.cpath);

            // inject Database API
            if(Me.Manifest.DatabaseAPI||Me.Manifest.DiscreteDatabaseAPI) {
              let _db = new Database(daemon_setting.database);
              let _model = new Model();

              _model.setTableName(_api.Constants.MODEL_TABLE_NAME);
              _model.setTablePrefix(_api.Constants.MODEL_TABLE_PREFIX);
              _model.setIndexkey(_api.Constants.MODEL_INDEX_KEY);
              _model.setGroupkey(_api.Constants.MODEL_GROUP_KEY);

              _api.Database = {};
              _api.Database.Database = _db;

              _db.connect((err)=> {
                if(err) {
                  Utils.TagLog('*ERR*', 'Occur failure on connecting database. At service worker of "'+_service_name+'".');
                  throw(err);
                }
                _model.importDatabase(_db, (err)=> {
                  if(err) {
                    Utils.TagLog('*ERR*', 'Occur failure on importing database for model.  At service worker of "'+_service_name+'".');
                    console.log(err);
                    process.exit();
                  }

                  _api.Database.Model = {};
                  _api.Database.RAWModel = {};

                  _api.Database.Model.remove = (model_name, callback)=>{
                    _model.remove(_service_name+'_'+model_name, _api.SafeCallback(callback));
                  };
                  _api.Database.Model.exist = (model_name, callback)=>{
                    _model.exist(_service_name+'_'+model_name, _api.SafeCallback(callback));
                  };
                  _api.Database.Model.get= (model_name, callback)=>{
                    _model.get(_service_name+'_'+model_name, _api.SafeCallback(callback));
                  };
                  _api.Database.Model.define= (model_name, model_structure, callback)=>{
                    _model.define(_service_name+'_'+model_name, model_structure, _api.SafeCallback(callback));
                  };

                  _api.Database.Model.doBatchSetup= (models_dict, callback)=>{
                    let _new_model_dict = {};
                    for(let model_name in models_dict) {
                      _new_model_dict[_service_name+'_'+model_name] = models_dict[model_name];
                    }
                    _model.doBatchSetup(_new_model_dict, (err, models)=> {
                      let new_models = {};
                      for(let model_name in models) {
                        new_models[model_name.split(_service_name+'_')[1]] = models[model_name];
                      }
                      callback(err, new_models);
                    });
                  };

                  _api.Database.Model.close= ()=>{
                    _model.close();
                  };

                  _api.Database.RAWModel.remove = (model_name, callback)=>{
                    _model.remove(model_name, _api.SafeCallback(callback));
                  };
                  _api.Database.RAWModel.exist = (model_name, callback)=>{
                    _model.exist(model_name, _api.SafeCallback(callback));
                  };
                  _api.Database.RAWModel.get= (model_name, callback)=>{
                    _model.get(model_name, _api.SafeCallback(callback));
                  };
                  _api.Database.RAWModel.define= (model_name, model_structure, callback)=>{
                    _model.define(model_name, model_structure, _api.SafeCallback(callback));
                  };

                  _api.Database.RAWModel.getModelsDict= (callback)=>{
                    _model.getModelsDict(_api.SafeCallback(callback));
                  };

                  _api.Database.RAWModel.close= ()=>{
                    _model.close();
                  };


                  // change workingdir
                  process.chdir(Me.FilesPath);
                  // console.log(Me.FilesPath);

                  try {
                    _service_module = new (require(message.p))(Me, _api);
                    process.send({t:1});
                  }
                  catch(e) {
                    console.log(e);
                    process.send({t:99, e:e.toString()});
                  }
                });
              });
            }
            else {
              try {
                process.chdir(Me.FilesPath);
                _service_module = new (require(message.p))(Me, _api);
                process.send({t:1});
              }
              catch(e) {
                console.log(e);
                process.send({t:99, e:e.toString()});
              }
            }
          });
        });
      }
      else if (message.t === 1) {
        try {
          _service_module.start();
          process.send({t: 2});
        }
        catch(err) {
          process.send({t: 98, e: err.stack});
        }
      }
      // function return
      else if(message.t === 2) {
        try {
          for(let i in message.o) {
            message.a[parseInt(i)] = APIUtils.generateObjCallbacks(message.o[i][0], message.o[i][1], this.emitParentCallback);
          }
          _local_obj_callbacks_dict[message.p[0]].apply(null, message.a);
        }
        catch (e) {
          Utils.TagLog('*ERR*', 'Callback error occured on service "'+_service_name+'".');
          console.log('Details: ');
          console.log(message);
          console.log(e);
        }
      }
      else if(message.t === 3) {
        delete _local_obj_callbacks_dict[message.i];
        // console.log(Object.keys(_local_obj_callbacks_dict).length);
      }
      else if(message.t === 4) {
        process.send({t:6, i:message.i, c:Object.keys(_local_obj_callbacks_dict).length});
      }
      // memory
      else if(message.t === 5) {
        process.send({t:7, i:message.i, c: process.memoryUsage()});
      }

      else if(message.t === 98) {
        Utils.TagLog('*ERR*', 'Service "'+_service_name+'" occured error on API call.');
        console.log('Details: ');
        console.log(message.d);
        console.log(message.e);
      }
      else if(message.t === 99) {
        if(!_closed) {
          _closed = true;
          if(_service_module)
            try{
              if(_service_module.close) {
                _service_module.close();
                process.send({t:3});
              }
              else {
                process.send({t: 96, e: 'The service "'+_service_name+'" have no "close" function.'});
              }
            }
            catch(e) {
              process.send({t: 96, e: e.stack});
              // Utils.TagLog('*ERR*', 'Service "'+_service_name+'" occured error while closing.');
              // console.log(e);
            }
          // setTimeout(()=> {process.exit()}, _close_timeout);
        }
      }
    }

    this.established = ()=>{
      process.send({t:0});
    }
  }
  catch(err) {
    process.send({t: 97});
  }
}

let w = new WorkerClient();
// prevent exit
process.on('SIGINT', () => {

});

process.on('disconnect', ()=> {
  console.log('Disconnect from NoService Core. "'+process.title+'" forced to exit. Your state may not be saved!');
  process.exit();
});

w.established();
