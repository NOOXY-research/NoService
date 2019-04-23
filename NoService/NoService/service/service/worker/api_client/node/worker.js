// NoService/NoService/service/worker.js
// Description:
// "worker.js" is service worker client for NOOXY service framework.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

// NOOXY Service WorkerDaemon protocol
// type
// 0 worker established {t, a: api tree, p: service module path, c: closetimeout}
// 1 launch
// 2 callback {t, p: [obj_id, callback_path], a: arguments, o:{arg_index, [obj_id, callback_tree]}}
// 3 unbindobj {t, i: id};
// 4 getLCBOcount {t, i}
// 5 getMemoryUsage
// 99 close
'use strict';

const Net = require('net');

const Library = require('../../../../../library');
const Utils = Library.Utilities;
const APIUtils = require('../../api_utilities');
const LocalCallbackTree = APIUtils.LocalCallbackTree;
const encodeArgumentsToBinary = APIUtils.encodeArgumentsToBinary;
const decodeArgumentsFromBinary = APIUtils.decodeArgumentsFromBinary;
const RemoteCallbackTree = APIUtils.RemoteCallbackTree;


// For injecting database to api
const Database = require('../../../../../database').Database;
const Model = require('../../../../../database').Model;
const Buf = require('../../../../../buffer');
const fs = require('fs');

process.title = 'NoService_worker';


process.argv;

function APISocket(sock) {
  let _on_callbacks = {};

  this._onClose = ()=> {
    if(_on_callbacks['close'])
      _on_callbacks['close'](message);
  };

  this._onMessege = (message)=> {
    if(_on_callbacks['message'])
      _on_callbacks['message'](message);
  };

  this.send = (blob, callback)=> {
    sock.write(Buf.concat([Buf.encode(('0000000000000000'+blob.length).slice(-16)), blob]));
  }

  this.on = (eventname, callback)=> {
    _on_callbacks[eventname] = callback;
  };

  this.close = ()=> {
    sock.destroy();
  };
}

function WorkerClient(_api_sock) {
  try {
    let _local_obj_callbacks_dict = {};
    let _service_module;
    let _api;
    let _clear_obj_garbage_timeout = 3000;
    let _close_timeout = 1000;
    let _service_name = 'NOOXY Service';
    let _closed = false;

    let _emitParentMessage = (type, blob)=> {
      if(blob) {
        let t = Buf.alloc(1, type);
        _api_sock.send(Buf.concat([t, blob]));
      }
      else {
        let t = Buf.alloc(1, type);
        _api_sock.send(t);
      }
    };

    let createLocalObjCallbacks = (obj)=> {
      let _Id = Utils.generateUniqueId();
      _local_callbacks[_Id] = obj;
      return _Id;
    };

    let callRemoteObjCallback = ()=> {

    };

    const emitParentAPI = ([id, APIpath], args) => {
      let _data = APIpath;
      for(let i in args) {
        if(!Buf.isBuffer(args[i])&&APIUtils.hasFunction(args[i])) {
          let id = Utils.generateUniqueId();
          _local_obj_callbacks_dict[id] = new LocalCallbackTree(id, args[i], ()=>{return args[i]},);
          args[i] = _local_obj_callbacks_dict[id];
        }
      }
      _emitParentMessage(4,  Buf.concat([Buf.alloc(1, JSON.stringify(_data).length), Buf.encode(JSON.stringify(_data)), encodeArgumentsToBinary(args)]));
    }

    const emitParentCallback = ([obj_id, path], args) => {
      let _data = [obj_id, path];
      for(let i in args) {
        if(!Buf.isBuffer(args[i])&&APIUtils.hasFunction(args[i])) {
          let id = Utils.generateUniqueId();
          _local_obj_callbacks_dict[id] = new LocalCallbackTree(id, args[i], ()=>{return args[i]});
          args[i] = _local_obj_callbacks_dict[id];
        }
      }
      _emitParentMessage(5,  Buf.concat([Buf.alloc(1, JSON.stringify(_data).length), Buf.encode(JSON.stringify(_data)), encodeArgumentsToBinary(args)]));
    }

    _api_sock.on('message', message => {
      let type = message[0];
      this.onMessage(type, message.slice(1));
    });

    this.onMessage = (type, blob)=>{
      // init worker
      if(type === 0) {
        let message = JSON.parse(blob.toString());
        _service_name = /.*\/([^\/]*)\/entry/g.exec(message.p)[1];
        process.title = 'NoService_worker: '+_service_name;
        _close_timeout = message.c;
        _clear_obj_garbage_timeout = message.g;
        _api = APIUtils.generateObjCallbacks('API', message.a, emitParentAPI);
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
                    _emitParentMessage(1);
                  }
                  catch(e) {
                    console.log(e);
                    _emitParentMessage(99,  Buf.encode(JSON.stringify({e:e.toString()})));
                  }
                });
              });
            }
            else {
              try {
                process.chdir(Me.FilesPath);
                _service_module = new (require(message.p))(Me, _api);
                _emitParentMessage(1);
              }
              catch(e) {
                console.log(e);
                _emitParentMessage(99,  Buf.encode(JSON.stringify({e:e.toString()})));
              }
            }
          });
        });
      }
      else if (type === 1) {
        try {
          _service_module.start();
          _emitParentMessage(2);
        }
        catch(err) {
          _emitParentMessage(98,  Buf.encode(JSON.stringify({e: err.stack})));
        }
      }
      // function return
      else if(type === 2) {
        try {
          let id_path = JSON.parse(blob.slice(1, 1+blob[0]).toString());
          let args = decodeArgumentsFromBinary(blob.slice(1+blob[0]));
          for(let i in args) {
            if(args[i] instanceof RemoteCallbackTree) {
              args[i].emitRemoteCallback = emitParentCallback;
              args[i] = args[i].returnCallbacks();
            }
          }
          _local_obj_callbacks_dict[id_path[0]].callCallback([], args);
        }
        catch (e) {
          let message = blob.toString();
          Utils.TagLog('*ERR*', 'Callback error occured on service "'+_service_name+'".');
          console.log('Details: ');
          console.log(message);
          console.log(e);
        }
      }
      else if(type === 3) {
        let message = JSON.parse(blob.toString());
        delete _local_obj_callbacks_dict[message.i];
        // console.log(Object.keys(_local_obj_callbacks_dict).length);
      }
      else if(type === 4) {
        let message = JSON.parse(blob.toString());
        _emitParentMessage(6,  Buf.encode(JSON.stringify({i:message.i, c:Object.keys(_local_obj_callbacks_dict).length})));
      }
      // memory
      else if(type === 5) {
        let message = JSON.parse(blob.toString());
        _emitParentMessage(7,  Buf.encode(JSON.stringify({i:message.i, c: process.memoryUsage()})));
      }

      else if(type === 98) {
        let message = JSON.parse(blob.toString());
        Utils.TagLog('*ERR*', 'Service "'+_service_name+'" occured error on API call.');
        console.log('Details: ');
        console.log(message.d);
        console.log(message.e);
      }
      else if(type === 99) {
        if(!_closed) {
          _closed = true;
          if(_service_module)
            try{
              if(_service_module.close) {
                _service_module.close();
                _emitParentMessage(3);
              }
              else {
                _emitParentMessage(96,  Buf.encode(JSON.stringify({e: 'The service "'+_service_name+'" have no "close" function.'})));
              }
            }
            catch(e) {
              _emitParentMessage(96,  Buf.encode(JSON.stringify({e: e.stack})));
              // Utils.TagLog('*ERR*', 'Service "'+_service_name+'" occured error while closing.');
              // console.log(e);
            }
          // setTimeout(()=> {process.exit()}, _close_timeout);
        }
      }
    }

    this.established = ()=>{
      _emitParentMessage(0, Buf.encode(JSON.stringify({s: process.argv[3]})));
    }
  }
  catch(err) {
    console.log(err);
    let t = Buf.alloc(1, 97);
    _api_sock.send(t);
  }
}

// prevent exit
process.on('SIGINT', () => {

});


let client = Net.createConnection(process.argv[2]);
client.on("connect", ()=> {
  let _api_sock = new APISocket(client);
  let w = new WorkerClient(_api_sock);
  w.established();

  let _onMessege = (message)=> {
    _api_sock._onMessege(message);
  };

  let chunks_size;
  let message;
  let resume_data;

  client.on("data", (data)=> {
    if(resume_data) {
      data = Buf.concat([resume_data, data]);
      // console.log('resume');
    };

    while(data.length) {
      // console.log('>', !message, data.length, chunks_size);
      if(!message) {
        chunks_size = parseInt(data.slice(0, 16).toString());
        message = data.slice(16, 16+chunks_size);
        data = data.slice(16+chunks_size);
        if(message.length === chunks_size) {
          _onMessege(message);
          chunks_size = null;
          message = null;
        }
        // in case chunks_size data is not complete
        if(data.length < 16) {
          resume_data = data;
          break;
        }
      }
      else if(data.length > chunks_size - message.length) {
        let left_size = chunks_size - message.length;
        // console.log('>', !message, data.length, chunks_size, message.length);
        message = Buf.concat([message, data.slice(0, left_size)]);
        data = data.slice(left_size);
        // console.log('>', !message, data.length, chunks_size, message.length);
        if(message.length === chunks_size) {
          _onMessege(message);
          chunks_size = null;
          message = null;
        }
        // in case chunks_size data is not complete
        if(data.length < 16) {
          resume_data = data;
          break;
        }
      }
      else {
        message = Buf.concat([message, data]);
        data = [];
        if(message.length === chunks_size) {
          _onMessege(message);
          chunks_size = null;
          message = null;
          resume_data = null;
        }
      }
    }
  });
});

client.on("close", ()=> {
  console.log('Disconnect from NoService Core. "'+process.title+'" forced to exit. Your state may not be saved!');
  process.exit();
});
