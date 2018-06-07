// NSF/NSd/router.js
// Description:
// "router.js" provide routing functions.
// Copyright 2018 NOOXY. All Rights Reserved.

function Router() {
  let _coregateway = null;

  // in case of wrong session of the position
  let _sessionnotsupport = function() {
    console.log('session not support');
  }

  // a convinient function fo sending data
  let _senddata = function(connprofile, method, session, data) {
    var wrapped = {
      m : method,
      s : session,
      d : data,
    };

    // finally sent the data through the connection.
    _coregateway.conn.sendJSON(connprofile, wrapped);
  }

  // implements of NOOXY Service Protocol methods
  let methods = {
    // nooxy service protocol implement of "signup"
    SU : {

    },

    // nooxy service protocol implement of "get token"
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
              _coregateway.authorization.getToken(data.username, data.password, (token)=>{
                responsedata['t'] = token;
                _senddata(connprofile, 'GT', 'rs', responsedata);
              });
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

    },

    SC : {

    },

    AC : {

    }
  }

  // import the accessbility of core resource
  this.setup = function(coregateway) {
    _coregateway = coregateway;
  };

  // start this router
  this.start = function() {
    _coregateway.conn.onJSON = function(json, connprofile) {
      methods[json.method].handler(connprofile, json.session, json.data, coregateway);
    };
  };
}

module.exports = Router
