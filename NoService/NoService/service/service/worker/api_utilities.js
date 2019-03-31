// NoService/NoService/service/worker/api_utilities.js
// Description:
// "api_utilities.js" provide interface of interacting with core. This module is desgined
// for multithreading.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
// All api tree's top should be callable! For worker calling.

'use strict';

// for workers
// generate fake Obj for remote calling back into local
module.exports.generateObjCallbacks = (callback_id, obj_tree, callparent) => {
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
// route remote call to local obj callback
module.exports.callObjCallback = (Obj, Objpath, args, arg_objs_trees, obj_callback_policy, generate_obj_policy)=> {
  let getTargetObj = (path, subobj)=> {
    if(path.length) {
      return getTargetObj(path.slice(1), subobj[path[0]]);
    }
    else {
      return subobj;
    }
  }
  for(let i in arg_objs_trees) {
    args[parseInt(i)] = generate_obj_policy(arg_objs_trees[i][0], arg_objs_trees[i][1], obj_callback_policy);
  }
  let f = getTargetObj(Objpath, Obj).bind(Obj);
  f.apply(null, args);
};
// generate tree from local for remote
module.exports.generateObjCallbacksTree = (obj_raw) => {
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

// generate Arguments binary
// format(concat):
// [1 bytes type string] [15 bytes len string][contain]
// contain
// type 0 Json:  [Json utf8]
// type 1 Callback Object:  [Json utf8]
// type 2 binary:  [Binary]
module.exports.encodeArgumentsToBinary = (args)=> {
  let result = Buffer.alloc(0);
  for(let i in args) {
    if(args[i].isLocalCallbackTree) {

    }
    else if (Buffer.isBuffer(args[i])) {

    }
    else {
      let string = JSON.stringify(args[i]);
    }
  }
  return result;
}

module.exports.decodeArgumentsFromBinary = (args)=> {
  let result = [];
  for(let i in args) {
    if(args[i].isLocalCallbackTree) {

    }
    else if (Buffer.isBuffer(args[i])) {

    }
    else {

    }
  }
  return result;
}
