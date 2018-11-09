// NoService/NSd/database/dialect.js
// Description: sql statements are supposed to stay only this file.
// "database.js" provides interface to manage database stuff.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';

const weird_chars = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,\/]/;

function PostgresSQL() {

}

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

  this.deleteRows = (select_query, callback)=> {

  };

  this.getRows = (select_query, callback)=> {
    db.query('CREATE TABLE');
  };

  this.getAllRows = (select_query, callback)=> {

  };

  this.replaceRows = (select_query, callback)=> {

  };

  this.replaceRow = (select_query, callback)=> {

  };

  this.createTable = (table_name, structure, callback)=> {

    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters of table name are not allowed.'));
    }
    else {
      let keys = [];
      let sql = 'CREATE TABLE '+table_name;
      let fields = '';

      // Determine the field
      for(let field_name in structure) {
        if(weird_chars.exec(field_name)) {
          callback(new Error('Special characters "'+field_name+'" are not allowed.'));
          fields = null;
          break;
        }
        else {
          fields = fields + field_name +' '+structure[field_name].type;
          if(structure[field_name].iskey) {
            keys.push(field_name);
          }
        }
      }

      // setup PRIMARY keys
      sql = sql + '(' + fields + ') ';
      if(keys.length) {
        sql = sql + 'PRIMARY KEY (';
        for(i in keys) {
          if(i = keys.length-1) {
            sql = sql + keys[i]+', ';
          }
          else {
            sql = sql + keys[i];
          }
        };
        sql = sql + ')';
      }
      if(fields != null) {

        _db.query(sql, callback);
      }
    }
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
