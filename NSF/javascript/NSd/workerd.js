// NSF/NSd/workerd.js
// Description:
// "workerd.js" is a service worker daemon for NOOXY service framework. With workers the
// services is multithreaded.
// Copyright 2018 NOOXY. All Rights Reserved.

// Client message protocol
// message.t
// 0 worker established {t}
// 1 api call {t, p, a: arguments, o:{arg_index, [obj_id, callback_tree]}}
// 2 accessobj {t, p, a: arguments, o:{arg_index, [obj_id, callback_tree]}}


// memory leak on ActivitySocket!!!

'use strict';

const {fork} = require('child_process');
const Utils = require('./utilities');

function WorkerDaemon() {
  let _worker_clients = [];
  let _close_worker_timeout = 3000;
  let _clear_obj_garbage_timeout = 30000;
  let _local_obj_callbacks_dict = {};
  let _services_relaunch_cycle = 1000*60*60*24;

  // garbage cleaning
  setInterval(()=>{
    for(let key in _local_obj_callbacks_dict) {
      if(_local_obj_callbacks_dict[key].worker_cancel_refer){
        delete _local_obj_callbacks_dict[key];
      }
    }
  }, _clear_obj_garbage_timeout);

  function WorkerClient(path) {
    let _serviceapi = null;
    let child = null;

    this.emitChildCallback = ([obj_id, path], args) => {
      let _data = {
        t: 1,
        p: [obj_id, path],
        a: args,
        o: {}
      }

      for(let i in args) {
        if(Utils.hasFunction(args[i])) {
          let _Id = Utils.generateUniqueID();
          if(typeof(args[i])=='function') {
            _local_obj_callbacks_dict[_Id] = (...a)=>{
              args[i].apply(null, a);
              delete _local_obj_callbacks_dict[_Id];
            };
          }
          else {
            _local_obj_callbacks_dict[_Id] = args[i];
          }
          _data.o[i] = [_Id, Utils.generateObjCallbacksTree(args[i])];
        }
      }
      child.send(_data);
    }

    this.callAPICallback = (APIpath, args, arg_objs_trees)=> {
      Utils.callObjCallback(_serviceapi, APIpath, args, arg_objs_trees, this.emitChildCallback);
    }

    this.onMessage = (message)=>{
      if(message.t == 0) {
        child.send({t:0, p: path, a: Utils.generateObjCallbacksTree(_serviceapi)});
      }
      else if(message.t == 1) {
        this.callAPICallback(message.p, message.a, message.o);
      }
      else if(message.t == 2) {
        Utils.callObjCallback(_local_obj_callbacks_dict[message.p[0]], message.p[1], message.a, message.o, this.emitChildCallback);
      }
    };

    this.launch = ()=> {
      child = fork(require.resolve('./worker.js'));
      child.on('message', message => {
        this.onMessage(message);
      });
    };

    this.relaunch = ()=> {

    };

    this.importAPI = (api) => {
      _serviceapi = api;
    };

    this.close = ()=> {

    };
  };

  this.returnWorker = (path) => {
    return new WorkerClient(path);
  }
}

module.exports = WorkerDaemon;
