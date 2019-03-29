// NoService/NoService/service/service/worker/api_daemon/node.js
// Description:
// "node.js" is a service worker daemon for NOOXY service framework. With workers the
// services is multithreaded.
// Copyright 2018-2019 NOOXY. All Rights Reserved.


function NodeAPI() {
  function WorkerClient(_service_name, path) {
    let _serviceapi;
    let _child;
    let _service_name =  /.*\/([^\/]*)\/entry/g.exec(path)[1];
    let _InfoRq = {};
    let _init_callback;
    let _launch_callback;
    let _close_callback;
    let _child_alive = false;
    let _init = false;

    this.getCBOCount = (callback)=> {
      if(_child_alive&&_child) {
        let _rqid = Utils.generateUniqueId();
        _InfoRq[_rqid] = callback;
        _child.send({t: 4, i: _rqid});
      }
      else {
        callback(new Error("Child is not alive."));
      }
    };

    this.getMemoryUsage = (callback)=> {
      if(_child_alive&&_child) {
        let _rqid = Utils.generateUniqueId();
        _InfoRq[_rqid] = callback;
        _child.send({t: 5, i: _rqid});
      }
      else {
        callback(new Error("Child is not alive."));
      }
    }

    this.emitChildClose = ()=> {
      if(_child_alive&&_child)
        _child.send({t:99});
    }

    this.emitRemoteUnbind = (id)=> {
      if(_child_alive&&_child)
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

    this.onMessage = (message)=> {
      if(message.t === 0) {
        _child.send({t:0, p: path, a: _serviceapi.returnAPITree(), c: _close_worker_timeout, g: _clear_obj_garbage_timeout, cpath: _const_path});
      }
      else if(message.t === 1) {
        _init_callback(false);
      }
      else if(message.t === 2) {
        _launch_callback(false);
      }
      else if(message.t === 3) {
        _close_callback(false);
        _child.kill();
        _child = null;
        _child_alive = false;
      }
      else if(message.t === 4) {
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
      else if(message.t === 5) {
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
      else if(message.t === 6) {
        _InfoRq[message.i](false, {daemon: _serviceapi.returnLCBOCount(), client: message.c})
        delete _InfoRq[message.i];
      }
      else if(message.t === 7) {
        _InfoRq[message.i](false, message.c)
        delete _InfoRq[message.i];
      }
      else if(message.t === 96){
        _close_callback(new Error('Worker closing error:\n'+message.e));
        _child.kill();
        _child = null;
        _child_alive = false;
      }
      else if(message.t === 97){
        // _launch_callback(new Error('Worker runtime error:\n'+message.e));
      }
      else if(message.t === 98){
        _launch_callback(new Error('Worker launching error:\n'+message.e));
      }
      else if(message.t === 99){
        _init_callback(new Error('Worker initializing error:\n'+message.e));
      }
    };

    this.launch = (launch_callback)=> {
      _launch_callback = launch_callback;
      _child.send({t:1});
    };

    this.init = (init_callback)=> {
      _init_callback = init_callback;
      _child = fork(require.resolve('./worker'), {stdio: [process.stdin, process.stdout, process.stderr, 'ipc']});
      _child_alive = true;
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
  this.generateWorker = (servicename, path)=> {
    return new WorkerClient(servicename, path);
  };
};

module.exports = NodeAPI;
