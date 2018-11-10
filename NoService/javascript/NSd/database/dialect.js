// NoService/NSd/database/dialect.js
// Description: sql statements are supposed to stay only this file.
// "database.js" provides interface to manage database stuff.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';

const weird_chars = /[-!$%^&*()+|~=`{}\[\]:";'<>?,.\/]/;

function Sqlite3() {

}

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

  this.getRows = (table_name, select_query, callback)=> {
    db.query('CREATE TABLE');
  };

  this.getAllRows = (table_name, callback)=> {

  };

  this.replaceRows = (table_name, select_query, callback)=> {

  };

  // appendRows and generate ordered new int index
  this.appendRows = (table_name, rows_dict, idx_id, callback)=> {
    if(idx_id) {
      let max_idx;

    }
    else {
      let sql = 'INSERT INTO '+table_name;
      let fields_str = '';
      let rows = [];

      let fields_keys = Object.keys(rows_dict);

      for(let idx in fields_keys) {
        rows.push(rows_dict[fields_keys[idx]]);
        if(idx == fields_keys.length-1) {
          fields_str += fields_keys[idx];
        }
        else {
          fields_str += fields_keys[idx] + ', ';
        }
      };

      sql = sql+'('+fields_str+') VALUES ?';

      _db.query(sql, [rows]);
    }
  };

  this.createTable = (table_name, structure, callback)=> {

    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters of table name are not allowed.'));
    }
    else {
      let keys = [];
      let sql = 'CREATE TABLE '+table_name;
      let fields_str = '';

      // Determine the field
      for(let field_name in structure) {
        if(weird_chars.exec(field_name)) {
          callback(new Error('Special characters "'+field_name+'" are not allowed.'));
          fields_str = null;
          break;
        }
        else {
          fields_str = fields_str + field_name +' '+structure[field_name].type;
          if(structure[field_name].iskey) {
            keys.push(field_name);
          }
        }
      }

      // setup PRIMARY keys
      sql = sql + '(' + fields_str + ') ';
      if(keys.length) {
        sql = sql + 'PRIMARY KEY (';
        for(i in keys) {
          if(i == keys.length-1) {
            sql = sql + keys[i]+', ';
          }
          else {
            sql = sql + keys[i];
          }
        };
        sql = sql + ')';
      }
      if(fields_str != null) {

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
  Mariadb: Mariadb,
  MySQL: Mariadb
};
