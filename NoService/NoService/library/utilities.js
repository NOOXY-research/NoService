// NoService/NoService/utilities.js
// Description:
// "utilities.js" provides general function to be widely used.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const fs = require('fs');
const crypto = require('crypto');
const { exec, execSync } = require('child_process');

const UUID_pool = 31 * 128; // 36 chars minus 4 dashes and 1 four
const UUID_template = "10000000-1000-4000-8000-100000000000";
const BACKSPACE = String.fromCharCode(127);

let existCmd = (cmd, callback)=> {
  exec('which '+cmd , (err, stdout, stderr) => {
    if(err) {
      callback(false, false);
      return false;
    }
    else {
      callback(false, true);
      return true;
    }
  });
};

let isDirGitInitedSync = (dir, callback)=> {
  try {
    execSync('cd '+dir+'/.git').toString();
    return true;
  }
  catch (e) {
    return false;
  }
};

let isDirGitInited = (dir, callback)=> {
  exec('cd '+dir+'/.git' , (err, stdout, stderr) => {
    if (err) {
      callback(false ,false);
    }
    else {
      callback(false, true);
    }
  });
};

let uninitGitDir = (dir, callback)=> {
  exec('chmod +x '+__dirname+'/scripts/unix_git_uninit.sh' , (err, stdout, stderr) => {
    if (err) {
      callback(err);
    }
    else {
      exec(__dirname+'/scripts/unix_git_uninit.sh '+dir, (err, stdout, stderr) => {
        callback(err);
      });
    }
  });
};

let initGitDir = (dir, giturl, reponame, callback)=> {
  exec('chmod +x '+__dirname+'/scripts/unix_git_init.sh' , (err, stdout, stderr) => {
    if (err) {
      callback(err);
    }
    else {
      exec(__dirname+'/scripts/unix_git_init.sh '+dir+' '+giturl+' '+reponame, (err, stdout, stderr) => {
        callback(err);
      });
    }
  });
};

let pullGitDir = (dir, reponame, branch, callback)=> {
  exec('chmod +x '+__dirname+'/scripts/unix_git_pull.sh' , (err, stdout, stderr) => {
    if (err) {
      callback(err);
    }
    else {
      exec(__dirname+'/scripts/unix_git_pull.sh '+dir+' '+reponame+' '+branch, (err, stdout, stderr) => {
        callback(err);
      });
    }
  });
};

let compareVersion = (v1, v2, options)=> {
    let lexicographical = options && options.lexicographical,
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

    for (let i = 0; i < v1parts.length; ++i) {
        if (v2parts.length === i) {
            return 1;
        }

        if (v1parts[i] === v2parts[i]) {
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


let validateEmail = (email)=> {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};


let isEnglish = (string) => {
  return /^[A-Za-z0-9]*$/.test(string);
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
let generateUniqueId = () => {
  return '_' + Math.random().toString(36).substr(2, 9);
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

function encode_utf8( s ) {
  return unescape(encodeURIComponent( s ) );
}

let substrUTF8Bytes = (str, startInBytes, lengthInBytes) => {

   /* this function scans a multibyte string and returns a substring.
    * arguments are start position and length, both defined in bytes.
    *
    * this is tricky, because javascript only allows character level
    * and not byte level access on strings. Also, all strings are stored
    * in utf-16 internally - so we need to convert characters to utf-8
    * to detect their length in utf-8 encoding.
    *
    * the startInBytes and lengthInBytes parameters are based on byte
    * positions in a utf-8 encoded string.
    * in utf-8, for example:
    *       "a" is 1 byte,
            "ü" is 2 byte,
       and  "你" is 3 byte.
    *
    * NOTE:
    * according to ECMAScript 262 all strings are stored as a sequence
    * of 16-bit characters. so we need a encode_utf8() function to safely
    * detect the length our character would have in a utf8 representation.
    *
    * http://www.ecma-international.org/publications/files/ecma-st/ECMA-262.pdf
    * see "4.3.16 String Value":
    * > Although each value usually represents a single 16-bit unit of
    * > UTF-16 text, the language does not place any restrictions or
    * > requirements on the values except that they be 16-bit unsigned
    * > integers.
    */

    let resultStr = '';
    let startInChars = 0;

    // scan string forward to find index of first character
    // (convert start position in byte to start position in characters)

    for (let bytePos = 0; bytePos < startInBytes; startInChars++) {

        // get numeric code of character (is >= 128 for multibyte character)
        // and increase "bytePos" for each byte of the character sequence

        let ch = str.charCodeAt(startInChars);
        bytePos += (ch < 128) ? 1 : encode_utf8(str[startInChars]).length;
    }

    // now that we have the position of the starting character,
    // we can built the resulting substring

    // as we don't know the end position in chars yet, we start with a mix of
    // chars and bytes. we decrease "end" by the byte count of each selected
    // character to end up in the right position
    let end = startInChars + lengthInBytes - 1;

    for (let n = startInChars; startInChars <= end; n++) {
        // get numeric code of character (is >= 128 for multibyte character)
        // and decrease "end" for each byte of the character sequence
        let ch = str.charCodeAt(n);
        end -= (ch < 128) ? 1 : encode_utf8(str[n]).length;

        resultStr += str[n];
    }

    return resultStr;
}

let sortOnKeys = (dict)=> {

    var sorted = [];
    for(let key in dict) {
        sorted[sorted.length] = key;
    }
    sorted.sort();

    var tempDict = {};
    for(let i = 0; i < sorted.length; i++) {
        tempDict[sorted[i]] = dict[sorted[i]];
    }

    return tempDict;
}

module.exports = {
  UnixCmd: {
    uninitGitDir: uninitGitDir,
    isDirGitInitedSync: isDirGitInitedSync,
    existCmd: existCmd,
    isDirGitInited: isDirGitInited,
    initGitDir: initGitDir,
    pullGitDir: pullGitDir
  },
  compareVersion: compareVersion,
  validateEmail: validateEmail,
  isEnglish: isEnglish,
  printLOGO: printLOGO,
  TagLog: TagLog,
  generateUniqueId: generateUniqueId,
  removeHTML: removeHTML,
  generateGUID: generateGUID,
  searchObject: searchObject,
  addDays: addDays,
  DatetoSQL: DatetoSQL,
  SQLtoDate: SQLtoDate,
  substrUTF8Bytes: substrUTF8Bytes,
  sortOnKeys: sortOnKeys
}
