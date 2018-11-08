// NoService/NSd/database.js
// Description: sql statements are supposed to stay only this file.
// "database.js" provides interface to manage database stuff.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';
let DB;

function Database(meta) {
  let _db;
  if(meta.dialect == "sqlite3") {

  }
  else if(meta.dialect == "mysql") {

  }
  else if(meta.dialect == "mariadb") {
    DB = require('mysql');
  }
  else {
    throw new Error('Database "'+meta.dialect+'" not supported. ');
  }

  this.connect = (callback)=> {
    if(meta.dialect == "sqlite3") {

    }
    else if(meta.dialect == "mysql") {

    }
    else if(meta.dialect == "mariadb") {
      _db = DB.createConnection({
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


    }
    else {
      throw new Error('Database "'+meta.dialect+'" not supported. ');
    }
  };

  this.query = ()=> {

  };

  this.close = (callback)=> {
    if(meta.dialect == "sqlite3") {

    }
    else if(meta.dialect == "mysql") {

    }
    else if(meta.dialect == "mariadb") {
      _db.end();
    }
    else {
      throw new Error('Database "'+meta.dialect+'" not supported. ');
    }
  };
}

module.exports = Database;
