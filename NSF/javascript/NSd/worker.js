// NSF/NSd/worker.js
// Description:
// "worker.js" is service worker client for NOOXY service framework.
// Copyright 2018 NOOXY. All Rights Reserved.

// Parent message protocol
// message.t
// 0 worker established {t, a: api tree, p: service module path}
// 1 callback {t, p: parameters, i: callback_id, o:{arg_index, [obj_id, callback_tree]}}

'use strict';

const fork = require('child_process').fork;
const Utils = require('./utilities')
process.title = 'NSF_worker';

function WorkerClient() {
  let _local_callbacks = {};
  let _service_module = null;

  let createLocalCallback = (callback)=> {
    let _Id = Utils.generateUniqueID();
    _local_callbacks[_Id] = callback;
    return _Id;
  };

  let onLocalCallback = (Id, args)=> {
    _local_callbacks[Id].apply(null, args);
    delete _local_callbacks[Id];
  };

  let callRemoteObjCallback = ()=> {

  };

  const callParentAPI = (APIpath, args) => {
    let _data = {
      t: 1,
      p: APIpath,
      a: args,
      c: {}
    };
    for(let i in args) {
      if(typeof(args[i])=='function') {
        _data.c[i] = createLocalCallback(args[i]);
      }
    }
    process.send(_data);
  }

  const generateAPI = (apilist) => {
    let deeper = (subapi, api_path_list)=> {
      if(typeof(subapi) == 'object' && subapi!=null) {
        for(let key in subapi) {
          subapi[key]=deeper(subapi[key], api_path_list.concat([key]));
        }
      }
      else {
        subapi = (...args)=> {
          callParentAPI(api_path_list, args)
        };
      }
      return subapi;
    }

    return deeper(apilist, [])
  }

  process.on('message', message => {
    this.onMessage(message);
  });

  this.onMessage = (message)=>{
    // init worker
    if(message.t == 0) {
      process.title = 'NSF_worker: '+message.p;
      _service_module = require(message.p);
      let api = generateAPI(message.a);
      api.getMe((err, Me)=>{
        _service_module.start(Me, api);
      });
    }
    // function return
    else if(message.t == 1) {
      onLocalCallback(message.i, message.p);
    }
    else {

    }
  }

  this.launch = ()=>{
    process.send({t:0});
  }
}

let w = new WorkerClient();
w.launch();
