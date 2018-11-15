// NoService/NoService/authenticity.js
// Description:
// "authenticity.js" provide users authenticity base on sqldatabase.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

const crypto = require('crypto');
const Utils = require('./utilities');
const Vars = require('./variables');
const AUTHE_USER_MODEL_NAME = Vars.AUTHE_USER_MODEL_NAME;

// the authenticity module
function Authenticity() {

  let _model_module;
  let _user_model;
  const SHA256KEY = 'FATFROG';

  // Declare parameters
  this.TokenExpirePeriod = 7 // Days

  // import Module from specified path
  this.importModelModule = (model, callback) => {
    _model_module = model;
    _model_module.exist(AUTHE_USER_MODEL_NAME, (err, has_model)=> {
      if(!has_model) {
        _model_module.define(AUTHE_USER_MODEL_NAME, {
          model_type: "Pair",
          do_timestamp: true,
          model_key: ['username', 'userid'],
          structure: {
            username : 'VARCHAR(255)',
            userid : 'VARCHAR(255)',
            displayname : 'VARCHAR(255)',
            pwdhash: 'TEXT',
            token: 'VARCHAR(255)',
            tokenexpire : 'VARCHAR(255)',
            privilege : 'integer',
            detail : 'TEXT',
            firstname: 'VARCHAR(255)',
            lastname: 'VARCHAR(255)'
          }
        }, (err, user_model)=> {
          _user_model = user_model;
          callback(err);
        });
      }
      else {
        _model_module.get(AUTHE_USER_MODEL_NAME, (err, user_model)=> {
          _user_model = user_model;
          callback(false);
        });
      }
    });
  };


  this.getUserMeta = (username, callback) => {
    try {
      _user_model.getbyFirst(username.toLowerCase(), (err, [user_meta]) => {
        callback(false, user_meta);
      });
    }
    catch(e) {
      callback(e);
    }
  };

  this.getUserID = (username, callback) => {
    try {
      _user_model.getbyFirst(username.toLowerCase(), (err, [user_meta]) => {
        callback(err, user_meta.userid);
      });
    }
    catch(e) {
      callback(e);
    }

  };

  this.getUsernamebyId = (userid, callback) => {
    try {
      _user_model.getbySecond(userid, (err, [user_meta]) => {
        callback(false,  user_meta.username);
      });
    }
    catch(e) {
      callback(e);
    }

  };

  this.getUserExistence = (username, callback) => {
    _user_model.getbyFirst(username.toLowerCase(), (err, [user_meta]) => {
      if(user_meta != null) {
        callback(false, true);
      }
      else {
        callback(false, false);
      }
    });
  };

  this.createUser = (username, displayname, password, privilege, detail, firstname, lastname, callback) => {
    let pwdhash = null;
    username = username.toLowerCase();
    _user_model.getbyFirst(username, (err, list)=> {
      let user_meta = list[0];
      if(user_meta) {
        let err = new Error("User existed.");
        callback(err);
      }
      else if(Number.isInteger(privilege) == false) {
        let err = new Error("Privilege invalid.");
        callback(err);
      }
      else if(username.length < 5 || username == null || / /.test(username) || !Utils.isEnglish(username)) {
        let err = new Error("Username invalid.");
        callback(err);
      }
      else if(firstname.length < 2 || firstname == null || /\d/.test(firstname)) {
        let err = new Error("First name invalid.");
        callback(err);
      }
      else if(lastname.length < 2 || lastname == null || /\d/.test(lastname)) {
        let err = new Error("Last name invalid.");
        callback(err);
      }
      else if(password == null) {
        let err = new Error("Password invalid.");
        callback(err);
      }
      else if(password.length < 5) {
        let err = new Error("Password must be longer then or equal to 5.");
        callback(err);
      }
      else {
        let expiredate = new Date();
        expiredate = Utils.addDays(expiredate, this.TokenExpirePeriod);
        _user_model.create({
          userid: Utils.generateGUID(),
          username: username,
          displayname: displayname,
          pwdhash: crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex'),
          token: Utils.generateGUID(),
          tokenexpire: Utils.DatetoSQL(expiredate),
          privilege: privilege,
          detail: detail,
          firstname: firstname,
          lastname: lastname
        }, callback);
      }
    });
  };

  this.deleteUser = (username, callback) => {
    if(Vars.default_user.username != username) {
      _user_model.removebyFirst(username.toLowerCase(), (err) => {
        callback(err);
      });
    }
    else {
      callback(true);
    }
  };

  this.updatePassword = (username, newpassword, callback) => {
    if(newpassword != null && newpassword.length >= 5) {
      _user_model.replacebyFirst(username.toLowerCase(), {
        pwdhash: crypto.createHmac('sha256', SHA256KEY).update(newpassword).digest('hex')
      },
      (err)=> {
        if(err) {
          callback(err);
        }
        else {
          this.updateToken(username, callback);
        }
      });
    }
    else {
      let err = new Error("Password must be longer then or equal to 5.");
      callback(err);
    }
  };

  this.updatePrivilege = (username, privilege, callback) => {
    if(Number.isInteger(parseInt(privilege))) {
      _user_model.replacebyFirst(username.toLowerCase(), {
        privilege: parseInt(privilege)
      },
      (err)=> {
        callback(err);
      });
    }
    else {
      let err = new Error("Privilege level is not a Int.");
      callback(err);
    }
  };

  this.updateName = (username, firstname, lastname, callback) => {
    if(firstname == null || /\d/.test(firstname)) {
      let err = new Error(firstname+"First name invalid.");
      callback(err);
    }
    else if(lastname == null || /\d/.test(lastname)) {
      let err = new Error("Last name invalid.");
      callback(err);
    }
    else {
      _user_model.replacebyFirst(username.toLowerCase(), {
        firstname: firstname,
        lastname: lastname
      }, callback);
    }
  };

  this.PasswordisValid = (username, password, callback) => {
    let isValid = false;
    _user_model.getbyFirst(username.toLowerCase(), (err, [user_meta])=> {
      let pwdhash = user_meta.pwdhash;
      let pwdhashalpha = crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex');
      if(pwdhash == pwdhashalpha) {
        isValid = true;
      }
      callback(false, isValid);
    });
  };

  this.TokenisValid = (username, token, callback) => {
    if(token != null && username!=null && token.length > 10) {
      let err = false;
      let isValid = false;
      _user_model.getbyFirst(username.toLowerCase(), (err, [user_meta])=> {
        let now = new Date();
        let expiredate = Utils.SQLtoDate(user_meta.tokenexpire);
        if(now > expiredate|| token != user_meta.token) {
          callback(err, false);
        }
        else {
          callback(err, true);
        }
      });
    }
    else {
      callback(false, false);
    }
  };

  this.updateToken = (username, callback) => {
    let token = Utils.generateGUID();
    let expiredate = new Date();
    expiredate = Utils.addDays(expiredate, this.TokenExpirePeriod);
    _user_model.replacebyFirst(username.toLowerCase(), {
      token: token,
      tokenexpire: Utils.DatetoSQL(expiredate)
    }, ()=> {
      if(!err) {
        callback(err, token);
      }
      else {
        callback(err);
      }
    });
  }

  this.getUserToken = (username, password, callback) => {
    this.PasswordisValid(username, password, (err, valid) => {
      if(valid) {
        _user_model.getbyFirst(username.toLowerCase(), (err, [user_meta])=>{
          let now = new Date();
          let expiredate = Utils.SQLtoDate(user_meta.tokenexpire);
          if(now > expiredate) {
            this.updateToken(username, (err, token) => {
              callback(err, token);
            });
          }
          else {
            callback(false, user_meta.token);
          }
        });
      }
      else {
        callback(true);
      }
    })

  };

  this.getUserPrivilege = (username, callback) => {
    _user_model.getbyFirst(username.toLowerCase(), (err, [user_meta]) => {
      if(user_meta) {
        callback(err, user_meta.privilege);
      }
      else {
        callback(new Error('User not exist.'));
      }
    });
  };

  this.close = () => {
    _model_module = null;
    _user_model = null;
  };
};
module.exports = Authenticity;
