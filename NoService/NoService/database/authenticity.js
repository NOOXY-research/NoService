// NoService/NoService/authenticity.js
// Description:
// "authenticity.js" provide users authenticity base on sqldatabase.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const crypto = require('crypto');
const Utils = require('../library').Utilities;

// the authenticity module
function Authenticity() {

  let _model_module;
  let _user_model_name;
  let _user_model;
  let _default_username;

  const SHA256KEY = 'FATFROG';

  // Declare parameters
  this.TokenExpirePeriod = 7 // Days

  // import Module from specified path
  this.importModelModule = (model, callback) => {
    _model_module = model;
    _model_module.exist(_user_model_name, (err, has_model)=> {
      if(err) {
        callback(err);
      }
      else {
        if(!has_model) {
          _model_module.define(_user_model_name, {
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
          _model_module.get(_user_model_name, (err, user_model)=> {
            _user_model = user_model;
            callback(false);
          });
        }
      }
    });
  };

  this.setDefaultUsername = (username)=> {
    _default_username = username;
  };

  this.setUserModelName = (model_name)=> {
    _user_model_name = model_name;
  };


  this.getUserIdByUsername = (username, callback) => {
    try {
      _user_model.getByFirst(username, (err, [user_meta]) => {
        if(user_meta) {
          callback(err, user_meta.userid);
        }
        else {
          callback(new Error('User not exist.'));
        }
      });
    }
    catch(e) {
      callback(e);
    }

  };

  this.getUsernameByUserId = (userid, callback) => {
    try {
      _user_model.getBySecond(userid, (err, [user_meta]) => {
        if(user_meta) {
          callback(false,  user_meta.username);
        }
        else {
          callback(new Error('User not exist.'));
        }
      });
    }
    catch(e) {
      callback(e);
    }
  };

  this.createUser = (username, displayname, password, privilege, detail, firstname, lastname, callback) => {
    let pwdhash;
    username = username?username.toLowerCase():''();
    _user_model.getByFirst(username, (err, list)=> {
      let user_meta = list[0];
      if(user_meta) {
        let err = new Error("User existed.");
        callback(err);
      }
      else if(Number.isInteger(privilege) === false) {
        let err = new Error("Privilege invalid.");
        callback(err);
      }
      else if(username.length < 5 || !username || / /.test(username) || !Utils.isEnglish(username)) {
        let err = new Error("Username invalid.");
        callback(err);
      }
      else if(firstname.length < 2 || !firstname || /\d/.test(firstname)) {
        let err = new Error("First name invalid.");
        callback(err);
      }
      else if(lastname.length < 2 || !lastname || /\d/.test(lastname)) {
        let err = new Error("Last name invalid.");
        callback(err);
      }
      else if(!password) {
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

  // By Username
  this.getUserMetaByUsername = (username, callback) => {
    try {
      _user_model.getByFirst(username?username.toLowerCase():''(), (err, [user_meta]) => {
        if(user_meta) {
          callback(false, user_meta);
        }
        else {
          callback(new Error('User not exist.'));
        }
      });
    }
    catch(e) {
      callback(e);
    }
  };

  this.getUserExistenceByUsername = (username, callback) => {
    _user_model.getByFirst(username?username.toLowerCase():''(), (err, [user_meta]) => {
      if(user_meta != null) {
        callback(false, true);
      }
      else {
        callback(false, false);
      }
    });
  };

  this.deleteUserByUsername = (username, callback) => {
    if(username === _default_username) {
      let err = new Error("Default user should not be deleted.");
      callback(err);
    }
    else {
      _user_model.removeByFirst(username?username.toLowerCase():''(), (err) => {
        callback(err);
      });
    }
  };

  this.updatePasswordByUsername = (username, newpassword, callback) => {
    if(newpassword != null && newpassword.length >= 5) {
      _user_model.update({
        username: username?username.toLowerCase():''(),
        pwdhash: crypto.createHmac('sha256', SHA256KEY).update(newpassword).digest('hex')
      },
      (err)=> {
        if(err) {
          callback(err);
        }
        else {
          this.updateTokenByUsername(username, callback);
        }
      });
    }
    else {
      let err = new Error("Password must be longer then or equal to 5.");
      callback(err);
    }
  };

  this.updatePrivilegeByUsername = (username, privilege, callback) => {
    if(username === _default_username) {
      let err = new Error("Default user should not change it's privilege.");
      callback(err);
    }
    else {
      if(Number.isInteger(parseInt(privilege))) {
        _user_model.update({
          username: username?username.toLowerCase():''(),
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
    }
  };

  this.updateNameByUsername = (username, firstname, lastname, callback) => {
    if(!firstname || /\d/.test(firstname)) {
      let err = new Error(firstname+"First name invalid.");
      callback(err);
    }
    else if(!lastname || /\d/.test(lastname)) {
      let err = new Error("Last name invalid.");
      callback(err);
    }
    else {
      _user_model.update({
        username: username?username.toLowerCase():''(),
        firstname: firstname,
        lastname: lastname
      }, callback);
    }
  };

  this.checkPasswordisValidByUsername = (username, password, callback) => {
    let isValid = false;
    _user_model.getByFirst(username?username.toLowerCase():''(), (err, [user_meta])=> {
      if(user_meta) {
        let pwdhash = user_meta.pwdhash;
        let pwdhashalpha = crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex');
        if(pwdhash === pwdhashalpha) {
          isValid = true;
        }
        callback(false, isValid);
      }
      else {
        callback(new Error('User not exist.'));
      }
    });
  };

  this.checkTokenisValidByUsername = (username, token, callback) => {
    if(token != null && username!=null && token.length > 10) {
      let err = false;
      let isValid = false;
      _user_model.getByFirst(username?username.toLowerCase():''(), (err, [user_meta])=> {
        if(user_meta) {
          let now = new Date();
          let expiredate = Utils.SQLtoDate(user_meta.tokenexpire);
          if(now > expiredate|| token != user_meta.token) {
            callback(err, false);
          }
          else {
            callback(err, true);
          }
        }
        else {
          callback(new Error('User not exist.'));
        }
      });
    }
    else {
      callback(false, false);
    }
  };

  this.updateTokenByUsername = (username, callback) => {
    let token = Utils.generateGUID();
    let expiredate = new Date();
    expiredate = Utils.addDays(expiredate, this.TokenExpirePeriod);
    _user_model.update({
      username: username?username.toLowerCase():''(),
      token: token,
      tokenexpire: Utils.DatetoSQL(expiredate)
    }, (err)=> {
      if(!err) {
        callback(err, token);
      }
      else {
        callback(err);
      }
    });
  }

  this.getUserTokenByUsername = (username, password, callback) => {
    this.checkPasswordisValidByUsername(username, password, (err, valid) => {
      if(valid) {
        _user_model.getByFirst(username?username.toLowerCase():''(), (err, [user_meta])=>{
          if(user_meta) {
            let now = new Date();
            let expiredate = Utils.SQLtoDate(user_meta.tokenexpire);
            if(now > expiredate) {
              this.updateTokenByUsername(username, (err, token) => {
                callback(err, token);
              });
            }
            else {
              callback(false, user_meta.token);
            }
          }
          else {
            callback(new Error('User not exist.'));
          }
        });
      }
      else {
        callback(true);
      }
    })

  };

  this.searchUsersByUsernameNRows = (username, N, callback) => {
    _user_model.searchColumnsNRows(['username'], username, N, (err, users) => {
      if(users) {
        callback(err, users);
      }
      else {
        callback(new Error('User not exist.'));
      }
    });
  };

  this.getUserPrivilegeByUsername = (username, callback) => {
    _user_model.getByFirst(username?username.toLowerCase():''(), (err, [user_meta]) => {
      if(user_meta) {
        callback(err, user_meta.privilege);
      }
      else {
        callback(new Error('User not exist.'));
      }
    });
  };

  // By UserId
  this.getUserMetaByUserId = (userid, callback) => {
    try {
      _user_model.getBySecond(userid, (err, [user_meta]) => {
        if(user_meta) {
          callback(false, user_meta);
        }
        else {
          callback(new Error('User not exist.'));
        }
      });
    }
    catch(e) {
      callback(e);
    }
  };

  this.getUserExistenceByUserId = (userid, callback) => {
    _user_model.getBySecond(userid, (err, [user_meta]) => {
      if(user_meta != null) {
        callback(false, true);
      }
      else {
        callback(false, false);
      }
    });
  };

  this.deleteUserByUserId = (userid, callback) => {
    _user_model.getBySecond(userid, (err, [user_meta]) => {
      if(user_meta) {
        username = user_meta.username;
        if(username === _default_username) {
          let err = new Error("Default user should not be deleted.");
          callback(err);
        }
        else {
          _user_model.removeBySecond(userid, (err) => {
            callback(err);
          });
        }
      }
      else {
        let err = new Error("User not exist.");
        callback(err);
      }
    });
  };

  this.updatePasswordByUserId = (userid, newpassword, callback) => {
    if(newpassword != null && newpassword.length >= 5) {
      _user_model.update({
        userid: userid,
        pwdhash: crypto.createHmac('sha256', SHA256KEY).update(newpassword).digest('hex')
      },
      (err)=> {
        if(err) {
          callback(err);
        }
        else {
          this.updateTokenByUserId(userid, callback);
        }
      });
    }
    else {
      let err = new Error("Password must be longer then or equal to 5.");
      callback(err);
    }
  };

  this.updatePrivilegeByUserId = (userid, privilege, callback) => {
    _user_model.getBySecond(userid, (err, [user_meta]) => {
      if(user_meta) {
        username = user_meta.username;
        if(username === _default_username) {
          let err = new Error("Default user should not change it's privilege.");
          callback(err);
        }
        else {
          if(Number.isInteger(parseInt(privilege))) {
            _user_model.update({
              username: username?username.toLowerCase():''(),
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
        }
      }
      else {
        let err = new Error("User not exist.");
        callback(err);
      }
    });
  };

  this.updateNameByUserId = (userid, firstname, lastname, callback) => {
    if(!firstname || /\d/.test(firstname)) {
      let err = new Error(firstname+"First name invalid.");
      callback(err);
    }
    else if(!lastname || /\d/.test(lastname)) {
      let err = new Error("Last name invalid.");
      callback(err);
    }
    else {
      _user_model.update({
        userid: userid,
        firstname: firstname,
        lastname: lastname
      }, callback);
    }
  };

  this.checkPasswordisValidByUserId = (userid, password, callback) => {
    let isValid = false;
    _user_model.getBySecond(userid, (err, [user_meta])=> {
      if(user_meta) {
        let pwdhash = user_meta.pwdhash;
        let pwdhashalpha = crypto.createHmac('sha256', SHA256KEY).update(password).digest('hex');
        if(pwdhash === pwdhashalpha) {
          isValid = true;
        }
        callback(false, isValid);
      }
      else {
        callback(new Error('User not exist.'));
      }
    });
  };

  this.checkTokenisValidByUserId = (userid, token, callback) => {
    if(token != null && username!=null && token.length > 10) {
      let err = false;
      let isValid = false;
      _user_model.getBySecond(userid, (err, [user_meta])=> {
        if(user_meta) {
          let now = new Date();
          let expiredate = Utils.SQLtoDate(user_meta.tokenexpire);
          if(now > expiredate|| token != user_meta.token) {
            callback(err, false);
          }
          else {
            callback(err, true);
          }
        }
        else {
          callback(new Error('User not exist.'));
        }
      });
    }
    else {
      callback(false, false);
    }
  };

  this.updateTokenByUserId = (userid, callback) => {
    let token = Utils.generateGUID();
    let expiredate = new Date();
    expiredate = Utils.addDays(expiredate, this.TokenExpirePeriod);
    _user_model.update({
      userid: userid,
      token: token,
      tokenexpire: Utils.DatetoSQL(expiredate)
    }, (err)=> {
      if(!err) {
        callback(err, token);
      }
      else {
        callback(err);
      }
    });
  }

  this.getUserTokenByUserId = (userid, password, callback) => {
    this.checkPasswordisValidByUserId(username, password, (err, valid) => {
      if(valid) {
        _user_model.getBySecond(userid, (err, [user_meta])=>{
          if(user_meta) {
            let now = new Date();
            let expiredate = Utils.SQLtoDate(user_meta.tokenexpire);
            if(now > expiredate) {
              this.updateTokenByUserId(useid, (err, token) => {
                callback(err, token);
              });
            }
            else {
              callback(false, user_meta.token);
            }
          }
          else {
            callback(new Error('User not exist.'));
          }
        });
      }
      else {
        callback(true);
      }
    })

  };

  this.getUserPrivilegeByUserId = (userid, callback) => {
    _user_model.getBySecond(userid, (err, [user_meta]) => {
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
