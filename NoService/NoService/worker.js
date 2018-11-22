// NoService/NoService/worker.js
// Description:
// "worker.js" is service worker client for NOOXY service framework.
// Copyright 2018 NOOXY. All Rights Reserved.

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

const fork = require('child_process').fork;
const Utils = require('./library').Utilities;
// For injecting database to api
const Database = require('./database/database');
const Model = require('./database/model');
process.title = 'NoService_worker';


function WorkerClient() {
  let _local_obj_callbacks_dict = {};
  let _service_module = null;
  let _api;
  let _clear_obj_garbage_timeout = 3000;
  let _close_timeout = 1000;
  let _service_name = 'NOOXY Service';

  let createLocalObjCallbacks = (obj)=> {
    let _Id = Utils.generateUniqueID();
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
      if(Utils.hasFunction(args[i])) {
        let _Id = Utils.generateUniqueID();
        _local_obj_callbacks_dict[_Id] = args[i];
        // console.log(Object.keys(_local_obj_callbacks_dict).length);
        _data.o[i] = [_Id, Utils.generateObjCallbacksTree(args[i])];
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
      if(Utils.hasFunction(args[i])) {
        let _Id = Utils.generateUniqueID();
        _local_obj_callbacks_dict[_Id] = args[i];
        // console.log(Object.keys(_local_obj_callbacks_dict).length);

        _data.o[i] = [_Id, Utils.generateObjCallbacksTree(args[i])];
      }
    }
    process.send(_data);
  }

  process.on('message', message => {
    this.onMessage(message);
  });

  this.onMessage = (message)=>{
    // init worker
    if(message.t == 0) {
      _service_name = /.*\/([^\/]*)\/entry/g.exec(message.p)[1];
      process.title = 'NoService_worker: '+_service_name;
      _close_timeout = message.c;
      _clear_obj_garbage_timeout = message.g;
      _api = Utils.generateObjCallbacks('API', message.a, callParentAPI);
      _api.getMe((err, Me)=>{
        // add api
        _api.SafeCallback = (callback) => {
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
        _api.Utils = Utils;
        // setting up database
        _api.Daemon.getSettings((err, daemon_setting)=>{
          // inject Library API
          if(Me.Manifest.LibraryAPI)
            _api.Library = require('./library');

          // inject Database API
          if(Me.Manifest.DatabaseAPI) {
            let _db = new Database(daemon_setting.database);
            let _model = new Model();

            _api.Database = {};
            _api.Database.Database = _db;

            _db.connect((err)=> {
              if(err) {
                Utils.tagLog('*ERR*', 'Occur failure on connecting database. At service worker of "'+_service_name+'".');
                throw(err);
              }
              _model.importDatabase(_db, (err)=> {
                if(err) {
                  Utils.tagLog('*ERR*', 'Occur failure on importing database for model.  At service worker of "'+_service_name+'".');
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

                _api.Database.RAWModel.getModelsDict= ()=>{
                  _model.getModelsDict(_api.SafeCallback(callback));
                };


                _api.Database.RAWModel.close= ()=>{
                  _model.close();
                };

                _api.Database.Model.close= ()=>{
                  _model.close();
                };

                try {
                  _service_module = new (require(message.p))(Me, _api);
                  process.send({t:1});
                }
                catch(e) {
                  console.log(e);
                  process.send({t:99, e:e});
                }
              });
            });
          }
          else {
            try {
              _service_module = new (require(message.p))(Me, _api);
              process.send({t:1});
            }
            catch(e) {
              console.log(e);
              process.send({t:99, e:e});
            }
          }
        });
      });
    }
    else if (message.t == 1) {
      try {
        _service_module.start();
        process.send({t: 2});
      }
      catch(err) {
        process.send({t: 98, e: err});
      }
    }
    // function return
    else if(message.t == 2) {
      try {
        Utils.callObjCallback(_local_obj_callbacks_dict[message.p[0]], message.p[1], message.a, message.o, this.emitParentCallback, Utils.generateObjCallbacks);
      }
      catch (e) {
        Utils.tagLog('*ERR*', 'Callback error occured on service "'+_service_name+'".');
        console.log('Details: ');
        console.log(message);
        console.log(e);
      }
    }
    else if(message.t == 3) {
      delete _local_obj_callbacks_dict[message.i];
      // console.log(Object.keys(_local_obj_callbacks_dict).length);
    }
    else if(message.t == 4) {
      process.send({t:6, i:message.i, c:Object.keys(_local_obj_callbacks_dict).length});
    }
    // memory
    else if(message.t == 5) {
      process.send({t:7, i:message.i, c: process.memoryUsage()});
    }

    else if(message.t == 98) {
      Utils.tagLog('*ERR*', 'Service "'+_service_name+'" occured error on API call.');
      console.log('Details: ');
      console.log(message.d);
      console.log(message.e);
    }
    else if(message.t == 99) {
      if(_service_module)
        try{
          if(_service_module.close) {
            _service_module.close();
            process.send({t:3});
          }
          else {
            process.send({t: 96, e: new Error('The service have no "close" function.')});
          }
        }
        catch(e) {
          process.send({t: 96, e: e});
          // Utils.tagLog('*ERR*', 'Service "'+_service_name+'" occured error while closing.');
          // console.log(e);
        }
      setTimeout(()=> {process.exit()}, _close_timeout);
    }
  }

  this.established = ()=>{
    process.send({t:0});
  }
}

let w = new WorkerClient();
// prevent exit
process.on('SIGINT', () => {

});
w.established();
