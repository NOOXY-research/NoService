// NoService/NSd/database.js
// Description: sql statements are supposed to stay only this file.
// "database.js" provides interface to manage database stuff.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';

function Database(meta) {
  let _db;
  if(meta.type == "sqlite3") {

  }
  else if(meta.type == "mysql") {

  }
  else if(meta.type == "mariadb") {

  }
  else {
    throw new Error('Database "'+meta.type+'" not supported. ');
  }

  this.connect = ()=> {

  };

  this.query = ()=> {

  };
}

module.exports = Database;
