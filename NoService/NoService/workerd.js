// NoService/NoService/workerd.js
// Description:
// "workerd.js" is a service worker daemon for NOOXY service framework. With workers the
// services is multithreaded.
// Copyright 2018 NOOXY. All Rights Reserved.

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
// memory leak on ActivitySocket!!!

'use strict';

const {fork} = require('child_process');
const Utils = require('./library').Utilities;

function WorkerDaemon() {
  let _worker_clients = {};
  let _close_worker_timeout = 3000;
  let _clear_obj_garbage_timeout = 1000*60*10;
  // let _services_relaunch_cycle = 1000*60*60*24;
  let _serviceapi_module;

  this.getCBOCount = (callback)=> {
    let _left = Object.keys(_worker_clients).length;
    let _dict = {};
    for(let key in _worker_clients) {
      _worker_clients[key].getCBOCount((err, count)=> {
        _dict[key] = count;
        _left = _left-1;
        if(!_left) {
          callback(false, _dict);
        }
      });
    }
  };

  this.getMemoryUsage = (callback)=> {
    let _left = Object.keys(_worker_clients).length;
    let _dict = {};
    for(let key in _worker_clients) {
      _worker_clients[key].getMemoryUsage((err, usage)=> {
        _dict[key] = usage;
        _left = _left-1;
        if(!_left) {
          callback(false, _dict);
        }
      });
    }
  }

  this.importCloseTimeout = (timeout)=> {
    _close_worker_timeout = timeout;
  }

  this.importClearGarbageTimeout = (timeout)=> {
    if(timeout)
      _clear_obj_garbage_timeout = timeout;
  }

  function WorkerClient(path) {
    let _serviceapi = null;
    let _child = null;
    let _service_name =  /.*\/([^\/]*)\/entry/g.exec(path)[1];
    let _InfoRq = {};
    let _init_callback;
    let _launch_callback;
    let _close_callback;
    let _launched = false;

    _worker_clients[_service_name] = this;

    process.on('exit', ()=> {
      this.emitChildClose();
    });

    this.getCBOCount = (callback)=> {
      let _rqid = Utils.generateUniqueID();
      _InfoRq[_rqid] = callback;
      _child.send({t: 4, i: _rqid});
    };

    this.getMemoryUsage = (callback)=> {
      let _rqid = Utils.generateUniqueID();
      _InfoRq[_rqid] = callback;
      _child.send({t: 5, i: _rqid});
    }

    this.emitChildClose = ()=> {
      if(_launched)
        _child.send({t:99});
    }

    this.emitRemoteUnbind = (id)=> {
      _child.send({t:3, i: id}, (err)=> {
        if (err) {
          Utils.TagLog('*ERR*' , 'Occured error on sending data to child "'+_service_name+'".');
          console.log(err);
        }
      });
    }

    this.emitChildCallback = ([obj_id, path], args, argsobj) => {
      let _data = {
        t: 2,
        p: [obj_id, path],
        a: args,
        o: argsobj
      }

      try {
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

    this.onMessage = (message)=>{
      if(message.t == 0) {
        _child.send({t:0, p: path, a: _serviceapi.returnAPITree(), c: _close_worker_timeout, g: _clear_obj_garbage_timeout});
      }
      else if(message.t == 1) {
        _init_callback(false);
      }
      else if(message.t == 2) {
        _launched = true;
        _launch_callback(false);
      }
      else if(message.t == 3) {
        _close_callback(false);
        _child.kill();
        _child = null;
        _launched = false;
      }
      else if(message.t == 4) {
        try {
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
      else if(message.t == 5) {
        try {
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
      else if(message.t == 6) {
        _InfoRq[message.i](false, {daemon: _serviceapi.returnLCBOCount(), client: message.c})
        delete _InfoRq[message.i];
      }
      else if(message.t == 7) {
        _InfoRq[message.i](false, message.c)
        delete _InfoRq[message.i];
      }
      else if(message.t == 96){
        _close_callback(new Error('Worker closing error:\n'+message.e));
        _child.kill();
        _child = null;
        _launched = false;
      }
      else if(message.t == 97){
        // _launch_callback(new Error('Worker runtime error:\n'+message.e));
      }
      else if(message.t == 98){
        _launch_callback(new Error('Worker launching error:\n'+message.e));
      }
      else if(message.t == 99){
        _init_callback(new Error('Worker initializing error:\n'+message.e));
      }
    };

    this.launch = (launch_callback)=> {
      _launch_callback = launch_callback;
      _child.send({t:1});
    };

    this.init = (init_callback)=> {
      _init_callback = init_callback;
      _child = fork(require.resolve('./worker.js'), {stdio: [process.stdin, process.stdout, process.stderr, 'ipc']});
      _child.on('message', message => {
        this.onMessage(message);
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

    this.importAPI = (api) => {
      _serviceapi = api;
      _serviceapi.setRemoteCallbackEmitter(this.emitChildCallback);
      _serviceapi.setRemoteUnbindEmitter(this.emitRemoteUnbind);
    };

    this.close = (callback)=> {
      _close_callback = callback;
      _serviceapi.reset();
      this.emitChildClose();
    };
  };

  this.returnWorker = (path) => {
    return new WorkerClient(path);
  }

  this.importAPI = (serviceapi_module) => {
    _serviceapi_module = serviceapi_module;
  };

  this.close = ()=> {

  }
}

module.exports = WorkerDaemon;
