// NSF/NSd/utilities.js
// Description:
// "utilities.js" provides general function to be widely used.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

let fs = require('fs');

const BACKSPACE = String.fromCharCode(127);

function validateEmail(email) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function returnPassword(prompt) {
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

// print the NSF LOGO
let printLOGO = (version, copyright) => {
  console.log('88b 88  dP\'Yb   dP\'Yb  Yb  dP Yb  dP  TM')
  console.log('88Yb88 dP   Yb dP   Yb  YbdP   YbdP  ')
  console.log('88 Y88 Yb   dP Yb   dP  dPYb    88   ')
  console.log('88  Y8  YbodP   YbodP  dP  Yb   88   Service Framework. ')
  console.log('')
  console.log('')
  console.log('ver. '+version+'. '+copyright)
  console.log('For more information or update -> www.nooxy.tk')
  console.log('')
};

// print log with tag
let tagLog = (tag, logstring) => {
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

let generateGUID = () => {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +s4() + '-' + s4() + s4() +
   s4();
}

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
  isEnglish: isEnglish,
  returnPassword: returnPassword,
  returnJSONfromFile: returnJSONfromFile,
  printLOGO: printLOGO,
  tagLog: tagLog,
  generateUniqueID: generateUniqueID,
  hashString: hashString,
  removeHTML: removeHTML,
  generateGUID: generateGUID,
  searchObject: searchObject,
  addDays: addDays,
  DatetoSQL: DatetoSQL,
  SQLtoDate: SQLtoDate
}
