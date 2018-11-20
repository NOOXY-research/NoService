// NoService/NoService/database/dialect.js
// Description:
// sql statements are supposed to stay only this file.
// "database.js" provides interface to manage database stuff.
// Here are standardized functions for calling wrapped sql statement.
// Copyright 2018 NOOXY. All Rights Reserved.

// Functions to be implemented
// connect
// createFields
// removeFields
// existField
// deleteRows
// getRows
// getAllRows
// replaceRows
// updateRows
// appendRows
// dropTable
// createTable
// existTable
// createreplaceRow
// searchRows
// close

'use strict';

// Preventing SQL injection, Regex.
const weird_chars = /[-!$%^&*()+|~=`{}\[\]:";'<>?,.\/]/;

function Sqlite3(meta) {
  let _db;
  this.connect = (callback)=> {
    _db = new (require('sqlite3').Database)(meta.storage);
    callback(false);
  };

  this.createFields = (table_name, structure, callback)=> {
    for(let field_name in structure) {
      let sql = 'ALTER TABLE '+table_name+' ADD '+field_name +' '+structure[field_name].type+(structure[field_name].notnull?' NOT NULL':'');
      _db.all(sql, (err)=> {
        if(err) {
          callback(err);
        }
        else {
          if(structure[field_name].iskey) {
            _db.all('ALTER TABLE '+table_name+' ADD PRIMARY KEY ('+field_name+')', callback);
          }
          else {
            callback(err);
          }
        }
      });
    }
  };

  this.removeFields = (table_name, field_list, callback)=> {

  };

  this.existField = (table_name, field_name, callback)=> {
    if(weird_chars.exec(table_name)||weird_chars.exec(field_name)) {
      callback(new Error('Special characters of table name are not allowed.'));
    }
    else {
      let sql = 'SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = \''+meta.database+'\' AND TABLE_NAME = \''+table_name+'\' AND COLUMN_NAME = \''+field_name+'\'';
      _db.all(sql, (err, results)=> {
        if(result.length) {
          callback(err, true);
        }
        else {
          callback(err, false);
        }
      });
    }
  };

  this.deleteRows = (table_name, select_query, select_query_values, callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters are not allowed.'));
    }
    else {
      if(select_query_values) {
        _db.all('DELETE FROM '+table_name+' WHERE '+select_query, select_query_values, callback);
      }
      else {
        _db.all('DELETE FROM '+table_name+' WHERE '+select_query, callback);
      }
    }
  };

  this.getRows = (table_name, select_query, select_query_values, callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters are not allowed.'));
    }
    else {
      if(select_query_values) {
        _db.all('SELECT * FROM '+table_name+' WHERE '+select_query, select_query_values, callback);
      }
      else {
        _db.all('SELECT * FROM '+table_name+' WHERE '+select_query, callback);
      }
    }
  };

  this.getAllRows = (table_name, callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters "'+idx_id+'" are not allowed.'));
    }
    else {
      _db.all('SELECT * FROM '+table_name, callback);
    }
  };

  this.updateRows = (table_name, select_query, select_query_values, row_dict, callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters "'+table_name+'" are not allowed.'));
    }
    else {
      let sql = 'UPDATE '+table_name+' SET '+(Object.keys(row_dict)).join('=?, ')+'=? WHERE '+select_query;
      let values = [];
      for(let field in row_dict) {
        values.push(row_dict[field]);
      }
      values = values.concat(select_query_values);
      _db.all(sql, values, callback);
    }
  };

  this.replaceRows = (table_name, rows_dict_list, callback)=> {

    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters "'+table_name+'" are not allowed.'));
    }
    else {
      let left = rows_dict_list.length;
      let call_callback = (err)=> {
          left--;
          if((left == 0 || err)&&(left >= 0)) {
            callback(err);
            left = -1;
          }
      };
      for(let i in rows_dict_list) {
        let row_dict = rows_dict_list[i];
        let sql = 'REPLACE INTO  '+table_name+'('+Object.keys(row_dict).join(', ')+') ';
        let values = [];
        let q = [];
        for(let field in row_dict) {
          values.push(row_dict[field]);
          q.push('?');
        }
        sql += 'VALUES ('+q.join(', ')+');'
        _db.all(sql, values, call_callback);
      };
    };
  };

  this.insertUniqueRow = (table_name, row_dict, [select_query, select_query_values], callback)=> {

  };

  // appendRows and generate ordered new int index
  this.appendRows = (table_name, rows_dict_list, callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters "'+idx_id+'" are not allowed.'));
    }
    else {
      let left = rows_dict_list.length;
      let call_callback = (err)=> {
        left--;
        if((left == 0 || err)&&(left >= 0)) {
          callback(err);
          left = -1;
        }
      };

      for(let index in rows_dict_list) {
        let row = rows_dict_list[index];
        let sql = 'INSERT INTO '+table_name;
        let fields_str = Object.keys(row).join(', ');
        let q = [];
        let values = [];

        for(let field_name in row) {
          values.push(row[field_name]);
          q.push('?');
        }
        sql = sql+'('+fields_str+') VALUES ('+q.join(', ')+')';
        console.log(sql, values);
        _db.all(sql, values, call_callback);
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
      let fields_str_list = [];

      // Determine the field
      for(let field_name in structure) {
        if(weird_chars.exec(field_name)) {
          callback(new Error('Special characters "'+field_name+'" are not allowed.'));
          fields_str_list = null;
          break;
        }
        else {
          fields_str_list.push(field_name +' '+structure[field_name].type+(structure[field_name].notnull?' NOT NULL':''));
          if(structure[field_name].iskey) {
            keys.push(field_name);
          }
        }
      }

      // setup PRIMARY keys
      sql = sql + '(' + fields_str_list.join(', ') ;
      if(keys.length) {
        sql = sql + ', PRIMARY KEY ('+keys.join(', ')+')';
      }
      sql = sql + ') ';
      if(fields_str_list != null) {
        _db.all(sql, callback);
      }
    }
  };

  this.existTable = (table_name, callback)=> {
    _db.all('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\''+table_name+'\';', (err, result)=> {
      callback(err, result==null?false:(result[0]==null?false:true));
    });
  };

  this.dropTable = (table_name, callback)=> {
    _db.all('DROP TABLE '+table_name+';', (err, result)=> {
      callback(err);
    });
  };

  this.query = (...args)=> {
    _db.all.apply(null, args);
  }

  this.close = ()=> {
    _db.end();
  }
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
            _db.changeUser({database : meta.database}, (err)=> {
              if (err) {
                console.log(err);
              };
              callback(err);
            });
          }
        });
      }
    });
  };

  this.createFields = (table_name, structure, callback)=> {
    for(let field_name in structure) {
      let sql = 'ALTER TABLE '+table_name+' ADD '+field_name +' '+structure[field_name].type+(structure[field_name].notnull?' NOT NULL':'')+(structure[field_name].autoincrease?' AUTO_INCREMENT':'');
      _db.query(sql, (err)=> {
        if(err) {
          callback(err);
        }
        else {
          if(structure[field_name].iskey) {
            _db.query('ALTER TABLE '+table_name+' ADD PRIMARY KEY ('+field_name+')', callback);
          }
          else {
            callback(err);
          }
        }
      });
    }
  };

  this.removeFields = (table_name, field_list, callback)=> {

  };

  this.existField = (table_name, field_name, callback)=> {
    if(weird_chars.exec(table_name)||weird_chars.exec(field_name)) {
      callback(new Error('Special characters of table name are not allowed.'));
    }
    else {
      let sql = 'SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = \''+meta.database+'\' AND TABLE_NAME = \''+table_name+'\' AND COLUMN_NAME = \''+field_name+'\'';
      _db.query(sql, (err, results)=> {
        if(result.length) {
          callback(err, true);
        }
        else {
          callback(err, false);
        }
      });
    }
  };

  this.deleteRows = (table_name, select_query, select_query_values, callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters are not allowed.'));
    }
    else {
      if(select_query_values) {
        _db.query('DELETE FROM '+table_name+' WHERE '+select_query, select_query_values, callback);
      }
      else {
        _db.query('DELETE FROM '+table_name+' WHERE '+select_query, callback);
      }
    }
  };

  this.getRows = (table_name, select_query, select_query_values, callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters are not allowed.'));
    }
    else {
      if(select_query_values) {
        _db.query('SELECT * FROM '+table_name+' WHERE '+select_query, select_query_values, callback);
      }
      else {
        _db.query('SELECT * FROM '+table_name+' WHERE '+select_query, callback);
      }
    }
  };

  this.getAllRows = (table_name, callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters "'+idx_id+'" are not allowed.'));
    }
    else {
      _db.query('SELECT * FROM '+table_name, callback);
    }
  };

  this.updateRows = (table_name, select_query, select_query_values, row_dict, callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters "'+table_name+'" are not allowed.'));
    }
    else {
      let sql = 'UPDATE '+table_name+' SET '+(Object.keys(row_dict)).join('=?, ')+'=? WHERE '+select_query;
      let values = [];
      for(let field in row_dict) {
        values.push(row_dict[field]);
      }
      values = values.concat(select_query_values);
      _db.query(sql, values, callback);
    }
  };

  this.replaceRows = (table_name, rows_dict_list, callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters "'+table_name+'" are not allowed.'));
    }
    else {
      for(let i in rows_dict_list) {
        let row_dict = rows_dict_list[i];
        let sql = 'REPLACE INTO  '+table_name+'('+Object.keys(row_dict).join(', ')+') ';
        let values = [];
        let q = [];
        for(let field in row_dict) {
          values.push(row_dict[field]);
          q.push('?');
        }
        sql += 'VALUES ('+q.join(', ')+');'
        _db.query(sql, values, callback);
      };
    }
  };

  // appendRows and generate ordered new int index
  this.appendRows = (table_name, rows_dict_list, callback)=> {
    if(weird_chars.exec(table_name)) {
      callback(new Error('Special characters "'+idx_id+'" are not allowed.'));
    }
    else {
        let left = rows_dict_list.length;
        let call_callback = (err)=> {
          left--;
          if((left == 0 || err)&&(left >= 0)) {
            callback(err);
            left = -1;
          }
        };

        for(let index in rows_dict_list) {
          let row = rows_dict_list[index];
          let sql = 'INSERT INTO '+table_name;
          let fields_str = Object.keys(row).join(', ');
          let q = [];
          let values = [];

          for(let field_name in row) {
            values.push(row[field_name]);
            q.push('?');
          }
          sql = sql+'('+fields_str+') VALUES ('+q.join(', ')+')';
          _db.query(sql, values, call_callback);
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
      let fields_str_list = [];

      // Determine the field
      for(let field_name in structure) {
        if(weird_chars.exec(field_name)) {
          callback(new Error('Special characters "'+field_name+'" are not allowed.'));
          fields_str_list = null;
          break;
        }
        else {
          fields_str_list.push(field_name +' '+structure[field_name].type+(structure[field_name].notnull?' NOT NULL':'')+(structure[field_name].autoincrease?' AUTO_INCREMENT':''));
          if(structure[field_name].iskey) {
            keys.push(field_name);
          }
        }
      }

      // setup PRIMARY keys
      sql = sql + '(' + fields_str_list.join(', ') ;
      if(keys.length) {
        sql = sql + ', PRIMARY KEY ('+keys.join(', ')+')';
      }
      sql = sql + ') ';
      if(fields_str_list != null) {
        _db.query(sql, callback);
      }
    }
  };

  this.existTable = (table_name, callback)=> {
    _db.query('SHOW TABLES LIKE \''+table_name+'\';', (err, result)=> {
      callback(err, result==null?false:(result[0]==null?false:true));
    });
  };

  this.dropTable = (table_name, callback)=> {
    _db.query('DROP TABLE '+table_name+';', (err, result)=> {
      callback(err);
    });
  };

  this.query = (...args)=> {
    _db.query.apply(null, args);
  }

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
