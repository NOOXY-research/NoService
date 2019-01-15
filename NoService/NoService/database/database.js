// NoService/NoService/database/database.js
// Description:
// sql statements are supposed to stay only this file.
// "database.js" provides interface to manage database stuff.
// Here are functions for calling wrapped sql statement.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

'use strict';

const Dialect = require('./dialect');

function Database(meta) {
  let _dialect;

  if(meta.dialect == "sqlite3") {
    _dialect = new Dialect.Sqlite3(meta);
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
    _dialect.connect.apply(null, args);
  };

  this.createFields = (...args)=> {
    _dialect.createFields.apply(null, args);
  };

  this.removeFields = (...args)=> {
    _dialect.removeFields.apply(null, args);
  };

  this.existField = (...args)=> {
    _dialect.existField.apply(null, args);
  };

  this.removerRows = (...args)=> {
    _dialect.removerRows.apply(null, args);
  };

  this.getRows = (...args)=> {
    _dialect.getRows.apply(null, args);
  };

  this.deleteRows = (...args)=> {
    _dialect.getRows.apply(null, args);
  };

  this.getAllRows = (...args)=> {
    _dialect.getAllRows.apply(null, args);
  };

  this.replaceRows = (...args)=> {
    _dialect.replaceRows.apply(null, args);
  };

  this.updateRows = (...args)=> {
    _dialect.updateRows.apply(null, args);
  };

  this.appendRows = (...args)=> {
    _dialect.appendRows.apply(null, args);
  };

  this.appendRowsandGroupAutoIncrease = (...args)=> {
    _dialect.appendRowsandGroupAutoIncrease.apply(null, args);
  };

  this.createTable = (...args)=> {
    _dialect.createTable.apply(null, args);
  };

  this.dropTable = (...args)=> {
    _dialect.dropTable.apply(null, args);
  };

  this.existTable = (...args)=> {
    _dialect.existTable.apply(null, args);
  };

  this.createreplaceRow = (...args)=> {
    _dialect.createreplaceRow.apply(null, args);
  };

  this.query = (...args)=> {
    _dialect.query.apply(null, args);
  };

  this.close = (...args)=> {
    _dialect.close.apply(null, args);
  };
}

module.exports = Database;
