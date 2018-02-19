// methods is part of core
function methods() {
  let methods = {
    signup : {

    },

    loginbypwd : {
      emitter : function(connprofile, username, password) {
        _senddata('loginbypwd', 'req', {username : username, password : password});
      },

      handler : function(connprofile, session, data, coregateway) {
        let sessions = {
          req : function(data) {
            let responsedata = {};
            coregateway.auth.PasswordisValid(data.username, data.password, function(pass, token) {
              responsedata['pass'] = pass;
              if(pass) {
                responsedata['token'] = token;
              }
              _senddata(connprofile, 'loginbypwd', 'res', responsedata);
            });
            coregateway.conn.send(responsedata, connprofile);
          },
          res : function(data) {
            methods._sessionnotsupport();
          }
        }
        sessions[session](data);
      }
    },

    command : {

    }
  }

  let _coregateway = null;
  let _sessionnotsupport = function() {
    console.log('session not support');
  }
  let _senddata = function(connprofile, method, session, data) {
    var wrapped = {
      method : method,
      session : session,
      data : data,
    };
    _coregateway.conn.send(wrapped, connprofile);
  }

  this.setup = function(coregateway) {
    _coregateway = coregateway;
  };

  this.start = function() {
    conn.onJSON = function(json, connprofile) {
      methods[json.method].handler(connprofile, json.session, json.data, coregateway);
    };
  };
}

module.exports = methods
