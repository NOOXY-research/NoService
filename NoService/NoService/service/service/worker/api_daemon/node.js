// NoService/NoService/service/service/worker/api_daemon/node.js
// Description:
// "node.js" is a service worker daemon for NOOXY service framework. With workers the
// services is multithreaded.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

// NOOXY Service WorkerClient protocol
// message.t
// 0 worker established {t}
// 1 successfully inited
// 2 successfully launched
// 3 successfully closed
// 4 api call {t, p, a: arguments, o:{arg_index, [obj_id, callback_tree]}}
// 5 accessobj {t, p, a: arguments, o:{arg_index, [obj_id, callback_tree]}}
// 6 returnLCBOcount
// 7 returnMemoryUsage

// 96 close error
// 97 runtime error
// 98 launch error
// 99 init error

'use strict';

const {fork} = require('child_process');

function NodeAPI() {
  let _const_path;
  let _close_worker_timeout = 3000;
  let _clear_obj_garbage_timeout = 1000*60*10;

  let API;

  function WorkerClient(_manifest, path) {
    let _serviceapi;
    let _child;
    let _InfoRq = {};
    let _init_callback;
    let _launch_callback;
    let _close_callback;
    let _child_alive = false;
    let _init = false;
    let _service_name = _manifest.name;

    let _emitChildMessage = (type, blob)=> {
      if(blob) {
        let t = Buffer.alloc(1, type);
        _child.send(Buffer.concat([t, blob]));
      }
      else {
        let t = Buffer.alloc(1, type);
        _child.send(t);
      }
    };

    this.getCBOCount = (callback)=> {
      if(_child_alive&&_child) {
        let _rqid = Utils.generateUniqueId();
        _InfoRq[_rqid] = callback;
        _emitChildMessage(4, Buffer.from(JSON.stringify({i: _rqid})));
      }
      else {
        callback(new Error("Child is not alive."));
      }
    };

    this.getMemoryUsage = (callback)=> {
      if(_child_alive&&_child) {
        let _rqid = Utils.generateUniqueId();
        _InfoRq[_rqid] = callback;
        _emitChildMessage(5, Buffer.from(JSON.stringify({i: _rqid})));
      }
      else {
        callback(new Error("Child is not alive."));
      }
    }

    this.emitChildClose = ()=> {
      if(_child_alive&&_child)
        _emitChildMessage(99);
    }

    this.emitRemoteUnbind = (id)=> {
      if(_child_alive&&_child)
        _emitChildMessage(3, Buffer.from(JSON.stringify({i: id})));
    }

    this.emitChildCallback = ([obj_id, path], args, argsobj) => {
      let _data = {
        t: 2,
        p: [obj_id, path],
        a: args,
        o: argsobj
      }

      try {
        if(_child_alive&&_child)
          _child.send(_data, (err)=> {
            if (err) {
              Utils.TagLog('*ERR*' , 'Occured error on sending data to child "'+_service_name+'".');
              console.log(err);
            }
          });
      }
      catch(err) {
        Utils.TagLog('*ERR*' , 'Occured error on "'+_service_name+'".');
        console.log(err);
      }
    }

    this.onMessage = (type, blob)=> {
      if(type === 0) {
        _emitChildMessage(0, Buffer.from(JSON.stringify({p: path, a: _serviceapi.returnAPITree(), c: _close_worker_timeout, g: _clear_obj_garbage_timeout, cpath: _const_path})));
      }
      else if(type === 1) {
        _init_callback(false);
      }
      else if(type === 2) {
        _launch_callback(false);
      }
      else if(type === 3) {
        _close_callback(false);
        _child.kill();
        _child = null;
        _child_alive = false;
      }
      else if(type === 4) {
        try {
          let message = JSON.parse(blob.toString());
          _serviceapi.emitAPIRq(message.p, message.a, message.o);
        }
        catch (e) {
          _child.send({
            t:98,
            d:{
              api_path: message.p,
              call_args: message.a,
              args_obj_tree: message.o
            },
            e: e.stack
          });
        }
      }
      else if(type === 5) {
        try {
          let message = JSON.parse(blob.toString());
          _serviceapi.emitCallbackRq(message.p, message.a, message.o);
        }
        catch (e) {
          _child.send({
            t:98,
            d:{
              obj_path: message.p,
              call_args: message.a,
              args_obj_tree: message.o
            },
            e: e.stack
          });
        }
      }
      else if(type === 6) {
        let message = JSON.parse(blob.toString());
        _InfoRq[message.i](false, {daemon: _serviceapi.returnLCBOCount(), client: message.c})
        delete _InfoRq[message.i];
      }
      else if(type === 7) {
        let message = JSON.parse(blob.toString());
        _InfoRq[message.i](false, message.c)
        delete _InfoRq[message.i];
      }
      else if(type === 96){
        let message = JSON.parse(blob.toString());
        _close_callback(new Error('Worker closing error:\n'+message.e));
        _child.kill();
        _child = null;
        _child_alive = false;
      }
      else if(type === 97){
        // _launch_callback(new Error('Worker runtime error:\n'+message.e));
      }
      else if(type === 98){
        let message = JSON.parse(blob.toString());
        _launch_callback(new Error('Worker launching error:\n'+message.e));
      }
      else if(type === 99){
        let message = JSON.parse(blob.toString());
        _init_callback(new Error('Worker initializing error:\n'+message.e));
      }
    };

    this.launch = (launch_callback)=> {
      _launch_callback = launch_callback;
      _emitChildMessage(1);
    };

    this.init = (init_callback)=> {
      _init_callback = init_callback;
      _child = fork(require.resolve('../api_client/node/worker'), {encoding: 'binary', stdio: [process.stdin, process.stdout, process.stderr, 'ipc']});
      _child_alive = true;
      _child.on('message', message => {
        let type = message[0];
        console.log(message);
        this.onMessage(type, message.slice(1));
      });
    };

    this.relaunch = (relaunch_callback)=> {
      Utils.TagLog('Workerd', 'Relaunching service "'+_service_name+'"');
      this.close((err)=> {
        if(err) {
          relaunch_callback(err);
        }
        else {
          setTimeout(()=>{
            this.init((err)=> {
              if(err) {
                relaunch_callback(err);
              }
              else {
                this.launch(relaunch_callback);
              }
            });
          }, _close_worker_timeout+10);
        }
      });
    };

    this.createServiceAPI = (_service_socket, callback)=> {
      API.createServiceAPI(_service_socket, _manifest, (err, api)=> {
        _serviceapi = api;
        _serviceapi.setRemoteCallbackEmitter(this.emitChildCallback);
        _serviceapi.setRemoteCallbakcDestroyer(this.emitRemoteUnbind);
        _serviceapi.setRemoteCallbakcDestroyer(this.emitRemoteUnbind);
        callback(false);
      })
    };

    this.close = (callback)=> {
      _close_callback = callback;
      _serviceapi.reset();
      this.emitChildClose();
    };
  };

  this.importAPI = (api)=> {
    API = api;
  };

  this.setClearGarbageTimeout = (timeout)=> {
    if(timeout)
      _clear_obj_garbage_timeout = timeout;
  }

  this.setCloseTimeout = (timeout)=> {
    _close_worker_timeout = timeout;
  }

  this.setConstantsPath = (path)=> {_const_path = path};

  this.generateWorker = (manifest, path)=> {
    return new WorkerClient(manifest, path);
  };

  this.start = ()=> {};

  this.close = ()=> {};
};

module.exports = NodeAPI;
