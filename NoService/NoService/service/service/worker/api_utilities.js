// NoService/NoService/service/worker/api_utilities.js
// Description:
// "api_utilities.js" provide interface of interacting with core. This module is desgined
// for multithreading.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
// All api tree's top should be callable! For worker calling.
'use strict';

const Buf = require('../../../buffer');

// for workers
// generate fake Obj for remote calling back into local
let generateObjCallbacks = (callback_id, obj_tree, callparent) => {
  if(Object.keys(obj_tree).length) {
    let deeper = (sub_obj_tree, walked_path_list)=> {
      if(typeof(sub_obj_tree) === 'object' && sub_obj_tree!=null) {
        for(let key in sub_obj_tree) {
          sub_obj_tree[key] = deeper(sub_obj_tree[key], walked_path_list.concat([key]));
        }
      }
      else {
        sub_obj_tree = (...args)=> {
          callparent([callback_id, walked_path_list], args);
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

// for daemon
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


// for daemon
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

// for daemon and worker
function RemoteCallbackTree(cbtree) {
  let obj_id = cbtree[0];
  let tree = cbtree[1];

  this.destroyRemoteCallback;
  this.emitRemoteCallback;

  // for worker
  this.returnCallbacks = ()=> {
    return generateObjCallbacks(obj_id, tree, this.emitRemoteCallback);
  };

  this.apply = (args)=> {
    this.emitRemoteCallback([obj_id, []], encodeArgumentsToBinary(args));
  };

  this.destory = ()=> {
    this.destroyRemoteCallback(obj_id);
  };
}
module.exports.RemoteCallbackTree = RemoteCallbackTree;


// both daemon and worker
function LocalCallbackTree(id, obj, obj_contructor, isOneTimeObj) {
  let _RemoteCallbacks = [];

  let _syncRefer = (MyRemoteCallback)=> {
    _RemoteCallbacks.push(MyRemoteCallback);
  }

  let _callbacks;
  if(obj_contructor)
    _callbacks = obj_contructor(_syncRefer);

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
      throw new Error('LocalCallbackTree occured error.\n'+e.stack+'\nObject: \n'+JSON.stringify(generateObjCallbacksTree(obj))+'\nArguments: \n'+JSON.stringify((path, args)));
    }
    if(isOneTimeObj) {
      this.destroy();
    }
  }

  this.returnTree = ()=> {
    return [id, generateObjCallbacksTree(_callbacks)];
  }
};
module.exports.LocalCallbackTree = LocalCallbackTree;

// generate Arguments binary
// format(concat):
// [1 bytes type] [15 bytes len string][contain]
// contain
// type 0 Error:
// type 1 Json:  [Json utf8]
// type 2 Callback Object:  [Json utf8]
// type 3 binary:  [Binary]

let encodeArgumentsToBinary = (args)=> {
  let result = Buf.alloc(0);
  for(let i in args) {
    // type 0
    if(args[i] instanceof Error) {
      let blob = Buf.from(args[i].toString());
      result = Buf.concat([result, Buf.alloc(1, 0), Buf.from(('000000000000000'+blob.length).slice(-15)), blob]);
    }
    // type 2
    else if(args[i] instanceof LocalCallbackTree) {
      let blob = Buf.from(JSON.stringify(args[i].returnTree()));
      result = Buf.concat([result, Buf.alloc(1, 2), Buf.from(('000000000000000'+blob.length).slice(-15)), blob]);
    }
    // type 3
    else if (Buf.isBuffer(args[i])) {
      let blob = args[i];
      result = Buf.concat([result, Buf.alloc(1, 3), Buf.from(('000000000000000'+blob.length).slice(-15)), blob]);
    }
    // type 1
    else {
      let blob = Buf.from(JSON.stringify(args[i]?args[i]:null));
      result = Buf.concat([result, Buf.alloc(1, 1), Buf.from(('000000000000000'+blob.length).slice(-15)), blob]);
    }
  }
  return result;
}
module.exports.encodeArgumentsToBinary = encodeArgumentsToBinary;


let decodeArgumentsFromBinary = (blob)=> {
  let result = [];
  while(blob.length) {
    let type = blob[0];
    let length = parseInt(blob.slice(1, 16));
    let token = blob.slice(16, 16+length);
    blob = blob.slice(16+length);
    if(type === 0) {
      result.push(new Error(token.toString()));
    }
    else if(type === 1) {
      result.push(JSON.parse(token.toString()));
    }
    else if(type === 2) {
      result.push(new RemoteCallbackTree(JSON.parse(token.toString())));
    }
    else if(type === 3) {
      result.push(token);
    }
    else {
      result.push(null);
    }
  }
  return result;
}
module.exports.decodeArgumentsFromBinary = decodeArgumentsFromBinary;
