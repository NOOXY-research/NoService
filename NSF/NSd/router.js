// router is part of core
function router() {
  let _coregateway = null;

  let _sessionnotsupport = function() {
    console.log('session not support');
  }

  let _senddata = function(connprofile, method, session, data) {
    var wrapped = {
      m : method,
      s : session,
      d : data,
    };
    _coregateway.conn.sendJSON(connprofile, wrapped);
  }

  let methods = {
    SU : {

    },

    GT : {
      emitter : (connprofile, username, password) => {
        _senddata('GT', 'rq', {username : username, password : password});
      },

      handler : (connprofile, session, data, coregateway) => {
        let rq_rs_pos = {
          rq: "Client",
          rs: "Server"
        }

        let actions = {
          rq : function(data) {
            let responsedata = {};
            _coregateway.auth.authby.Password(data.username, data.password, function(pass) {
              responsedata['p'] = pass;
              if(pass) {
                _coregateway.auth.getToken(data.username, data.password, (token)=>{
                  responsedata['t'] = token;
                  _senddata(connprofile, 'loginbypwd', 'res', responsedata);
                });
              }
              else {
                responsedata['t'] = null;
                _senddata(connprofile, 'loginbypwd', 'res', responsedata);
              }
            });
          },

          rs : function(data) {

          }
        }
        connprofile.getPosition((pos)=> {
          if(rq_rs_pos[session] == pos) {
            actions[session](data);
          }
          else {
            _sessionnotsupport();
          }
        })
      }
    },

    AU : {

    }
  }

  this.setup = function(coregateway) {
    _coregateway = coregateway;
  };

  this.start = function() {
    _coregateway.conn.onJSON = function(json, connprofile) {
      methods[json.method].handler(connprofile, json.session, json.data, coregateway);
    };
  };
}

module.exports = router
