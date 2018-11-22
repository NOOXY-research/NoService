// NoService/NoService/utilities.js
// Description:
// "utilities.js" provides general function to be widely used.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

const fs = require('fs');
const crypto = require('crypto');

const UUID_pool = 31 * 128; // 36 chars minus 4 dashes and 1 four
const UUID_template = "10000000-1000-4000-8000-100000000000";
const BACKSPACE = String.fromCharCode(127);

let compareVersion = (v1, v2, options)=> {
    var lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split('.'),
        v2parts = v2.split('.');

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push("0");
        while (v2parts.length < v1parts.length) v2parts.push("0");
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        }
        else if (v1parts[i] > v2parts[i]) {
            return 1;
        }
        else {
            return -1;
        }
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
}

let generateGUID = ()=>{
  let r = crypto.randomBytes(UUID_pool);
  let j = 0;
  let ch;
  let chi;
  let strs = [];
  strs.length = UUID_template.length;
  strs[8] = '-';
  strs[13] = '-';
  strs[18] = '-';
  strs[23] = '-';

  for (chi = 0; chi < UUID_template.length; chi++) {
    ch = UUID_template[chi];
    if ('-' === ch || '4' === ch) {
      strs[chi] = ch;
      continue;
    }
    j++;

    if (j >= r.length) {
      r = crypto.randomBytes(UUID_pool);
      j = 0;
    }

    if ('8' === ch) {
      strs[chi] = (8 + r[j] % 4).toString(16);
      continue;
    }

    strs[chi] = (r[j] % 16).toString(16);
  }

  return strs.join('');
}



// for workers
// generate fake Obj for remote calling back into local
const generateObjCallbacks = (id, obj_tree, callback) => {
  if(Object.keys(obj_tree).length) {
    let deeper = (sub_obj_tree, walked_path_list)=> {
      if(typeof(sub_obj_tree) == 'object' && sub_obj_tree!=null) {
        for(let key in sub_obj_tree) {
          sub_obj_tree[key]=deeper(sub_obj_tree[key], walked_path_list.concat([key]));
        }
      }
      else {
        sub_obj_tree = (...args)=> {
          callback([id, walked_path_list], args)
        };
      }
      return sub_obj_tree;
    }
    return deeper(obj_tree, []);
  }
  else {
    return (...args)=> {
      callback([id, []], args)
    };
  }
}
// route remote call to local obj callback
const callObjCallback = (Obj, Objpath, args, arg_objs_trees, obj_callback_policy, generate_obj_policy)=> {
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
  let f = getTargetObj(Objpath, Obj);
  f.apply(null, args);
};
// generate tree from local for remote
const generateObjCallbacksTree = (obj_raw) => {
  if(typeof(obj_raw)!='function') {
    let deeper = (subobj)=> {
      let obj_tree = {};
      if(typeof(subobj) == 'object') {
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
const hasFunction = (obj_raw) => {
  if(typeof(obj_raw)=='object') {
    let boo = false;
    let deeper = (subobj)=> {
      if(typeof(subobj) == 'object') {
        for(let key in subobj) {
          if(typeof(subobj[key]) == 'function') {
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

let validateEmail = (email)=> {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};

let returnPassword = (prompt)=> {
    if (prompt) {
      process.stdout.write(prompt);
    }

    let stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';
    stdin.on('data', function (ch) {
        ch = ch.toString('utf8');

        switch (ch) {
        case "\n":
        case "\r":
        case "\u0004":
            // They've finished typing their password
            process.stdout.write('\n');
            stdin.setRawMode(false);
            stdin.pause();
            return password;
            break;
        case "\u0003":
            // Ctrl-C
            return null;
            break;
        case BACKSPACE:
            password = password.slice(0, password.length - 1);
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(prompt);
            process.stdout.write(password.split('').map(function () {
              return '*';
            }).join(''));
            break;
        default:
            // More passsword characters
            process.stdout.write('*');
            password += ch;
            break;
        }
    });
}

let isEnglish = (string) => {
  return /^[A-Za-z0-9]*$/.test(string);
};

// read a file and return a parsed JSON obj
let returnJSONfromFile = (filename) => {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));;
};

String.prototype.replaceAll = function(search, replacement) {
    let target = this;
    return target.split(search).join(replacement);
};

// print the NoService LOGO
let printLOGO = (version, copyright) => {
  console.log('88b 88  dP\'Yb   dP\'Yb  Yb  dP Yb  dP  TM')
  console.log('88Yb88 dP   Yb dP   Yb  YbdP   YbdP  ')
  console.log('88 Y88 Yb   dP Yb   dP  dPYb    88   ')
  console.log('88  Y8  YbodP   YbodP  dP  Yb   88   NoService. ')
  console.log('')
  console.log('')
  console.log('ver. '+version+'. '+copyright)
  console.log('For more information or update -> www.nooxy.org')
  console.log('')
};

// print log with tag
let TagLog = (tag, logstring) => {
  if(typeof(logstring)!='string') {
    logstring = JSON.stringify(logstring, null, 2);
  }
  let _space = 10;
  tag = tag.substring(0, _space);
  for(let i=0; i < _space-tag.length; i++) {
    if(i%2 != 1) {
      tag = tag + ' ';
    }
    else {
      tag = ' ' + tag;
    }
  }
  console.log('['+tag+'] '+logstring.replaceAll('\n', '\n['+tag+'] '));
};

// generateGUID
let generateUniqueID = () => {
  return '_' + Math.random().toString(36).substr(2, 9);
};

let hashString = (s) => {
  let i, chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr   = s.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

let removeHTML = function(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g,
    '&gt;').replace(/"/g, '&quot;');
}

let s4 = () => {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

let addDays = (date, days)=> {
  let dat = date;
  dat.setDate(dat.getDate() + days);
  return dat;
}

// let generateGUID = () => {
//   return s4() + s4() + '-' + s4() + '-' + s4() + '-' +s4() + '-' + s4() + s4() +
//    s4();
// }

let searchObject = (object, value)=> {
  for (let prop in object) {
    if (object.hasOwnProperty(prop)) {
      if (object[prop] === value) {
        return prop;
      }
    }
  }
};

let SQLtoDate = (sqlDate) => {
  let sqlDateArr1 = sqlDate.split("-");
  let sYear = sqlDateArr1[0];
  let sMonth = (Number(sqlDateArr1[1]) - 1).toString();
  let sqlDateArr2 = sqlDateArr1[2].split(" ");
  let sDay = sqlDateArr2[0];
  let sqlDateArr3 = sqlDateArr2[1].split(":");
  let sHour = sqlDateArr3[0];
  let sMinute = sqlDateArr3[1];
  let sqlDateArr4 = sqlDateArr3[2].split(".");
  let sSecond = sqlDateArr4[0];
  let sMillisecond = sqlDateArr4[1];
  // console.log(sYear, ' ', sMonth, ' ',  sDay, ' ',  sHour, ' ',  sMinute, ' ',  sSecond, ' ',  sMillisecond);
  return new Date(sYear, sMonth, sDay, sHour, sMinute, sSecond);
}

 let DatetoSQL = (JsDate) => {
  let iso = JsDate.toISOString();
  return iso.slice(0, 19).replace('T', ' ');
}

module.exports = {
  compareVersion: compareVersion,
  validateEmail: validateEmail,
  generateObjCallbacks: generateObjCallbacks,
  callObjCallback: callObjCallback,
  hasFunction: hasFunction,
  generateObjCallbacksTree: generateObjCallbacksTree,
  isEnglish: isEnglish,
  returnPassword: returnPassword,
  returnJSONfromFile: returnJSONfromFile,
  printLOGO: printLOGO,
  TagLog: TagLog,
  generateUniqueID: generateUniqueID,
  hashString: hashString,
  removeHTML: removeHTML,
  generateGUID: generateGUID,
  searchObject: searchObject,
  addDays: addDays,
  DatetoSQL: DatetoSQL,
  SQLtoDate: SQLtoDate
}
