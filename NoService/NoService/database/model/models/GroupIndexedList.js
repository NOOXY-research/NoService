// NoService/NoService/database/models/GroupIndexedList.js
// Description:
// "GroupIndexedList.js" For something like different and huge amount of groups
// of messages or logs need ordered index.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

let Utils = require('../../../library').Utilities;

// For something like different and huge amount of groups of messages or logs need ordered index.
function GroupIndexedListModel(db, table_name, model_key, model_group_key, structure, do_timestamp) {
  this.modeltype = 'GroupIndexedList';
  this.ModelType = this.modeltype;

  this.existGroup = (group_name, callback)=> {
    db.getRows(table_name, model_group_key+' LIKE ?', [group_name], (err, results)=> {
      if(results) {
        callback(err, results[0]?true: false);
      }
      else {
        callback(err, false);
      }
    });
  };

  this.searchAll = (group_name, keyword, callback)=> {
    let sql = '(';
    let column_list = Object.keys(structure);
    sql = sql + column_list.join(' LIKE ? OR ');
    sql = sql + ' LIKE ? ) AND ('+model_group_key+' LIKE ?)';
    let values = column_list.map(v=>{return keyword});
    values.push(group_name);
    db.getRows(table_name, sql, values, callback);
  };

  this.searchColumns = (group_name, column_list, keyword, callback)=> {
    let sql = '(';
    sql = sql + column_list.join(' LIKE ? OR ');
    sql = sql + ' LIKE ? ) AND ('+model_group_key+' LIKE ?)';
    let values = column_list.map(v=>{return keyword});
    values.push(group_name);
    db.getRows(table_name, sql, values, callback);
  };

  this.searchAllNRows = (group_name, keyword, N, callback)=> {
    let sql = '(';
    let column_list = Object.keys(structure);
    sql = sql + column_list.join(' LIKE ? OR ');
    sql = sql + ' LIKE ? ) AND ('+model_group_key+' LIKE ?)';
    let values = column_list.map(v=>{return keyword});
    values.push(group_name);
    db.getRowsTopNRows(table_name, sql, values, N, callback);
  };

  this.searchColumnsNRows = (group_name, column_list, keyword, N, callback)=> {
    let sql = '(';
    sql = sql + column_list.join(' LIKE ? OR ');
    sql = sql + ' LIKE ? ) AND ('+model_group_key+' LIKE ?)';
    let values = column_list.map(v=>{return keyword});
    values.push(group_name);
    db.getRowsTopNRows(table_name, sql, values, N, callback);
  };

  // get an instense
  this.get = (group_name, index_value, callback)=> {
    db.getRows(table_name, model_group_key+' LIKE ? AND '+model_key+' LIKE ?', [group_name, index_value], (err, results)=> {
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

  this.replaceRows = (group_name, rows, callback)=> {
    if(do_timestamp) {
      let datenow = Utils.DatetoSQL(new Date());
      for(let i in rows) {
        (rows[i])['modifydate'] = datenow;
        (rows[i])[model_group_key] = group_name;
      }
    }
    else {
      for(let i in rows) {
        (rows[i])[model_group_key] = group_name;
      }
    }
    db.replaceRows(table_name, rows, callback);
  };

  this.updateRows = (group_name, rows, callback)=> {
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
          properties_dict[model_group_key] = group_name;
        }
        db.updateRows(table_name, model_group_key+' LIKE ? AND '+model_key+' LIKE ?', [group_name, properties_dict[model_key]], properties_dict, call_callback);
      }
      else {
        call_callback(new Error('Key "'+model_key+'" is required.'));
      }
    };
  };

  this.deleteRows = (group_name, begin, end, callback)=> {
    db.deleteRows(table_name, model_group_key+' LIKE ? AND '+model_key+' >= ? AND '+model_key+' <= ?', [group_name, begin, end], callback);
  };

  this.appendRows = (group_name, rows, callback)=> {
    // db.getRows(table_name, 'MAX('+model_key+')', [], (err, results)=> {
    //
    // });
    if(do_timestamp) {
      let datenow = Utils.DatetoSQL(new Date());
      for(let i in rows) {
        rows[i].createdate = datenow;
        rows[i].modifydate = datenow;
        (rows[i])[model_group_key] = group_name;
      }
    }
    else {
      for(let i in rows) {
        (rows[i])[model_group_key] = group_name;
      }
    }
    db.appendRowsandGroupAutoIncrease(table_name, [model_key, model_group_key], rows, callback);
  };

  this.appendRowsAllGroup = (rows, callback)=> {
    // not finished
  };

  this.getLatestNRows = (group_name, n, callback)=> {
    db.getRows(table_name, model_group_key+' LIKE ? AND '+model_key+' > ((SELECT max('+model_key+') FROM '+table_name+' WHERE '+model_group_key+' LIKE ?)- ?)', [group_name, group_name, n], callback);
  };

  this.getRowsFromTo = (group_name, begin, end, callback)=> {
    db.getRows(table_name, model_group_key+' LIKE ? AND '+model_key+' >= ? AND '+ model_key+' <= ?', [group_name, begin, end], callback);
  };

  this.getAllRows = (group_name, callback)=> {
    db.getRows(table_name, model_group_key+' LIKE ?', [group_name], callback);
  };

  this.getLatestIndex = (group_name, callback)=> {
    db.getRows(table_name, model_group_key+' LIKE ? AND '+model_key+' = (SELECT max('+model_key+') FROM '+table_name+' WHERE '+model_group_key+' LIKE ?)', [group_name, group_name], (err, results)=> {
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

module.exports = GroupIndexedListModel;
