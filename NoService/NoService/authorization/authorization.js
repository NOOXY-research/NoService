// NoService/NoService/authorization/authorization.js
// Description:
// "authorization.js" provide authorization actions.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const Utils = require('../library').Utilities;

// Serverside authorization emitter.
function Authorization() {
  let _realtime_token;
  let _trusted_domains = [];
  let _authe_module;
  let _entity_module;
  let _daemon_auth_key;
  let _on_handler = {};

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
  let _checkhaveusername = (entityId, callback, next) => {
    let user = _entity_module.returnEntityValue(entityId, 'owner');
    if(!user) {
      callback(false, false);
      _on_handler['SigninRq'](entityId);
    }
    else {
      next();
    }
  }

  // Authby group
  this.Authby = {
    Password : (entityId, callback) => {
      let mode = _entity_module.returnEntityValue(entityId, 'mode');
      if(mode === 'normal') {
        _checkhaveusername(entityId, callback, ()=>{
          _on_handler['AuthPasswordRq'](entityId, (err, password)=> {
            let user = _entity_module.returnEntityValue(entityId, 'owner');
            _authe_module.checkPasswordisValidByUsername(user, password, (err, isValid) => {
              if(isValid) {
                callback(false, true);
              }
              else {
                _on_handler['AuthbyPasswordFailed'](entityId);
                callback(false, false);
              }
            });
          });
        });
      }
      else {
        this.Authby.DaemonAuthKey(entityId, (err, pass) => {
          if(pass) {
            callback(false, true);
          }
          else {
            callback(false, false);
          }
        });
      }
    },

    Action : (entityId, action_meta_data, callback) =>{

    },

    Token : (entityId, callback) =>{
      let mode = _entity_module.returnEntityValue(entityId, 'mode');
      if(mode === 'normal') {
        _checkhaveusername(entityId, callback, ()=> {
          let user = _entity_module.returnEntityValue(entityId, 'owner');
          _entity_module.getEntityConnProfile(entityId, (err, connprofile) => {
            if(err) {
              console.log(err);
              callback(err);
            }
            else {
              let _authonline = ()=> {
                _on_handler['AuthTokenRq'](entityId, (err, token)=> {
                  _authe_module.checkTokenisValidByUsername(user, token, (err, isValid) => {
                    if(isValid) {
                      connprofile.setBundle('NSToken', token);
                      callback(false, true);
                    }
                    else {
                      _on_handler['AuthbyPasswordFailed'](entityId);
                      callback(false, false);
                    }
                  });
                });

              };

              connprofile.getBundle('NSToken', (err, tk)=>{
                if(tk != null) {
                  _authe_module.checkTokenisValidByUsername(user, tk, (err, isValid) => {
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
            }
          });
        });
      }
      else {
        this.Authby.DaemonAuthKey(entityId, (err, pass) => {
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
    isSuperUser : (entityId, callback) =>{
      _checkhaveusername(entityId, callback, ()=>{
        let _owner = _entity_module.returnEntityOwner(entityId);
        _authe_module.getUserPrivilegeByUsername(_owner, (err, level) => {
          if(level === 0) {
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

    isSuperUserwithToken: (entityId, callback) =>{
      _checkhaveusername(entityId, callback, ()=>{
        this.Authby.isSuperUser(entityId, (err, pass) => {
          if(pass) {
            this.Authby.Token(entityId, (err, pass) => {
              callback(err, pass);
            })
          }
          else {
            callback(err, pass);
          }
        });
      });
    },

    Domain : (entityId, callback) => {
      if(_trusted_domains.includes(_entity_module.returnEntityValue(entityId, 'spwandomain'))) {
        callback(false, true);
      }
      else {
        callback(false, false);
      }
    },

    DaemonAuthKey: (entityId, callback)=> {
      this.Authby.Domain(entityId, (err, pass) => {
        if(pass) {
          if(_daemon_auth_key === _entity_module.returnEntityValue(entityId, 'daemonauthkey')) {
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

  this.emitSignin = (entityId)=> {
    _on_handler['SigninRq'](entityId);
  };

  this.on = (event, callback)=> {
    _on_handler[event] = callback;
  };

  this.close = () =>{
    _queue_operation = null;
  }
};

module.exports = Authorization;
