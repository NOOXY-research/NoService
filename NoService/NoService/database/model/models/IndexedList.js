// NoService/NoService/database/models/IndexedList.js
// Description:
// "IndexedList.js" For something like messages or logs need ordered index.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

Utils = require('../../../library').Utilities;

// For something like messages or logs need ordered index.
function IndexedListModel(db, table_name, model_key, structure, do_timestamp) {
  this.modeltype = 'IndexedList';
  this.ModelType = this.modeltype;

  this.searchAll = (keyword, callback)=> {
    let sql = '';
    let column_list = Object.keys(structure);
    sql = column_list.join(' LIKE ? OR ');
    sql = sql + ' LIKE ?';
    db.getRows(table_name, sql, column_list.map(v=>{return keyword}), callback);
  };

  this.searchColumns = (column_list, keyword, callback)=> {
    let sql = '';
    sql = column_list.join(' LIKE ? OR ');
    sql = sql + ' LIKE ?';
    db.getRows(table_name, sql, column_list.map(v=>{return keyword}), callback);
  };

  this.searchAllNRows = (keyword, N, callback)=> {
    let sql = '';
    let column_list = Object.keys(structure);
    sql = column_list.join(' LIKE ? OR ');
    sql = sql + ' LIKE ?';
    db.getRowsTopNRows(table_name, sql, column_list.map(v=>{return keyword}), N, callback);
  };

  this.searchColumnsNRows = (column_list, keyword, N, callback)=> {
    let sql = '';
    sql = column_list.join(' LIKE ? OR ');
    sql = sql + ' LIKE ?';
    db.getRowsTopNRows(table_name, sql, column_list.map(v=>{return keyword}), N, callback);
  };

  // get an instense
  this.get = (key_value, callback)=> {
    db.getRows(table_name, model_key+' LIKE ?', [key_value], (err, results)=> {
      if(results) {
        callback(err, results[0]);
      }
      else {
        callback(err);
      }
    });
  };

  this.getWhere = (where, query_values, callback)=> {
    db.getRows(table_name, where, query_values, (err, results)=> {
      if(results) {
        callback(err, results);
      }
      else {
        callback(err);
      }
    });
  };

  this.replaceRows = (rows, callback)=> {
    if(do_timestamp) {
      let datenow = Utils.DatetoSQL(new Date());
      for(let i in rows) {
        (rows[i])['modifydate'] = datenow;
      }
    }
    db.replaceRows(table_name, rows, callback);
  };

  this.updateRows = (rows, callback)=> {
    let datenow;
    let left = rows.length;
    let call_callback = (err)=> {
        left--;
        if((left === 0 || err)&&(left >= 0)) {
          callback(err);
          left = -1;
        }
    };
    if(do_timestamp) {
      datenow = Utils.DatetoSQL(new Date());
    }
    for(let i in rows) {
      let properties_dict = rows[i];
      if(properties_dict[model_key]) {
        if(do_timestamp) {
          properties_dict['modifydate'] = datenow;
        }
        db.updateRows(table_name, model_key+' LIKE ?', [properties_dict[model_key]], properties_dict, call_callback);
      }
      else {
        call_callback(new Error('Key "'+model_key+'" is required.'));
      }
    };
  };

  this.deleteRows = (begin, end, callback)=> {
    db.deleteRows(table_name, model_key+' >= ? AND '+model_key+' <= ?', [begin, end], callback);
  };

  this.appendRows = (rows, callback)=> {
    // db.getRows(table_name, 'MAX('+model_key+')', [], (err, results)=> {
    //
    // });
    if(do_timestamp) {
      let datenow = Utils.DatetoSQL(new Date());
      for(let i in rows) {
        rows[i].createdate = datenow;
        rows[i].modifydate = datenow;
      }
    }
    db.appendRows(table_name, rows, callback);
  };

  this.getLatestNRows = (n, callback)=> {
    db.getRows(table_name, model_key+' > ((SELECT max('+model_key+') FROM '+table_name+') - ?)', [n], callback);
  };

  this.getRowsFromTo = (begin, end, callback)=> {
    db.getRows(table_name, model_key+' >= ? AND '+ model_key+' <= ?', [begin, end], callback);
  };

  this.getAllRows = (callback)=> {
    db.getAllRows(table_name, callback);
  };

  this.getLatestIndex = (callback)=> {
    db.getRows(table_name, model_key+' = (SELECT max('+model_key+') FROM '+table_name+')', (err, results)=> {
      if(err) {
        callback(err);
      }
      else if(results.length) {
        callback(err, (results[0])[model_key]);
      }
      else {
        callback(err);
      }
    });
  };

  this.addFields = (fields_dict, callback)=> {
    for(let field in fields_dict) {
      fields_dict[field] = {type: fields_dict[field]};
    }
    db.addFields(table_name, fields_dict, callback);
  };

  this.existField = (field_name, callback)=> {
    db.existField(table_name, field_name, callback);
  };

  this.removeFields = (fields_dict, callback)=> {
    db.removeFields(table_name, fields_dict, callback);
  };
};

module.exports = IndexedListModel;
