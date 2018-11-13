// NoService/NSd/database.js
// Description:
// sql statements are supposed to stay only this file.
// "database.js" provides interface to manage database stuff.
// Here are functions for calling wrapped sql statement.
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

  this.connect = (...args)=> {
    _dialect.connect.apply(null, args);;
  };

  this.query = (...args)=> {
    _dialect.query.apply(null, args);;
  };

  this.createTable = (...args)=> {
    _dialect.createTable.apply(null, args);;
  }

  this.existTable = (...args)=> {
    _dialect.existTable.apply(null, args);;
  };

  this.appendRows = (...args)=> {
    _dialect.appendRows.apply(null, args);;
  };

  this.close = (...args)=> {
    _dialect.close.apply(null, args);;
  };
}

module.exports = Database;
