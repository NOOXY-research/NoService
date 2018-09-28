// NSF/clients/javascript/NSc.js
// Description:
// "NSc.js" is a NOOXY Service framework client.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

function NSc() {

  let settings = {
    verbose: true,
    debug: true,
    user: null,
    secure: true
  };

  String.prototype.replaceAll = function(search, replacement) {
      var target = this;
      return target.split(search).join(replacement);
  };

  let Utils = {
    getQueryVariable: (variable)=>{
           var query = window.location.search.substring(1);
           var vars = query.split("&");
           for (var i=0;i<vars.length;i++) {
                   var pair = vars[i].split("=");
                   if(pair[0] == variable){return pair[1];}
           }
           return(false);
    },
    Base64toArrayBuffer: (b64str) => {
      var raw = window.atob(b64str);
      var rawLength = raw.length;
      var array = new Uint8Array(new ArrayBuffer(rawLength));
      for(let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      return array;
    },
    convertPemToBinary: (pem)=> {
      var lines = pem.split('\n');
      var encoded = '';
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].trim().length > 0 &&
          lines[i].indexOf('-----BEGIN RSA PRIVATE KEY-----') < 0 &&
          lines[i].indexOf('-----BEGIN RSA PUBLIC KEY-----') < 0 &&
          lines[i].indexOf('-----BEGIN PUBLIC KEY-----') < 0 &&
          lines[i].indexOf('-----END PUBLIC KEY-----') < 0 &&
          lines[i].indexOf('-----BEGIN PRIVATE KEY-----') < 0 &&
          lines[i].indexOf('-----END PRIVATE KEY-----') < 0 &&
          lines[i].indexOf('-----END RSA PRIVATE KEY-----') < 0 &&
          lines[i].indexOf('-----END RSA PUBLIC KEY-----') < 0) {
          encoded += lines[i].trim();
        }
      }
      return Utils.Base64toArrayBuffer(encoded)
    },
    ArrayBuffertoBase64: (buffer)=> {
      var binary = '';
      var bytes = new Uint8Array(buffer);
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
      }
      return window.btoa( binary );
    },
    printLOGO: (version, copyright) => {
      console.log('88b 88  dP\'Yb   dP\'Yb  Yb  dP Yb  dP  TM')
      console.log('88Yb88 dP   Yb dP   Yb  YbdP   YbdP  ')
      console.log('88 Y88 Yb   dP Yb   dP  dPYb    88   ')
      console.log('88  Y8  YbodP   YbodP  dP  Yb   88   Service Framework. ')
      console.log('')
      console.log('')
      console.log('ver. '+version+'. '+copyright)
      console.log('For more information or update -> www.nooxy.org')
      console.log('')
    },
    setCookie: (cname, cvalue, exdays)=> {
      console.log(cname, cvalue, exdays);
      let d = new Date();
      d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
      let expires = "expires="+d.toUTCString();
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    },
    getCookie: (cname)=> {
        let name = cname + "=";
        let ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) == ' ') {
            c = c.substring(1);
          }
          if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
          }
        }
        return "";
    },
    eraseCookie: (name)=> {
      Utils.setCookie(name,"",-1);
    },

    tagLog: (tag, logstring) => {
      if(typeof(logstring)!='string') {
        logstring = JSON.stringify(logstring, null, 2);
      }
      let _space = 10;
      tag = tag.substring(0, _space);
      for(var i=0; i < _space-tag.length; i++) {
        if(i%2 != 1) {
          tag = tag + ' ';
        }
        else {
          tag = ' ' + tag;
        }
      }
      console.log('['+tag+'] '+logstring.replaceAll('\n', '\n['+tag+'] '));
    },
    generateUniqueID: () => {
      return '_' + Math.random().toString(36).substr(2, 9);
    },
    generateGUID: () => {
      let s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +s4() + '-' + s4() + s4() +
       s4();
    },
    searchObject: (object, value)=> {
      for (let prop in object) {
        if (object.hasOwnProperty(prop)) {
          if (object[prop] === value) {
            return prop;
          }
        }
      }
    },
  }

  let Connection = function () {
    let _default_local_ip_and_port = '';
    let _servers = {};
    let _clients = {};
    let _have_local_server = false;
    let _virtnet = null;
    let _blocked_ip = [];
    let _tcp_ip_chunk_token = '}{"""}<>';
    let heartbeat_phrase = '{m:"HB"}';


    // define an profile of an connection
    function ConnectionProfile(serverID, Rpos, connMethod, hostip, hostport, clientip, conn) {
      let _serverID = serverID;
      let _pos = Rpos;
      let _connMethod = connMethod;
      let _bundle = {};
      let _GUID = Utils.generateGUID();
      let _hostip = hostip;
      let _hostport = hostport;
      let _clientip = clientip;
      let _conn = conn; // conn is wrapped!
      if(Rpos == 'Server') {
        _clients[_GUID] = this;
      }

      this.closeConnetion = () => {
        // Utils.tagLog('*ERR*', 'closeConnetion not implemented. Of '+this.type);
        _conn.closeConnetion(_GUID);
      };

      this.getServerID = (callback) => {callback(false, _serverID);}
      this.getHostIP = (callback) => {callback(false, _hostip);}
      this.getHostPort = (callback) => {callback(false, _hostport);}
      this.getClientIP = (callback) => {callback(false, _clientip);}
      this.getConnMethod = (callback) => {callback(false, _connMethod);}
      this.getRemotePosition = (callback) => {callback(false, _pos);}
      this.setBundle = (key, value) => {_bundle[key] = value;}
      this.getBundle = (key, callback) => {callback(false, _bundle[key]);}
      this.getConn = (callback) => {callback(false, _conn)};
      this.getGUID = (callback) => {callback(false, _GUID)};

      this.returnServerID = () => {return _serverID;}
      this.returnHostIP = () => {return _hostip;}
      this.returnHostPort = () => {return _hostport;}
      this.returnClientIP = () => {return _clientip;}
      this.returnConnMethod = () => {return _connMethod;}
      this.returnRemotePosition = () => {return _pos;}
      this.returnBundle = (key) => {return _bundle[key];}
      this.returnConn = () => {return _conn;};
      this.returnGUID = () => {return _GUID};

      this.destroy= () => {
        delete this;
        delete _clients[_GUID];
      };
      // this.onConnectionDropout = () => {
      //   Utils.tagLog('*ERR*', 'onConnectionDropout not implemented');
      // }

    }

    function WSClient() {
      let _ws = null

      this.closeConnetion = () => {
        _ws.close();
      };

      this.onData = (connprofile, data) => {Utils.tagLog('*ERR*', 'onData not implemented');};

      this.onClose = () => {Utils.tagLog('*ERR*', 'onClose not implemented');};

      this.send = function(connprofile, data) {
        try {
          _ws.send(data);
        }
        catch(e) {
          this.onClose(connprofile);
          _ws.close();
        }
      };

      this.connect = (ip, port, callback) => {
        let connprofile = null;
        _ws = new WebSocket('ws://'+ip+':'+port);
        connprofile = new ConnectionProfile(null, 'Server', 'WebSocket', ip, port, 'localhost', this);
        _ws.onopen = () => {
          callback(false, connprofile);
          // ws.send('something');
        }
        _ws.onmessage = (event) => {
          this.onData(connprofile, event.data);
        }

        _ws.onerror =  (error) => {
            Utils.tagLog('*ERR*', error);
            _ws.close();
            this.onClose(connprofile);
        }

        _ws.onclose =  () => {
            this.onClose(connprofile);
        }

      }
    };

    function WSSClient() {
      let _ws = null

      this.closeConnetion = () => {
        _ws.close();
      };

      this.onData = (connprofile, data) => {Utils.tagLog('*ERR*', 'onData not implemented');};

      this.onClose = () => {Utils.tagLog('*ERR*', 'onClose not implemented');};

      this.send = function(connprofile, data) {
        try {
          _ws.send(data);
        }
        catch(e) {
          this.onClose(connprofile);
          _ws.close();
        }
      };

      this.connect = (ip, port, callback) => {
        let connprofile = null;
        _ws = new WebSocket('wss://'+ip+':'+port);
        connprofile = new ConnectionProfile(null, 'Server', 'WebSocket', ip, port, 'localhost', this);
        _ws.onopen = () => {
          callback(false, connprofile);
          // ws.send('something');
        }
        _ws.onmessage = (event) => {
          this.onData(connprofile, event.data);
        }

        _ws.onerror =  (error) => {
            Utils.tagLog('*ERR*', error);
            _ws.close();
            this.onClose(connprofile);
        }

        _ws.onclose =  () => {
            this.onClose(connprofile);
        }

      }
    };

    this.createClient = (conn_method, remoteip, port, callback) => {

      // Heartbeat
      let onData_wrapped = (connprofile, data)=> {
        if(data!=heartbeat_phrase) {
          this.onData(connprofile, data);
        }
      };

      if(conn_method == 'ws'||conn_method =='WebSocket') {
        let serverID = "WebSocket";
        let wsc = new WSClient(_virtnet);
        wsc.onData = onData_wrapped;
        wsc.onClose = this.onClose;
        wsc.connect(remoteip, port, callback);
      }

      else if(conn_method == 'wss'||conn_method =='WebSocketSecure') {
        let serverID = "WebSocketSecure";
        let wssc = new WSSClient(_virtnet);
        wssc.onData = onData_wrapped;
        wssc.onClose = this.onClose;
        wssc.connect(remoteip, port, callback);
      }

      else {
        Utils.tagLog('*ERR*', ''+conn_method+' not implemented. Skipped.');
      }
    };

    this.send = (connprofile, data) => {
      connprofile.getConn((err, conn) => {
        conn.send(connprofile, data);
      });
    };

    this.onData = (conn_profile, data) => {
      Utils.tagLog('*ERR*', 'Connection module onData not implement');
    };

    this.onClose = (connprofile) => {
      Utils.tagLog('*ERR*', 'Connection module onClose not implement');
    }

    this.getClients = (callback) => {
      callback(false, _clients);
    };

  }

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

  let Router = function () {
    let _coregateway = null;
    // nooxy service protocol sercure
    let _json_sniffers = [];
    let _raw_sniffers = [];
    // for signup timeout
    let _locked_ip = [];
    let _debug;

    let _tellJSONSniffers = (Json) => {
      if(settings.debug) {
        Utils.tagLog('DEBUG', Json);
      };
      for(let i in _json_sniffers) {
        _json_sniffers[i](false, Json);
      }
    };

    let _tellRAWSniffers = (data) => {
      for(let i in _raw_sniffers) {
        _raw_sniffers[i](false, data);
      }
    };

    // in case of wrong session of the position
    let _sessionnotsupport = () => {
      console.log('[*ERR*] session not support');
      let err = new Error();
      throw err;
    }

    // a convinient function fo sending data
    let _senddata = (connprofile, method, session, data) => {
      var wrapped = {
        m : method,
        s : session,
        d : data
      };
      let json = JSON.stringify(wrapped);
      // finally sent the data through the connection.
      if(connprofile.returnBundle('NSPS') == true) {
        _coregateway.NoCrypto.encryptString('AESCBC256', connprofile.returnBundle('aes_256_cbc_key'), json, (err, encrypted)=> {
          _coregateway.Connection.send(connprofile, encrypted);
        });
      }
      else if (connprofile.returnBundle('NSPS') == 'finalize') {
        connprofile.setBundle('NSPS', true);
        _coregateway.Connection.send(connprofile, json);

      }
      else {
        _coregateway.Connection.send(connprofile, json);
      }
    }

    // implementations of NOOXY Service Protocol methods
    let methods = {
      // nooxy service protocol implementation of "sercure protocol"
      SP: {
        emitter : (connprofile, data) => {
          _senddata(connprofile, 'SP', 'rq', data);
        },

        handler : (connprofile, session, data) => {
          let rq_rs_pos = {
            rq: "Server",
            rs: "Client"
          }

          let actions = {
            rq : _coregateway.NSPS.RqRouter,
            rs : _coregateway.NSPS.RsRouter
          }
          connprofile.getRemotePosition((err, pos)=> {
            if(rq_rs_pos[session] == pos || rq_rs_pos[session] == 'Both') {
              if(session == 'rq') {
                actions[session](connprofile, data, _senddata);
              }
              else {
                actions[session](connprofile, data);
              }
            }
            else {
              _sessionnotsupport();
            }
          });
        }
      },

      // nooxy service protocol implementation of "get token"
      GT: {
        emitter : (connprofile, data) => {
          _senddata(connprofile, 'GT', 'rq', data);
        },

        handler : (connprofile, session, data) => {
          let rq_rs_pos = {
            rq: "Client",
            rs: "Server"
          }

          let actions = {
            rq : (connprofile, data) => {
                let responsedata = {};
                _coregateway.Authenticity.getUserToken(data.u, data.p, (err, token)=>{
                  responsedata['t'] = token;
                  if(err) {
                    responsedata['s'] = 'Fail';
                  }
                  else {
                    responsedata['s'] = 'OK';
                  }
                  _senddata(connprofile, 'GT', 'rs', responsedata);
                });
            },

            rs : (connprofile, data) => {
              _coregateway.Implementation.onToken(connprofile, data.s, data.t);
            }
          }
          connprofile.getRemotePosition((err, pos)=> {
            if(rq_rs_pos[session] == pos || rq_rs_pos[session] == 'Both') {
              if(session == 'rq') {
                actions[session](connprofile, data, _senddata);
              }
              else {
                actions[session](connprofile, data);
              }
            }
            else {
              _sessionnotsupport();
            }
          });
        }
      },

      // nooxy service protocol implementation of "Authorization"
      AU: {
        emitter : (connprofile, data) => {
          _senddata(connprofile, 'AU', 'rq', data);
        },

        handler : (connprofile, session, data) => {
          let rq_rs_pos = {
            rq: "Server",
            rs: "Client"
          }

          let actions = {
            rq : _coregateway.AuthorizationHandler.RqRouter,
          }
          connprofile.getRemotePosition((err, pos)=> {
            if(rq_rs_pos[session] == pos || rq_rs_pos[session] == 'Both') {
              if(session == 'rq') {
                actions[session](connprofile, data, _senddata);
              }
              else {
                actions[session](connprofile, data);
              }
            }
            else {
              _sessionnotsupport();
            }
          });
        }
      },

      // nooxy service protocol implementation of "Call Service"
      CS: {
        emitter : (connprofile, data) => {
          _senddata(connprofile, 'CS', 'rq', data);
        },

        handler : (connprofile, session, data) => {
          let rq_rs_pos = {
            rq: "Client",
            rs: "Server"
          }

          let actions = {
            rq : _coregateway.Service.ServiceRqRouter,
            rs : _coregateway.Service.ServiceRsRouter
          }
          connprofile.getRemotePosition((err, pos)=> {
            if(rq_rs_pos[session] == pos || rq_rs_pos[session] == 'Both') {
              if(session == 'rq') {
                actions[session](connprofile, data, _senddata);
              }
              else {
                actions[session](connprofile, data);
              }
            }
            else {
              _sessionnotsupport();
            }
          })
        }
      },

      // nooxy service protocol implementation of "Call Activity"
      CA: {
        emitter : (connprofile, data) => {
          _senddata(connprofile, 'CA', 'rq', data);
        },

        handler : (connprofile, session, data) => {
          let rq_rs_pos = {
            rq: "Both",
            rs: "Both"
          }

          let actions = {
            rq : _coregateway.Service.ActivityRqRouter,
            rs : _coregateway.Service.ActivityRsRouter
          }

          connprofile.getRemotePosition((err, pos)=> {
            if(rq_rs_pos[session] == pos || rq_rs_pos[session] == 'Both') {
              if(session == 'rq') {
                actions[session](connprofile, data, _senddata);
              }
              else {
                actions[session](connprofile, data);
              }
            }
            else {
              _sessionnotsupport();
            }
          });
        }
      }
    }

    this.addJSONSniffer = (callback) => {
      _json_sniffers.push(callback);
    };

    this.addRAWSniffer = (callback) => {
      _raw_sniffers.push(callback);
    };

    // emit specified method.
    this.emit = (connprofile, method, data) => {
      methods[method].emitter(connprofile, data);
    };

    // import the accessbility of core resource
    this.importCore = (coregateway) => {
      _coregateway = coregateway;
      _debug = _coregateway.Settings.debug;

      // while recieve a data from connection
      _coregateway.Connection.onData = (connprofile, data) => {
        _tellRAWSniffers(data);
        try {
          if(_coregateway.Settings.secure == true && connprofile.returnConnMethod() != 'Local' && connprofile.returnConnMethod() != 'local') {
            // upgrade protocol
            if(connprofile.returnBundle('NSPS') == 'pending') {
              let json = JSON.parse(data);
              _tellJSONSniffers(json);
              methods[json.m].handler(connprofile, json.s, json.d);
            }
            else if(connprofile.returnBundle('NSPS') != true && connprofile.returnRemotePosition() == 'Client') {
              _coregateway.NSPS.upgradeConnection(connprofile, (err, succeess)=>{
                if(succeess) {
                  let json = JSON.parse(data);
                  _tellJSONSniffers(json);
                  methods[json.m].handler(connprofile, json.s, json.d);
                }
                else {
                  connprofile.closeConnetion();
                }
              });
            }
            else if(connprofile.returnBundle('NSPS') != true) {
              let json = JSON.parse(data);
              _tellJSONSniffers(json);
              methods[json.m].handler(connprofile, json.s, json.d);
            }
            else if(connprofile.returnBundle('NSPS') == true) {
              // true

              _coregateway.NoCrypto.decryptString('AESCBC256', connprofile.returnBundle('aes_256_cbc_key'), data, (err, decrypted)=> {
                if(err&&_coregateway.Settings.debug) {
                  console.log(err);
                }
                let json = JSON.parse(decrypted);
                _tellJSONSniffers(json);
                methods[json.m].handler(connprofile, json.s, json.d);

              });
            }
          }
          else {
            let json = JSON.parse(data);
            _tellJSONSniffers(json);
            methods[json.m].handler(connprofile, json.s, json.d);
          }
        }
        catch (er) {
          if(_debug) {
            Utils.tagLog('*ERR*', 'An error occured in router module.');
            console.log(er);
          }
        }
      };

      _coregateway.Connection.onClose = (connprofile) => {
        try {
          _coregateway.Service.onConnectionClose(connprofile, (err)=>{
            connprofile.destroy();
          });
        }
        catch (er) {
          if(_debug) {
            Utils.tagLog('*WARN*', 'An error occured in router module.');
            console.log(er);
          }
        }
      };

      _coregateway.Service.emitRouter = this.emit;
      _coregateway.Implementation.emitRouter = this.emit;
      _coregateway.Implementation.sendRouterData = _senddata;
      _coregateway.NSPS.emitRouter = this.emit;
      _coregateway.Service.spwanClient = _coregateway.Connection.createClient;

    };

  };

  let Service = function () {
    // need add service event system
    let _activities = {};
    let _local_services_owner = null;
    let _ActivityRsCEcallbacks = {};
    let _ASockets = {};
    let _debug = false;
    let _local_services;
    let _entity_module;

    this.setDebug = (boolean) => {
      _debug = boolean;
    };

    this.importOwner = (owner) => {
      _local_services_owner = owner;
    }

    this.spwanClient = () => {Utils.tagLog('*ERR*', 'spwanClient not implemented');};

    this.emitRouter = () => {Utils.tagLog('*ERR*', 'emitRouter not implemented');};

    this.onConnectionClose = (connprofile, callback) => {

      let _entitiesID = connprofile.returnBundle('bundle_entities');
      console.log(_entitiesID);
      if(_entitiesID == null) {
        callback(true);
      }
      else if(_entitiesID.length) {
        let Rpos = connprofile.returnRemotePosition();
        if(connprofile.returnRemotePosition() == 'Client') {
          let i = 0;
          let loop = () => {
            let theservice = _local_services[_entity_module.returnEntityValue(_entitiesID[i], 'service')];
            _entity_module.deleteEntity(_entitiesID[i]);
            theservice.sendSSClose(_entitiesID[i], (err)=>{

            });
            if(i < _entitiesID.length-1) {
              i++;
              loop();
            }
          };
          loop();
          callback(false);
        }
        else {
          for(let i in _entitiesID) {
            _ASockets[_entitiesID[i]].onClose();
          }
          callback(false);
        }
      }
      else {
        callback(false);
      }
    };

    // ClientSide
    this.ServiceRsRouter =  (connprofile, data) => {

      let methods = {
        // nooxy service protocol implementation of "Call Service: Vertify Connection"
        VE: (connprofile, data) => {
          if(data.d.s == 'OK') {
            _ASockets[data.d.i].launch();
          }
        },
        // nooxy service protocol implementation of "Call Service: ServiceSocket"
        SS: (connprofile, data) => {

        },
        // nooxy service protocol implementation of "Call Service: JSONfunction"
        JF: (connprofile, data) => {
          if(data.d.s == 'OK') {
            _ASockets[data.d.i].sendJFReturn(false, data.d.t, data.d.r);
          }
          else {
            _ASockets[data.d.i].sendJFReturn(data.d.s, data.d.t, data.d.r==null?'{}':JSON.parse(data.d.r));
          }
        },
        // nooxy service protocol implementation of "Call Activity: createEntity"
        CE: (connprofile, data) => {

          // tell server finish create
          if(data.d.i != null) {
            // create a description of this service entity.
            _ActivityRsCEcallbacks[data.d.t](connprofile, data);
            let _data = {
              "m": "VE",
              "d": {
                "i": data.d.i,
              }
            };

            this.emitRouter(connprofile, 'CS', _data);
          }
          else {
            delete   _ActivityRsCEcallbacks[data.d.t];
          }
        }
      }

      // call the callback.
      methods[data.m](connprofile, data);
    };

    // ClientSide implement
    this.ActivityRqRouter = (connprofile, data, response_emit) => {

      let methods = {
        // nooxy service protocol implementation of "Call Activity: ActivitySocket"
        AS: () => {
          _ASockets[data.d.i].onData(data.d.d);
          let _data = {
            "m": "AS",
            "d": {
              // status
              "i": data.d.i,
              "s": "OK"
            }
          };
          response_emit(connprofile, 'CA', 'rs', _data);
        },
      }
      // call the callback.
      methods[data.m](connprofile, data.d, response_emit);
    }

    // ClientSide
    this.ActivityRsRouter = (connprofile, data) => {

      let methods = {
        // nooxy service protocol implementation of "Call Activity: ActivitySocket"
        AS: (connprofile, data) => {
          // no need to implement anything
        }
      }

      methods[data.m](connprofile, data.d);
    };

    function ActivitySocket(conn_profile, Datacallback, JFCallback) {
      let _entity_id = null;
      let _launched = false;

      let wait_ops = [];
      let wait_launch_ops = [];

      let _conn_profile = conn_profile;
      let _jfqueue = {};

      let exec = (callback) => {
        if(_launched != false) {
          callback();
        }
        else {
          wait_ops.push(callback);
        }
      };

      this.launch = () => {
        _launched = true;
        for(let i in wait_ops) {
          wait_ops[i]();
        }
      };

      this.setEntityID = (id) => {
        _entity_id = id;
        let entities_prev = conn_profile.returnBundle('bundle_entities');
        if(entities_prev != null) {
          conn_profile.setBundle('bundle_entities', [_entity_id].concat(entities_prev));
        }
        else {
          conn_profile.setBundle('bundle_entities', [_entity_id]);
        }
      };

      this.sendJFReturn = (err, tempid, returnvalue) => {
        if(err) {
          _jfqueue[tempid](err);
        }
        else {
          _jfqueue[tempid](err, JSON.parse(returnvalue));
        }
      };

      // JSONfunction call
      this.call = (name, Json, callback) => {
        let op = ()=> {
          let tempid = Utils.generateUniqueID();
          _jfqueue[tempid] = (err, returnvalue) => {
            callback(err, returnvalue);
          };
          JFCallback(conn_profile, _entity_id, name, tempid, Json);
        };
        exec(op);
      }

      this.returnEntityID = () => {
        return _entity_id;
      };

      this.sendData = (data) => {
        let op = ()=> {
          Datacallback(conn_profile, _entity_id, data);
        };
        exec(op);
      };

      this.onData = (data) => {
        Utils.tagLog('*ERR*', 'onData not implemented');
      };

      this.onClose = () => {
        Utils.tagLog('*ERR*', 'onClose not implemented');
      };

      this.close = () => {
        let op = ()=> {
          let bundle = conn_profile.returnBundle('bundle_entities');
          for (var i=bundle.length-1; i>=0; i--) {
            if (bundle[i] === _entity_id) {
                bundle.splice(i, 1);
            }
          }
          conn_profile.setBundle('bundle_entities', bundle);
          if(bundle.length == 0) {
            _conn_profile.closeConnetion();
          }
        }
        exec(op);
      };
    };

    // Service module launch
    this.launch = () => {

    };

    // Service module Owner
    this.setupOwner = (username) => {
      _local_services_owner = username;
    };

    // ss callback
    let _sscallback = (conn_profile, i, d) => {
      let _data2 = {
        "m": "SS",
        "d": {
          "i": i,
          "d": d,
        }
      };

      this.emitRouter(conn_profile, 'CS', _data2);
    }
    // jf callback

    let _jscallback = (connprofile, entity_id, name, tempid, Json)=> {
      let _data2 = {
        "m": "JF",
        "d": {
          "i": entity_id,
          "n": name,
          "j": JSON.stringify(Json),
          "t": tempid
        }
      };
      this.emitRouter(connprofile, 'CS', _data2);
    }

    // Service module create activity socket
    this.createActivitySocket = (method, targetip, targetport, service, callback) => {
      let err = false;
      let _data = {
        "m": "CE",
        "d": {
          t: Utils.generateGUID(),
          o: _local_services_owner,
          m: 'normal',
          s: service,
          od: targetip,
        }
      };

      this.spwanClient(method, targetip, targetport, (err, connprofile) => {
        let _as = new ActivitySocket(connprofile, _sscallback ,  _jscallback);
        _ActivityRsCEcallbacks[_data.d.t] = (connprofile, data) => {
          if(data.d.i != "FAIL") {
            _as.setEntityID(data.d.i);
            _ASockets[data.d.i] = _as;
            callback(false, _as);
          }
          else{
            callback(true, _as);
          }

        }
        this.emitRouter(connprofile, 'CS', _data);
      });

    };
  };

  let Implementation = function() {
    let _support_secure = false;
    let _connection_module = null;

    // NOOXY service protocol secure list
    let _nsps_list = ['generateAESCBC256KeyByHash', 'encryptString', 'decryptString'];

    let _implts = {

      // NOOXY service protocol sercure

        // hashing two string (host and client pub key)by SHA256 to get AES-CBC 256 key 32 char
        generateAESCBC256KeyByHash: (string1, string2, callback) => {
          Utils.tagLog('*ERR*', 'generateAESCBC256KeyByHash not implemented');
          callback(true, 'hash 32 char');
        },

        encryptString: (key, toEncrypt, callback) => {
          Utils.tagLog('*ERR*', 'generateAESCBC256KeyByHash not implemented');
          callback(true, 'encrypted');
        },

        decryptString: (key, toEncrypt, callback) => {
          Utils.tagLog('*ERR*', 'generateAESCBC256KeyByHash not implemented');
          callback(true, 'decrypted');
        },

        saveRSA2048KeyPair: (priv, pub) => {
          Utils.tagLog('*ERR*', 'saveRSA2048KeyPair not implemented');
        },

        loadRSA2048KeyPair: (callback) => {
          Utils.tagLog('*ERR*', 'loadRSA2048KeyPair not implemented');
          callback(true, 'priv', 'pub');
        },

      // NOOXY service protocol sercure end

      // return for Server
      AuthbyToken: (callback) => {
        Utils.tagLog('*ERR*', 'AuthbyToken not implemented');
        callback(true, 'token');
      },

      AuthbyTokenFailed: () => {
        Utils.tagLog('*ERR*', 'AuthbyTokenFailed not implemented');
      },

      // return for Server
      AuthbyPassword: (callback) => {
        Utils.tagLog('*ERR*', 'AuthbyPassword not implemented');
        callback(true, 'password');
      },

      AuthbyPasswordFailed: () => {
        Utils.tagLog('*ERR*', 'AuthbyPasswordFailed not implemented');
      },

      // return for Client
      signin: (conn_method, remoteip, port, username, password, callback) => {
        Utils.tagLog('*ERR*', 'signin not implemented');
        callback(true, 'token');
      },

      // return for Client
      signup: (conn_method, remoteip, port, username, password, callback) => {
        Utils.tagLog('*ERR*', 'signup not implemented');
        callback(true, 'token');
      },

      onToken: (err, token) => {
        Utils.tagLog('*ERR*', 'onToken not implemented');
      },

      // for Server
      noti: () => {

      },

      AuthbyPassword: null,

      AuthbyAction: null
    };

    // Nooxy service protocol sercure request
    this.NSPSRqRouter = (connprofile, data, data_sender) => {

    };

    this.onToken = (connprofile, status, token)=> {
      if(status == 'OK') {
        _implts['onToken'](false, token);
      }
      else {
        _implts['onToken'](true);
      }
    };

    this.emitRouter = () => {Utils.tagLog('*ERR*', 'emitRouter not implemented');};

    this.sendRouterData = () => {Utils.tagLog('*ERR*', 'sendRouterData not implemented');};
    // get a temporary ConnectionProfile
    this.getClientConnProfile = (conn_method, remoteip, port, callback) => {
      _connection_module.createClient(conn_method, remoteip, port, callback);
    }

    this.importConnectionModule = (connection_module) => {
      _connection_module = connection_module;
    };

    this.setSecure = (boolean)=>{

    };

    this.isSecure = (boolean)=>{

    };

    this.setImplement = (name, callback) => {
      _implts[name] = callback;
    };

    this.returnImplement = (name) => {
      return _implts[name];
    };

    this.returnImplementBundle = () => {
      return _implts;
    };

    this.returnNSPSModule = () =>{

    };

    this.close = () => {};
  }

  let NSPS = function () {
    let _rsa_pub = null;
    let _rsa_priv = null;
    let _resumes = {};
    let _crypto_module = null;

    this.emitRouter = () => {console.log('[*ERR*] emit not implemented');};

    // Nooxy service protocol sercure request ClientSide
    // in client need to be in implementation module
    this.RqRouter = (connprofile, data, data_sender) => {

      let host_rsa_pub = data.p;
      let client_random_num = _crypto_module.returnRandomInt(99999);
      connprofile.setBundle('host_rsa_pub_key', host_rsa_pub);
      _crypto_module.generateAESCBC256KeyByHash(host_rsa_pub, client_random_num, (err, aes_key) => {
        connprofile.setBundle('aes_256_cbc_key', aes_key);
        let _data = {
          r: client_random_num,
          a: aes_key// aes key to vertify
        };
        _crypto_module.encryptString('RSA2048', host_rsa_pub, JSON.stringify(_data), (err, encrypted)=>{
          connprofile.setBundle('NSPS', 'finalize');
          data_sender(connprofile, 'SP', 'rs', encrypted);
        });
      });
    };

    this.upgradeConnection = (connprofile, callback) => {
      _resumes[connprofile.returnGUID()] = callback;
      let _data = {
        p: _rsa_pub// RSA publicKey
      };
      connprofile.setBundle('NSPS', 'pending');
      this.emitRouter(connprofile, 'SP', _data);
    }

    this.importCryptoModule = (crypto_module) => {
      _crypto_module = crypto_module;
    }

    this.importRSA2048KeyPair = (rsa_priv, rsa_pub) => {
      _rsa_priv = rsa_priv;
      _rsa_pub = rsa_pub;
    };
  };

  let Vars = {
    'version': 'aphla2',
    'NSP_version': 'aphla',
    'copyright': 'copyright(c)2018 NOOXY inc.',
    'default_user': {
      'username': 'admin',
      'displayname': 'NSF Superuser',
      'password': 'admin'
    }
  }

  let Core = function() {
    let verbose = (tag, log) => {
      if(settings.verbose||settings.debug) {
        Utils.tagLog(tag, log);
      };
    };
    // setup variables
    verbose('Daemon', 'Setting up variables.')
    let _connection = new Connection();
    let _authorizationhandler = new AuthorizationHandler();
    let _router = new Router();
    let _service = new Service();
    let _implementation = new Implementation();
    let _nsps;

    let _nocrypto = {
      returnRandomInt: (max)=>{
        let f = _implementation.returnImplement('returnRandomInt');
        return f(max);
      },
      generateAESCBC256KeyByHash: (string1, string2, callback) => {
        let f = _implementation.returnImplement('generateAESCBC256KeyByHash');
        f(string1, string2, callback);
      },
      encryptString: (algo, key, toEncrypt, callback)=>{
        let f = _implementation.returnImplement('encryptString');
        f(algo, key, toEncrypt, callback);
      },
      decryptString: (algo, key, toDecrypt, callback) => {
        let f = _implementation.returnImplement('decryptString');
        f(algo, key, toDecrypt, callback);
      }
    };
    _nsps = new NSPS();

    this.launch = () => {
      Utils.printLOGO(Vars.version, Vars.copyright);

      let _cry_algo = {
        // key is in length 32 char
        AESCBC256: {
          encryptString: (keystr, toEncrypt, callback) => {
            window.crypto.subtle.importKey(
                "raw", //can be "jwk" or "raw"
                new TextEncoder('utf-8').encode(keystr),
                {   //this is the algorithm options
                    name: "AES-CBC",
                },
                false, //whether the key is extractable (i.e. can be used in exportKey)
                ["encrypt", "decrypt"] //can be "encrypt", "decrypt", "wrapKey", or "unwrapKey"
            )
            .then((key)=>{
              let iv = new Uint8Array(16);
              window.crypto.getRandomValues(iv);
              toEncrypt = new TextEncoder('utf-8').encode(toEncrypt);
              window.crypto.subtle.encrypt(
                {
                    name: "AES-CBC",
                    iv: iv, //The initialization vector you used to encrypt
                },
                key, //from generateKey or importKey above
                toEncrypt //ArrayBuffer of the data
              )
              .then((encrypted)=>{;
                callback(false, Utils.ArrayBuffertoBase64(iv)+Utils.ArrayBuffertoBase64(encrypted));
              })
              .catch((err2)=>{
                console.error(err2);
              });
            })
            .catch((err)=>{
                console.error(err);
            });
          },
          decryptString: (keystr, toDecrypt, callback) => {
            window.crypto.subtle.importKey(
                "raw", //can be "jwk" or "raw"
                new TextEncoder('utf-8').encode(keystr),
                {   //this is the algorithm options
                    name: "AES-CBC",
                },
                false, //whether the key is extractable (i.e. can be used in exportKey)
                ["encrypt", "decrypt"] //can be "encrypt", "decrypt", "wrapKey", or "unwrapKey"
            )
            .then((key)=>{
              let iv = Utils.Base64toArrayBuffer(toDecrypt.substring(0, 24));
              toDecrypt = Utils.Base64toArrayBuffer(toDecrypt.substring(24));
              window.crypto.subtle.decrypt(
                {
                    name: "AES-CBC",
                    iv: iv, //The initialization vector you used to encrypt
                },
                key, //from generateKey or importKey above
                toDecrypt //ArrayBuffer of the data
              )
              .then((decrypted)=>{;
                callback(false, new TextDecoder('utf-8').decode(decrypted));
              })
              .catch((err2)=>{
                console.error(err2);
              });
            })
            .catch((err)=>{
                console.error(err);
            });
          }
        },

        // Keys is in pem format
        RSA2048: {
          encryptString: (publicKey, toEncrypt, callback) => {
            window.crypto.subtle.importKey(
              "spki", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
              Utils.convertPemToBinary(publicKey),
              {   //these are the algorithm options
                  name: "RSA-OAEP",
                  hash: {name: "SHA-1"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
              },
              false, //whether the key is extractable (i.e. can be used in exportKey)
              ["encrypt"] //"encrypt" or "wrapKey" for public key import or
                          //"decrypt" or "unwrapKey" for private key imports
            )
            .then((key)=> {
                //returns a publicKey (or privateKey if you are importing a private key)
              window.crypto.subtle.encrypt({"name": "RSA-OAEP"}, key, new TextEncoder('utf-8').encode(toEncrypt)).then((encrypted)=>{
                callback(false, Utils.ArrayBuffertoBase64(encrypted));
              });

            })
            .catch((err)=>{
                console.log(err);
            });

          }
        },

      }

      _implementation.setImplement('returnRandomInt', (max)=>{
        return Math.floor(Math.random() * Math.floor(max));
      });
      _implementation.setImplement('generateAESCBC256KeyByHash', (string1, string2, callback)=>{
        window.crypto.subtle.digest("SHA-256", new TextEncoder('utf-8').encode(string1+string2)).then((hash)=> {
          callback(false, (Utils.ArrayBuffertoBase64(hash)).substring(0, 32));
        });
      });
      _implementation.setImplement('encryptString', (algo, key, toEncrypt, callback)=>{
        _cry_algo[algo].encryptString(key, toEncrypt, callback);
      });
      _implementation.setImplement('decryptString', (algo, key, toDecrypt, callback)=>{
        _cry_algo[algo].decryptString(key, toDecrypt, callback);
      });
      // setup NSF Auth implementation
      _implementation.setImplement('signin', (connprofile, data, data_sender)=>{
        top.location.replace('login.html?conn_method='+settings.connmethod+'&remote_ip='+settings.targetip+'&port='+settings.targetport+'&redirect='+top.window.location.href);
        // window.open('login.html?conn_method='+conn_method+'&remote_ip='+remote_ip+'&port='+port);
      });

      _implementation.setImplement('onToken', (err, token)=>{
        Utils.setCookie('NSToken', token, 7);
        if(Utils.getQueryVariable('redirect')) {
          window.location.replace(Utils.getQueryVariable('redirect'));
        }
      });

      _implementation.setImplement('setUser', (err, username)=>{
        Utils.setCookie('NSUser', username, 365);
      });

      _implementation.setImplement('logout', (err, Username)=>{
        Utils.eraseCookie('NSUser');
        Utils.eraseCookie('NSToken');
        window.location.reload();
      });

      _implementation.setImplement('AuthbyTokenFailed', (connprofile, data, data_sender)=>{
        _implementation.returnImplement('signin')(connprofile, data, data_sender, 'token');
      });

      // setup NSF Auth implementation
      _implementation.setImplement('AuthbyToken', (connprofile, data, data_sender) => {
        let callback = (err, token)=>{
          let _data = {
            m:'TK',
            d:{
              t: data.d.t,
              v: token
            }
          }
          data_sender(connprofile, 'AU', 'rs', _data);
        };

        let pass = true;
        if(Utils.getCookie('NSToken') == null) {
          _implementation.returnImplement('signin')(connprofile, data, data_sender, 'token');
        }
        else {
          callback(false, Utils.getCookie('NSToken'));
        }

      });
      // setup NSF Auth implementation

      _implementation.setImplement('AuthbyPassword', (connprofile, data, data_sender) => {
        window.open('password.html?conn_method='+settings.connmethod+'&remote_ip='+settings.targetip+'&port='+settings.targetport+'&username='+settings.user+'&authtoken='+data.d.t+'&redirect='+window.location.href);
      });

        // create gateway
        verbose('Daemon', 'Creating coregateway...')
        let coregateway = {
            Settings: settings,
            AuthorizationHandler: _authorizationhandler,
            Service : _service,
            Connection: _connection,
            Router: _router,
            Implementation: _implementation,
            NoCrypto: _nocrypto,
            NSPS: _nsps
          };
        verbose('Daemon', 'Creating coregateway done.')

      for(let i in settings.connection_servers) {
        settings.trusted_domains.push(settings.connection_servers[i].ip);
      }

      // setup NOOXY Service protocol secure
      _nsps.importCryptoModule(_nocrypto);
      // setup router
      _router.importCore(coregateway);

      // setup connection
      for(var server in settings.connection_servers) {
        _connection.addServer(settings.connection_servers[server].type,
           settings.connection_servers[server].ip, settings.connection_servers[server].port);
      }

      // setup implementation
      _implementation.importConnectionModule(_connection);

      // setup AuthorizationHandler
      _authorizationhandler.importImplementationModule(_implementation);

      // setup service
      _service.setDebug(settings.debug);
      _service.importOwner(settings.user);


      verbose('Daemon', 'Setting up variables done.');

      // launch services
      verbose('Daemon', 'Launching service module...');
      _service.launch();
      verbose('Daemon', 'Launching service module done.');
      //
      verbose('Daemon', 'NOOXY Service Framework successfully started.');

    }

    this.getImplement = (callback) => {
      callback(false, _implementation);
    };

    this.createActivitySocket = (method, targetip, targetport, service, callback) => {
      _service.createActivitySocket(method, targetip, targetport, service, callback);
    };

  }

  let _core = new Core();

  this.createActivitySocket = (service, callback) => {
    _core.createActivitySocket(settings.connmethod, settings.targetip, settings.targetport, service, callback);
  };

  this.getImplement = (callback)=>{
    _core.getImplement(callback);
  };

  this.returnUserName = ()=>{
    return settings.user;
  }

  this.connect = (targetip, targetport) =>{
    settings.connmethod = 'WebSocketSecure';
    settings.targetip = targetip;
    settings.targetport = targetport;
    settings.user = Utils.getCookie('NSUser');
    if(settings.user == "") {
      settings.user = null;
    };
    try {
      _core.launch();
    }
    catch(e) {
      settings.connmethod = 'WebSocket';
      _core.launch();
    }
  };

}
