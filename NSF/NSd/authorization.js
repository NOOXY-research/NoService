// NSF/NSd/authorization.js
// Description:
// "authorization.js" provide authorization actions.
// Copyright 2018 NOOXY. All Rights Reserved.

// Handling responses to authoration requests.
function AuthorationHandler() {
  let _implts = {
    'PW': null,
    'AC': null
  };

  let _implts_callback = {
    'PW': () => {

    },

    'AC': () => {

    }
  };

  this.RqRouter = (connprofile, data, data_sender) => {
    _implts[conn_profile.getGUID()+data.m](connprofile, data);
  };

  this.setImplement = (implement_name, callback) => {
    _implts[implement_name] = callback;
  };
};

// Serverside authoration emitter.
function Authorization() {
  let _realtime_token = null;
  let _trusted_domains = [];
  let _authe_module = null;
  let _entity_module = null;
  let _auth_timeout = 320;
  let _queue_operation = {};

  this.emitRouter = () => {console.log('[ERR] emit not implemented');};

  this.RsRouter = (connprofile, data) => {
    _queue_operation[conn_profile.getGUID()+data.m](connprofile, data);
  };

  // function that import working authenticity module.
  this.importAuthenticityModule = (authe_module) => {
    _authe_module = authe_module;
  };

  //
  this.importEntityModule = (entity_module) => {
    _entity_module = entity_module;
  };

  this.importTrustDomains(domain_list) = {
    _trusted_domains = domain_list;
  }

  // Authby group
  this.Authby = {
    Password : (entityID, handler) =>{
      let user = _entity_module.returnVal('owner');
      let data = {
        m: "PW"
      }
      _entity_module.getEntityConnProfile(entityID, (conn_profile) => {
        this.emitRouter(conn_profile, 'AU', data);
        let op = (connprofile, data) = {
          if(user === data.u) {
            _authe_module.PasswordisValid(data.d.u, data.d.p, (isValid) => {
              if(isValid) {
                handler(true);
              }
              else {
                handler(false);
              }
            });
          }
          else {
            handler(false);
          }

        }
        _queue_operation[conn_profile.getGUID()+'PW'] = op;
      });

      // set the timeout of this operation
      setTimeout(() => {delete _queue_operation[conn_profile.getGUID()+'PW']}, _auth_timeout*1000);
    },

    Action : (entityID, handler) =>{

    },

    Token : (entityID, handler) =>{
        let user = _entity_module.returnVal('owner');
        let data = {
          m: "TK"
        }
        _entity_module.getEntityConnProfile(entityID, (conn_profile) => {
          this.emitRouter(conn_profile, 'AU', data);
          let op = (connprofile, data) = {
            if(user === data.u) {
              _authe_module.TokenisValid(data.d.u, data.d.t, (isValid) => {
                if(isValid) {
                  handler(true);
                }
                else {
                  handler(false);
                }
              });
            }
            else {
              handler(false);
            }

          }
          _queue_operation[conn_profile.getGUID()+'TK'] = op;
        });

        // set the timeout of this operation
        setTimeout(() => {delete _queue_operation[conn_profile.getGUID()+'TK']}, _auth_timeout*1000);
    },

    UserLevel : (entityID, handler) =>{

    },

    RealtimeToken : (entityID, handler) =>{

    },

    Domain : (entityID, handler) =>{

    }
  }

  this.getRealtimeToken = (callback) => {callback(_realtime_token);}

};

module.exports = Authorization;
