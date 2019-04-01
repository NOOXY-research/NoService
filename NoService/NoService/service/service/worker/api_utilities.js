// NoService/NoService/service/worker/api_utilities.js
// Description:
// "api_utilities.js" provide interface of interacting with core. This module is desgined
// for multithreading.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
// All api tree's top should be callable! For worker calling.

'use strict';

// for workers
// generate fake Obj for remote calling back into local
let generateObjCallbacks = (callback_id, obj_tree, callparent) => {
  if(Object.keys(obj_tree).length) {
    let deeper = (sub_obj_tree, walked_path_list)=> {
      if(typeof(sub_obj_tree) === 'object' && sub_obj_tree!=null) {
        for(let key in sub_obj_tree) {
          sub_obj_tree[key]=deeper(sub_obj_tree[key], walked_path_list.concat([key]));
        }
      }
      else {
        sub_obj_tree = (...args)=> {
          callparent([callback_id, walked_path_list], args)
        };
      }
      return sub_obj_tree;
    }
    return deeper(obj_tree, []);
  }
  else {
    return (...args)=> {
      callparent([callback_id, []], args)
    };
  }
}
module.exports.generateObjCallbacks = generateObjCallbacks;


// route remote call to local obj callback
let callObjCallback = (Obj, Objpath, args)=> {
  let getTargetObj = (path, subobj)=> {
    if(path.length) {
      return getTargetObj(path.slice(1), subobj[path[0]]);
    }
    else {
      return subobj;
    }
  }
  let f = getTargetObj(Objpath, Obj).bind(Obj);
  f.apply(null, args);
};
module.exports.callObjCallback = callObjCallback;



// generate tree from local for remote
let generateObjCallbacksTree = (obj_raw) => {
  if(typeof(obj_raw)!='function') {
    let deeper = (subobj)=> {
      let obj_tree = {};
      if(typeof(subobj) === 'object') {
        for(let key in subobj) {
          obj_tree[key] = deeper(subobj[key]);
        }
      }
      else {
        obj_tree = null;
      }
      return obj_tree;
    }

    return deeper(obj_raw)
  }
  else {
    return {};
  }
}
module.exports.generateObjCallbacksTree = generateObjCallbacksTree;


// has callback fucntion
module.exports.hasFunction = (obj_raw) => {
  if(typeof(obj_raw)=='object') {
    let boo = false;
    let deeper = (subobj)=> {
      if(typeof(subobj) === 'object') {
        for(let key in subobj) {
          if(typeof(subobj[key]) === 'function') {
            boo = true;
            break;
          }
          else {
            deeper(subobj[key]);
          }
        }
      }
    }
    deeper(obj_raw);
    return boo;
  }
  else if(typeof(obj_raw)=='function') {
    return true;
  }
  else {
    return false;
  }
}

module.exports.RemoteCallback = function(obj_id) {
  this.destroyRemoteCallback;
  this.emitRemoteCallback;

  this.apply = (args)=> {
    let _local_callback_trees = {};
    for(let i in args) {
      if(args[i]&&args[i].isLocalCallbackTree) {
        _local_callback_trees[i] = args[i].returnTree();
      }
      if(args[i]&&(args[i] instanceof Error)) {
        args[i] = args[i].toString();
      }
    }
    this.emitRemoteCallback([obj_id, ''], args, _local_callback_trees);
  };

  this.destory = ()=> {
    this.destroyRemoteCallback(obj_id);
  };
}

module.exports.LocalCallbackTree = function (id, obj, obj_contructor, isOneTimeObj) {
    let _RemoteCallbacks = [];
    
    let _syncRefer = (MyRemoteCallback)=> {
      _RemoteCallbacks.push(MyRemoteCallback);
    }

    let _callbacks;
    if(obj_contructor)
      _callbacks = obj_contructor(_syncRefer);

    this.isLocalCallbackTree = true;

    this.returnId = ()=> {return _id};

    this.isReferCanceled = ()=>{
      if(obj) {
        return obj.worker_cancel_refer;
      }
      else {
        return true;
      }

    }

    this.destroy = ()=> {
      for(let id in _RemoteCallbacks) {
        _RemoteCallbacks[id].destory();
        delete _RemoteCallbacks[id];
      }
      obj = null;
    };

    this.callCallback = (path, args)=>{
      try {
        callObjCallback(_callbacks, path, args);
      }
      catch(e) {
        throw new Error('LocalCallbackTree occured error.\n'+e.stack+'\nObject: \n'+JSON.stringify(generateObjCallbacksTree(obj))+'\nArguments: \n'+JSON.stringify((path, args, arg_objs_trees)));
      }
      if(isOneTimeObj) {
        this.destroy();
      }
    }

    this.returnTree = ()=> {
      return [id, generateObjCallbacksTree(_callbacks)];
    }
  };

// generate Arguments binary
// format(concat):
// [1 bytes type] [15 bytes len string][contain]
// contain
// type 0 Json:  [Json utf8]
// type 1 Callback Object:  [Json utf8]
// type 2 binary:  [Binary]
module.exports.encodeArgumentsToBinary = (args)=> {
  let result = Buffer.alloc(0);
  for(let i in args) {
    // type 1
    if(args[i].isLocalCallbackTree) {
      let blob = Buffer.from(JSON.stringify(args[i].returnTree()));
      result = Buffer.concat([result, Buffer.alloc(1, 1), Buffer.from(('000000000000000'+blob.length).slice(-15)), blob]);
    }
    // type 2
    else if (Buffer.isBuffer(args[i])) {
      let blob = args[i];
      result = Buffer.concat([result, Buffer.alloc(1, 2), Buffer.from(('000000000000000'+blob.length).slice(-15)), blob]);
    }
    // type 0
    else {
      let blob = Buffer.from(JSON.stringify(args[i]));
      result = Buffer.concat([result, Buffer.alloc(1, 0), Buffer.from(('000000000000000'+blob.length).slice(-15)), blob]);
    }
  }
  return result;
}

module.exports.decodeArgumentsFromBinary = (blob)=> {
  let result = [];
  while(blob.length) {
    let type = blob[0];
    let length = parseInt(blob.slice(1, 16));
    let token = blob.slice(16, 16+length);
    blob = blob.slice(16+length);
    if(type === 0) {
      result.push(JSON.parse(token.toString()));
    }
    else if(type === 1) {
      result.push(null);
    }
    else if(type === 2) {
      result.push(null);
    }
    else {
      result.push(null);
    }
  }
  return result;
}
