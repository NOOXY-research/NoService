// NoService/NSd/database/dialect.js
// Description:
// sql statements are supposed to stay only this file.
// "database.js" provides interface to manage database stuff.
// Here are standardized functions for calling wrapped sql statement.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';

// Preventing SQL injection, Regex.
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

  this.addFields = (table_name, callback)=> {

  };

  this.removeFields = (table_name, callback)=> {

  };

  this.hasField = (table_name, callback)=> {

  };

  this.removeRows = (table_name, select_query, callback)=> {

  };

  this.getRows = (table_name, [select_query, select_query_values], callback)=> {
    if(weird_chars.exec(table_name)||weird_chars.exec(select_query)) {
      callback(new Error('Special characters are not allowed.'));
    }
    else {
      if(select_query_values) {
        db.query('SELECT * FROM '+table_name+' WHERE '+select_query, select_query_values, callback);
      }
      else {
        db.query('SELECT * FROM '+table_name+' WHERE '+select_query, callback);
      }
    }
  };

  this.getAllRows = (table_name, callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters "'+idx_id+'" are not allowed.'));
    }
    else {
      db.query('SELECT * FROM '+table_name, callback);
    }
  };

  this.replaceRow = (table_name, row_dict, [select_query, select_query_values], callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters "'+idx_id+'" are not allowed.'));
    }
    else {
      let sql = 'UPDATE '+table_name+' SET ';
      let values = [];
      sql += Object.keys(row_dict).join('=?, ')+'=? WHERE '+select_query;
      for(let field in row_dict) {
        values.push(row_dict[field]);
      }
      db.query(sql, values, callback);
    }
  };

  this.addUniqueRow = (table_name, callback)=> {

  };

  // appendRows and generate ordered new int index
  this.appendRows = (table_name, rows_dict_list, idx_id, callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters "'+idx_id+'" are not allowed.'));
    }
    else {
      if(idx_id) {
        if(weird_chars.exec(idx_id)) {
          callback(new Error('Special characters "'+idx_id+'" are not allowed.'));
        }
        else {
          let left = rows_dict_list.length;
          let call_callback = (err)=> {
            left--;
            if(left == 0 || err) {
              callback(err);
              left = -1;
            }
          };

          for(let index in rows_dict_list) {
            let row = rows_dict_list[index];
            let sql = 'INSERT INTO '+table_name;
            let fields_str = Object.keys(row).join(', ');
            let q = '';
            let values = [];

            for(let field_name in row) {
              values.push(row[field_name]);
              q = q +'? ';
            }
            sql = sql+'('+fields_str+', '+idx_id+') VALUES ('+q+', SELECT MAX('+idx_id+')+1 from '+table_name+')';
            _db.query(sql, values, call_callback);
          }
        }

      }
      else {
        let left = rows_dict_list.length;
        let call_callback = (err)=> {
          left--;
          if(left == 0 || err) {
            callback(err);
            left = -1;
          }
        };

        for(let index in rows_dict_list) {
          let row = rows_dict_list[index];
          let sql = 'INSERT INTO '+table_name;
          let fields_str = Object.keys(row).join(', ');
          let q = '';
          let values = [];

          for(let field_name in row) {
            values.push(row[field_name]);
            q = q +'? ';
          }
          sql = sql+'('+fields_str+') VALUES ('+q+')';
          _db.query(sql, values, call_callback);
        }
      }
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
  MySQL: Mariadb,
  Sqlite3: Sqlite3,
  PostgresSQL: PostgresSQL
};
