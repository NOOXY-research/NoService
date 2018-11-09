// NoService/NSd/database.js
// Description: sql statements are supposed to stay only this file.
// "database.js" provides interface to manage database stuff.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';

function Mariadb(meta) {
  let _db;

  this.connect = (callback)=> {
    _db = require('mysql').createConnection({
      host     : meta.host,
      user     : meta.username,
      password : meta.password
    });
    _db.connect((err)=> {
      if(err) {
        console.log(err);
        callback(err);
      }
      else {
        _db.query('CREATE DATABASE IF NOT EXISTS '+meta.database, (error, results, fields)=> {
          if(error) {
            console.log(error);
            callback(error);
          }
          else {
            callback(error);
          }
        });
      }
    });
  };

  this.deleteRows = (callback)=> {

  };

  this.updateRows = (callback)=> {

  };

  this.updateRow = (callback)=> {

  };

  this.createTable = (table_name, callback)=> {

  };

  this.isTableExist = (callback)=> {

  };

  this.close = ()=> {
    _db.end();
  }
}

module.exports = {
  Mariadb: Mariadb
};
