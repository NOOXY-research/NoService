// NSF/NSd/authorization.js
// Description:
// "authorization.js" provide authorization actions.
// Copyright 2018 NOOXY. All Rights Reserved.

function Authorization() {
  let _realtime_token = null;
  let _trusted_domain = [];
  let _authe_module = null;
  let _entity_module = null;
  let _auth_timeout = 320;
  let _queue_operation = {};

  this.emit = () => {console.log('[ERR] emit not implemented');};

  this.onConnect = (connprofile, data) => {
    _queue_operation[conn_profile.getGUID()+data.m](connprofile, data);
  };

  // function that import working authenticity module.
  this.importAuthenticityModule = (authw_module) => {
    _authe_module = _authe_module;
  };

  //
  this.importEntityModule = (entity_module) => {
    _entity_module = entity_module;
  };

  // Authby group
  this.Authby = {
    Password : (entityID, handler) =>{
      let user = _entity_module.returnVal('owner');
      let data = {
        m: "PW"
      }
      _entity_module.getEntityConnProfile(entityID, (conn_profile) => {
        this.emit(conn_profile, 'AU', data);
        _queue_operation[conn_profile.getGUID()+'PW'] = ;
      });

      let op = (connprofile, data) = {
        _authe_module.PasswordisValid();
      }

      // set the timeout of this operation
      setTimeout(() => {delete _queue_operation[conn_profile.getGUID()+'PW']}, _auth_timeout*1000);
    },

    Action : (entityID, handler) =>{

    },

    Token : (entityID, handler) =>{

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
