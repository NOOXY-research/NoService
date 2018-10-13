// NSF/NSd/worker.js
// Description:
// "worker.js" is service worker client for NOOXY service framework.
// Copyright 2018 NOOXY. All Rights Reserved.

// NOOXY Service WorkerDaemon protocol
// message.t
// 0 worker established {t, a: api tree, p: service module path, c: closetimeout}
// 1 callback {t, p: [obj_id, callback_path], a: arguments, o:{arg_index, [obj_id, callback_tree]}}
// 2 unbindobj {t, i: id};
// 99 close
'use strict';

const fork = require('child_process').fork;
const Utils = require('./utilities');
process.title = 'NSF_worker';


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
      t: 1,
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
      t: 2,
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
      process.title = 'NSF_worker: '+message.p;
      _service_module = require(message.p);
      _service_name = /.*\/([^\/]*)\/entry/g.exec(message.p)[1];
      _close_timeout = message.c;
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
        try {
          _service_module.start(Me, _api);
        }
        catch(e) {
          console.log(e);
        }

      });
    }
    // function return
    else if(message.t == 1) {
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
    else if(message.t == 2) {
      delete _local_obj_callbacks_dict[message.i];
      // console.log(Object.keys(_local_obj_callbacks_dict).length);
    }
    else if(message.t == 98) {
      Utils.tagLog('*ERR*', 'Service "'+_service_name+'" occured error on API call.');
      console.log('Details: ');
      console.log(message.d);
      console.log(message.e);
    }
    else if(message.t == 99) {
      if(_service_module)
        _service_module.close();
      setTimeout(()=> {process.exit()}, _close_timeout);
    }
  }

  this.launch = ()=>{
    process.send({t:0});
  }
}

let w = new WorkerClient();
process.on('SIGINT', () => {
  console.log('Child SIGINT');
});
w.launch();
