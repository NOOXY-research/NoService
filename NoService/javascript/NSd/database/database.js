// NoService/NSd/database.js
// Description: sql statements are supposed to stay only this file.
// "database.js" provides interface to manage database stuff.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';

let Dialect = require('./dialect');

function Database(meta) {
  let _dialect;

  if(meta.dialect == "sqlite3") {

  }
  else if(meta.dialect == "mysql") {

  }
  else if(meta.dialect == "mariadb") {
    _dialect = new Dialect.Mariadb(meta);
  }
  else {
    throw new Error('Database "'+meta.dialect+'" not supported. ');
  }

  this.connect = (callback)=> {
    _dialect.connect(callback);
  };

  this.query = ()=> {
    _dialect.query();
  };

  this.createTable = ()=> {
    
  }

  this.close = (callback)=> {
    _dialect.close();
  };
}

module.exports = Database;
