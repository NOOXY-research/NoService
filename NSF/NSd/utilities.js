// NSF/NSd/utilities.js
// Description:
// "utilities.js" provides general function to be widely used.
// Copyright 2018 NOOXY. All Rights Reserved.

generateUniqueID = () => {
  return '_' + Math.random().toString(36).substr(2, 9);
};
};

hashString = (s) => {
  var s = 0, i, chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr   = s.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

removeHTML = function(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g,
    '&gt;').replace(/"/g, '&quot;');
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

addDays = function(date, days) {
  let result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

generateGUID = function() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +s4() + '-' + s4() + s4() +
   s4();
}

searchObject = function(object, value) {
  for (let prop in object) {
    if (object.hasOwnProperty(prop)) {
      if (object[prop] === value) {
        return prop;
      }
    }
  }
};

function SQLtoDate(sqlDate) {
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
  return new Date(sYear,sMonth,sDay,sHour,sMinute,sSecond,sMillisecond);
}

function DatetoSQL(JsDate) {
  return JsDate.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = {
  generateUniqueID: generateUniqueID;
  hashString: hashString,
  removeHTML: removeHTML,
  generateGUID: generateGUID,
  searchObject: searchObject,
  addDays: addDays,
  DatetoSQL: DatetoSQL,
  SQLtoDate: SQLtoDate
}
