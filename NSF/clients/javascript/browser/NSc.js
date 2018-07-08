// NSF/clients/javascript/NSc.js
// Description:
// "NSc.js" is a NOOXY Service framework client.
// Copyright 2018 NOOXY. All Rights Reserved.
function NSc() {

  let Connection = function () {
    let _default_local_ip_and_port = '';
    let _servers = {};
    let _clients = {};
    let _have_local_server = false;
    let _virtnet = null;
    let _blocked_ip = [];
    let _tcp_ip_chunk_token = '}{"""}<>';


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


      this.closeConnetion = () => {
        // Utils.tagLog('*ERR*', 'closeConnetion not implemented. Of '+this.type);
        _conn.close(_GUID);
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

      // this.onConnectionDropout = () => {
      //   Utils.tagLog('*ERR*', 'onConnectionDropout not implemented');
      // }

    }

    function WSClient() {
      let _ws = null

      this.close = () => {
        _ws.close();
      };

      this.onData = (connprofile, data) => {Utils.tagLog('*ERR*', 'onData not implemented');};

      this.onClose = () => {Utils.tagLog('*ERR*', 'onClose not implemented');};

      this.send = function(connprofile, data) {
        _ws.send(data);
      };

      this.connect = (ip, port, callback) => {
        let connprofile = null;
        _ws = new WebSocket('ws://'+ip+':'+port);
        connprofile = new ConnectionProfile(null, 'Server', 'WebSocket', ip, port, 'localhost', this);
        _ws.on('open', function open() {
          callback(false, connprofile);
          // ws.send('something');
        });
        _ws.on('message', (message) => {
          this.onData(connprofile, message);
        });

        _ws.on('error', (error) => {
            Utils.tagLog('*ERR*', error);
            _ws.close();
        });

        _ws.on('close', (error) => {
            this.onClose(connprofile);
        });

      }
    };

    this.createClient = (conn_method, remoteip, port, callback) => {
      if(conn_method == 'ws'||conn_method =='WebSocket') {
        let serverID = "WebSocket";
        let wsc = new WSClient(_virtnet);
        wsc.onData = this.onData;
        wsc.onClose = this.onClose;
        wsc.connect(remoteip, port, callback);
      }

      else if(conn_method == 'loc'||conn_method =='Local') {
        if(_have_local_server == false) {
          Utils.tagLog('*ERR*', 'Local server not started.');
        }
        else {
          let serverID = "LOCAL";
          let locc = new LocalClient(_virtnet);
          locc.onData = this.onData;
          locc.onClose = this.onClose;
          locc.connect('LOCALIP', 'LOCALPORT', callback);
        }
      }

      else if(conn_method == 'TCP/IP'||conn_method =='TCP') {
        let serverID = "TCP/IP";
        let netc = new TCPIPClient(_virtnet);
        netc.onData = this.onData;
        netc.onClose = this.onClose;
        netc.connect(remoteip, port, callback);
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
      Utils.tagLog('*ERR*', 'Connection module onData not implement');
    }

    this.getClients = (callback) => {
      callback(false, _clients);
    };

  }

  let AuthorizationHandler = function () {
    let _implementation_module = null;
    let _daemon_auth_key = null;
    let _trusted_domains = [];

    let _implts_callback = {
      'PW': (connprofile, data, data_sender) => {
        let AuthbyPassword = _implementation_module.returnImplement('AuthbyPassword');
        AuthbyPassword((err, password)=>{
          let _data = {
            m:'PW',
            d:{
              p: password
            }
          }
          data_sender(connprofile, 'AU', 'rs', _data);
        })
      },

      'TK': (connprofile, data, data_sender) => {
        let AuthbyToken = _implementation_module.returnImplement('AuthbyToken');
        AuthbyToken((err, token)=>{
          let _data = {
            m:'TK',
            d:{
              t: token
            }
          }
          data_sender(connprofile, 'AU', 'rs', _data);
        })
      },

      'AC': () => {

      }
    };

    this.RqRouter = (connprofile, data, data_sender) => {
      _implts_callback[data.m](connprofile, data, data_sender);
    };

    this.importImplementationModule = (implementation_module) => {
      _implementation_module = implementation_module;
    };
  };

  let Router = function () {
    let _coregateway = null;
    // nooxy service protocol sercure
    let _json_sniffers = [];
    let _raw_sniffers = [];
    // for signup timeout
    let _locked_ip = [];

    let _tellJSONSniffers = (Json) => {
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
            rs : _coregateway.Authorization.RsRouter
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

      // while recieve a data from connection
      _coregateway.Connection.onData = (connprofile, data) => {
        _tellRAWSniffers(data);
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

      };

      _coregateway.Connection.onClose = (connprofile) => {
        _coregateway.Service.onConnectionClose(connprofile, (err)=>{
          delete connprofile.returnConn();
          delete connprofile;
        });
      };

      _coregateway.Authenticity.emitRouter = this.emit;
      _coregateway.Service.emitRouter = this.emit;
      _coregateway.Implementation.emitRouter = this.emit;
      _coregateway.Authorization.emitRouter = this.emit;
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
      let i = 0;
      if(_entitiesID==null) {
        callback(true);
      }
      else if(_entitiesID.length) {
        let loop = () => {
          let theservice = _local_services[_entity_module.returnEntityValue(_entitiesID, 'service')];
          theservice.sendSSClose(_entitiesID[i], (err)=>{
            if(i < _entitiesID.length-1) {
              i++
              loop();
            }
          });
        };
        callback(false);
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
            _ASockets[data.d.i].sendJFReturn(true, data.d.t, data.d.r);
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

      let entities_prev = conn_profile.returnBundle('bundle_entities');
      if(entities_prev != null) {
        conn_profile.setBundle('bundle_entities', [_entity_id].concat(entities_prev));
      }
      else {
        conn_profile.setBundle('bundle_entities', [_entity_id]);
      }

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
          if(!bundle.length) {
            conn_profile.closeConnetion();
          }
        }
        exec(op);
      };
    };

    // Service module launch
    this.launch = () => {
      let launched_service = [];
      let depended_service_dict = {};
      for (var key in _local_services) {
        _local_services[key].launch(depended_service_dict);
        launched_service.push(key);
      }
      // check dependencies
      for (let service_name in depended_service_dict) {
        for(let depended in depended_service_dict[service_name]) {
          if(!launched_service.includes(depended)) {
            Utils.tagLog('*ERR*', 'Service "'+service_name+'" depend on another service "'+depended+'". But it doesn\'t launched.');
            process.exit();
          }
        }
      }
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

  let Implementation = function () {
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

        generateRSA2048KeyPair: (callback) => {
          Utils.tagLog('*ERR*', 'generateAESCBC256KeyByHash not implemented');
          callback(true, 'priv', 'pub');
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

      // return for Server
      AuthbyPassword: (callback) => {
        Utils.tagLog('*ERR*', 'AuthbyPassword not implemented');
        callback(true, 'password');
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
  };

  let NSPS = function () {
    let _rsa_pub = null;
    let _rsa_priv = null;
    let _resumes = {};
    let _crypto_module = null;

    this.emitRouter = () => {console.log('[*ERR*] emit not implemented');};

    // daemon side
    this.RsRouter = (connprofile, data) => {
      let resume = _resumes[connprofile.returnGUID()];
      _crypto_module.decryptString('RSA2048', _rsa_priv, data, (err, decrypted) => {
        let json = null;
        try {
          json = JSON.parse(decrypted);

          let host_rsa_pub = _rsa_pub;
          let client_random_num = json.r;
          _crypto_module.generateAESCBC256KeyByHash(host_rsa_pub, client_random_num, (err, aes_key) => {
            if(aes_key == json.a) {
              connprofile.setBundle('aes_256_cbc_key', aes_key);
              connprofile.setBundle('NSPS', true);
              connprofile.setBundle('NSPSremote', true);
              resume(err, true);
            }
            else {
              resume(err, false);
            }

          });
        }
        catch (err) {
          console.log(err);
          resume(false, false);
        }
      });
    };

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

  let Utils = {
    setCookie: (cname, cvalue, exdays)=> {
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
      setCookie(name,"",-1);
    },
    returnPassword: function(prompt) {
        if (prompt) {
          process.stdout.write(prompt);
        }

        var stdin = process.stdin;
        stdin.resume();
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        var password = '';
        stdin.on('data', function (ch) {
            ch = ch.toString('utf8');

            switch (ch) {
            case "\n":
            case "\r":
            case "\u0004":
                // They've finished typing their password
                process.stdout.write('\n');
                stdin.setRawMode(false);
                stdin.pause();
                return password;
                break;
            case "\u0003":
                // Ctrl-C
                return null;
                break;
            case BACKSPACE:
                password = password.slice(0, password.length - 1);
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(prompt);
                process.stdout.write(password.split('').map(function () {
                  return '*';
                }).join(''));
                break;
            default:
                // More passsword characters
                process.stdout.write('*');
                password += ch;
                break;
            }
        });
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

  let Core = function(settings) {
    // initialize variables
    let _connection = null;
    let _authorization = null;
    let _authorizationhandler = null;
    let _authenticity = null;
    let _router = null;
    let _service = null;
    let _entity = null;
    let _serviceAPI = null;
    let _implementation = null;
    let _nocrypto = null;
    let _nsps = null;

    let verbose = (tag, log) => {
      if(settings.verbose||settings.debug) {
        Utils.tagLog(tag, log);
      };
    };

    this.checkandlaunch = () => {
      // initialize environment
      verbose('Daemon', 'Checking environment...')
      if (this.isinitialized() == false) {
        this.initialize(this.launch);
      }
      else {
        this.launch();
      }
      ;
    };

    this.launch = () => {
      Utils.printLOGO(Vars.version, Vars.copyright);

      // setup variables
      verbose('Daemon', 'Setting up variables.')
      _connection = new Connection();
      _authorizationhandler = new AuthorizationHandler();
      _router = new Router();
      _service = new Service();
      _implementation = new Implementation();
      _nocrypto = new NoCrypto();
      _nsps = new NSPS();

      // setup Implementation on browser.
      // setup NSF Auth implementation
      _implementation.setImplement('signin', (conn_method, remote_ip, port, callback)=>{
        _implementation.setImplement('onToken', callback);
        console.log('Please signin your account.');
        window.open('login.html?conn_method='+conn_method+'&remote_ip='+remote_ip+'&port='+port, '_blank');
      });

      // setup NSF Auth implementation
      _implementation.setImplement('AuthbyToken', (callback) => {
        let pass = true;
        if(_token == null) {
          _implementation.returnImplement('signin')(DAEMONTYPE, DAEMONIP, DAEMONPORT, (err, token)=>{
            _token = token;
            if(_token != null) {
              callback(false, _token);
            }
          });
        }
        else {
          callback(false, _token);
        }

      });

      // setup NSF Auth implementation
      _implementation.setImplement('AuthbyPassword', (callback) => {
        _get_password((err, p) => {
          callback(err, p);
        });
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
            NSPS: _nsps,
            Daemon: _daemon
          };
        verbose('Daemon', 'Creating coregateway done.')

      for(let i in settings.connection_servers) {
        settings.trusted_domains.push(settings.connection_servers[i].ip);
      }

      // setup NOOXY Service protocol secure
      _nsps.importRSA2048KeyPair(fs.readFileSync(settings.rsa_2048_priv_key, 'utf8'), fs.readFileSync(settings.rsa_2048_pub_key, 'utf8'));
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

      // setup authenticity
      _authenticity.TokenExpirePeriod = settings.token_expire_period;
      _authenticity.importDatabase(settings.database_path);

      // setup entity
      // pass

      // setup Authorization
      _authorization.importAuthenticityModule(_authenticity);
      _authorization.importEntityModule(_entity);
      _authorization.importTrustedDomains(settings.trusted_domains);
      _authorization.importDaemonAuthKey(settings.daemon_authorization_key);

      // setup AuthorizationHandler
      _authorizationhandler.importImplementationModule(_implementation);

      // setup service
      _service.setDebug(settings.debug);
      _service.setupServicesPath(settings.services_path);
      _service.importAuthorization(_authorization);
      // add shell related service to List.
      if(settings.shell_service != null && settings.services.includes(settings.shell_service) == false) {
        settings.services.push(settings.shell_service);
      }
      if(settings.shell_client_service != null && settings.services.includes(settings.shell_client_service) == false) {
        settings.services.push(settings.shell_client_service);
      }
      // add debug
      if(settings.debug == true && settings.debug_service != null && settings.services.includes(settings.debug_service) == false) {
        settings.services.unshift(settings.debug_service);
      }
      verbose('Daemon', 'Debug service enabled.');

      _service.importServicesList(settings.services);
      _service.importEntity(_entity);
      _service.importAPI(_serviceAPI);
      _service.importOwner(settings.local_services_owner);
      _service.importDaemonAuthKey(settings.daemon_authorization_key);
      // setup User

      //

      // setup api
      _serviceAPI.importCore(coregateway);

      verbose('Daemon', 'Setting up variables done.');

      // launch services
      verbose('Daemon', 'Launching services...');
      _service.launch();
      verbose('Daemon', 'Launching services done.');
      //
      verbose('Daemon', 'NOOXY Service Framework successfully started.');
      if(settings.shell_service == null) {
        verbose('Shell', 'Shell Service not implemented.');
      }

      if(settings.shell_client_service == null) {
        verbose('Shellc', 'Local Shell not implemented.');
      }

    }

    this.isinitialized = () => {
      if (fs.existsSync(_path+'eula.txt')&&fs.existsSync(settings.database_path)) {

        if(settings.sercure == false) {
          return true;
        }
        else if(fs.existsSync(settings.rsa_2048_priv_key) && fs.existsSync(settings.rsa_2048_pub_key)) {
          return true;
        }
        else {
          Utils.tagLog('*ERR*', 'Secure is on. But RSA2048 Key Pair is not set. Please geneate it by openssl.');
          Utils.tagLog('*ERR*', 'Your settings:');
          Utils.tagLog('*ERR*', 'PrivateKey: '+settings.rsa_2048_priv_key);
          Utils.tagLog('*ERR*', 'PublicKey: '+settings.rsa_2048_pub_key);
          process.exit()
          return false;
        }
      }
      else {
        return false;
      }
    }

    this.initialize = (callback) => {
      verbose('Daemon', 'Initializing NSd...')
      verbose('Daemon', 'Creating eula...')

      if (fs.existsSync(settings.database_path)) {
        verbose('Daemon', 'Database already exist.')
      }
      verbose('Daemon', 'Creating database...')
      let _auth = new Authenticity();
      _auth.createDatabase(settings.database_path);
      _auth.createUser(Vars.default_user.username, Vars.default_user.displayname, Vars.default_user.password, 0, null, (err)=> {
        if(err) {
          verbose('Daemon', '[ERR] Occur failure on creating database.');
        }
        else {
          verbose('Daemon', 'NSF Superuser "'+Vars.default_user.username+'" with password "'+Vars.default_user.password+'" created. Please change password later for security.');
        }
        fs.writeFile('./eula.txt', '', function(err) {
          if(err) {
              return console.log(err);
          }
        });
        verbose('Daemon', 'NSd initilalized.');
        callback(err);
      });
    }
  }

  this.connect = (hostip, hostport) => {

  }

  this.createActivitySocket = (service_name) => {

  };
}
