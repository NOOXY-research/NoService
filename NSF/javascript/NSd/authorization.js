// NSF/NSd/authorization.js
// Description:
// "authorization.js" provide authorization actions.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

let Utils = require('./utilities');

// Handling responses to authorization requests.
function AuthorizationHandler() {
  let _implementation_module = null;
  let _daemon_auth_key = null;
  let _trusted_domains = [];

  let _implts_callback = {
    // Authby password
    'PW': (connprofile, data, data_sender) => {
      let AuthbyPassword = _implementation_module.returnImplement('AuthbyPassword');
      AuthbyPassword(connprofile, data, data_sender);
    },

    // Authby password failed
    'PF': (connprofile, data, data_sender) => {
      let AuthbyPasswordFailed = _implementation_module.returnImplement('AuthbyPasswordFailed');
      AuthbyPasswordFailed(connprofile, data, data_sender);
    },

    // Authby token
    'TK': (connprofile, data, data_sender) => {
      let AuthbyToken = _implementation_module.returnImplement('AuthbyToken');
      AuthbyToken(connprofile, data, data_sender);
    },

    // Authby token failed
    'TF': (connprofile, data, data_sender) => {
      let AuthbyTokenFailed = _implementation_module.returnImplement('AuthbyTokenFailed');
      AuthbyTokenFailed(connprofile, data, data_sender);
    },

    // Sign in
    'SI': (connprofile, data, data_sender) => {
      let Signin = _implementation_module.returnImplement('signin');
      Signin(connprofile, data, data_sender);
    },

    'AF': ()=>{

    }
  };

  this.RqRouter = (connprofile, data, data_sender) => {
    _implts_callback[data.m](connprofile, data, data_sender);
  };

  this.importImplementationModule = (implementation_module) => {
    _implementation_module = implementation_module;
  };

  this.close = () =>{

  }
};

// Serverside authorization emitter.
function Authorization() {
  let _realtime_token = null;
  let _trusted_domains = [];
  let _authe_module = null;
  let _entity_module = null;
  let _auth_timeout = 180;
  let _daemon_auth_key = null;
  let _queue_operation = {};

  this.emitRouter = () => {console.log('[*ERR*] emit not implemented');};

  this.RsRouter = (connprofile, data) => {
    try {
      let op = _queue_operation[data.d.t];
      op(connprofile, data);
      delete _queue_operation[data.d.t];
    }
    catch (e) {
      console.log(e);
    }
  };

  // function that import working authenticity module.
  this.importAuthenticityModule = (authe_module) => {
    _authe_module = authe_module;
  };
  //
  this.importEntityModule = (entity_module) => {
    _entity_module = entity_module;
  };

  this.importTrustDomains = (domain_list) => {
    _trusted_domains = domain_list;
  };

  //
  let _checkhaveusername = (entityID, callback, next) => {
    let user = _entity_module.returnEntityValue(entityID, 'owner');
    if(user == null) {
      callback(false, false);
      _entity_module.getEntityConnProfile(entityID, (err, connprofile) => {
        this.emitRouter(connprofile, 'AU', {m: 'SI'});
      });
    }
    else {
      next();
    }
  }

  // Authby group
  this.Authby = {
    Password : (entityID, callback) => {
      let mode = _entity_module.returnEntityValue(entityID, 'mode');
      if(mode == 'normal') {
        _checkhaveusername(entityID, callback, ()=>{
          let user = _entity_module.returnEntityValue(entityID, 'owner');
          let data = {
            m: "PW",
            d: {t: Utils.generateGUID()}
          }
          _entity_module.getEntityConnProfile(entityID, (err, connprofile) => {
            let op = (connprofile, data) => {
                _authe_module.PasswordisValid(user, data.d.v, (err, isValid) => {
                  if(isValid) {
                    callback(false, true);
                  }
                  else {
                    this.emitRouter(connprofile, 'AU', {m: 'PF'});
                    callback(false, false);
                  }
                });
            }
            _queue_operation[data.d.t] = op;
            // set the timeout of this operation
            setTimeout(() => {if(_queue_operation[data.d.t]) {delete _queue_operation[data.d.t]}}, _auth_timeout*1000);
            this.emitRouter(connprofile, 'AU', data);
          });
        });
      }
      else {
        this.Authby.DaemonAuthKey(entityID, (err, pass) => {
          if(pass) {
            callback(false, true);
          }
          else {
            callback(false, false);
          }
        });
      }
    },

    Action : (entityID, action_meta_data, callback) =>{

    },

    Token : (entityID, callback) =>{
      let mode = _entity_module.returnEntityValue(entityID, 'mode');
      if(mode == 'normal') {
        _checkhaveusername(entityID, callback, ()=>{
          let user = _entity_module.returnEntityValue(entityID, 'owner');
          let data = {
            m: "TK",
            d: {t: Utils.generateGUID()}
          }
          _entity_module.getEntityConnProfile(entityID, (err, connprofile) => {
            let _authonline = ()=> {
              let op = (connprofile, data) => {
                _authe_module.TokenisValid(user, data.d.v, (err, isValid) => {
                  if(isValid) {
                    connprofile.setBundle('NSToken', data.d.v);
                    callback(false, true);
                  }
                  else {
                    this.emitRouter(connprofile, 'AU', {m: 'TF'});
                    callback(false, false);
                  }
                });
              }
              _queue_operation[data.d.t] = op;
              // set the timeout of clearing expired authorization.
              setTimeout(() => {delete _queue_operation[data.d.t]}, _auth_timeout*1000);
              this.emitRouter(connprofile, 'AU', data);
            };

            let tk = connprofile.returnBundle('NSToken');
            if(tk != null) {
              _authe_module.TokenisValid(user, tk, (err, isValid) => {
                if(isValid) {
                  callback(false, true);
                }
                else {
                  _authonline();
                }
              });
            }
            else {
              _authonline();
            }
          });
        });
      }
      else {
        this.Authby.DaemonAuthKey(entityID, (err, pass) => {
          if(pass) {
            callback(false, true);
          }
          else {
            callback(false, false);
          }
        });
      }
    },

    // smaller have more privilege
    isSuperUser : (entityID, callback) =>{
      _checkhaveusername(entityID, callback, ()=>{
        let _owner = _entity_module.returnEntityOwner(entityID);
        _authe_module.getUserprivilege(_owner, (err, level) => {
          if(level == 0) {
            // isSuperUser
            callback(false, true);
          }
          else {
            //is not
            callback(false, false);
          }
        });
      });
    },

    isSuperUserwithToken: (entityID, callback) =>{
      _checkhaveusername(entityID, callback, ()=>{
        this.Authby.isSuperUser(entityID, (err, pass) => {
          if(pass) {
            this.Authby.Token(entityID, (err, pass) => {
              callback(err, pass);
            })
          }
          else {
            callback(err, pass);
          }
        });
      });
    },

    Domain : (entityID, callback) => {
      if(_trusted_domains.includes(_entity_module.returnEntityValue(entityID, 'spwandomain'))) {
        callback(false, true);
      }
      else {
        callback(false, false);
      }
    },

    DaemonAuthKey: (entityID, callback)=> {
      this.Authby.Domain(entityID, (err, pass) => {
        if(pass) {
          if(_daemon_auth_key == _entity_module.returnEntityValue(entityID, 'daemonauthkey')) {
            callback(false, true);
          }
          else {
            callback(false, false);
          }
        }
        else {
          callback(false, false);
        }
      });
    }
  }

  this.importTrustedDomains = (domains) => {
    _trusted_domains = _trusted_domains.concat(domains);
  }

  this.importDaemonAuthKey = (key) =>{
    _daemon_auth_key = key;
  };

  this.getRealtimeToken = (callback) => {callback(_realtime_token);}

  this.close = () =>{
    _queue_operation = null;
  }
};

module.exports = {
  Authorization:Authorization,
  AuthorizationHandler: AuthorizationHandler
};
