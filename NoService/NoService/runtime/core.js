// NoService/NoService/runtime/core.js
// Description:
// "core.js" control main behavior of deamon.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const fs = require('fs');

let Constants = require('./constants');
const Implementation = require('./implementation');

function Core(NoServiceLibrary, settings) {
  if(settings['path'])
    process.chdir(settings['path'])

  const Log = null;
  const Connection = NoServiceLibrary.Connection.Connection;
  const Utils = NoServiceLibrary.Library.Utilities;
  const NoCrypto = NoServiceLibrary.Crypto.Crypto;

  // router
  const Router = NoServiceLibrary.Router.Router;
  const NSPS = NoServiceLibrary.Router.NSPS;

  // auth
  const Authorization = NoServiceLibrary.Authorization.Authorization;
  const AuthorizationHandler = NoServiceLibrary.Authorization.AuthorizationHandler;

  // service
  const Service = NoServiceLibrary.Service.Service;
  const WorkerDaemon = NoServiceLibrary.Service.WorkerDaemon;
  const ServiceAPI = NoServiceLibrary.Service.ServiceAPI;
  const Entity = NoServiceLibrary.Service.Entity;

  // db
  const Database = NoServiceLibrary.Database.Database;
  const Model = NoServiceLibrary.Database.Model;
  const Authenticity = NoServiceLibrary.Database.Authenticity;

  Utils.printLOGO(Constants.version, Constants.copyright);

  let verbose = (tag, log) => {
    if(settings.verbose||settings.debug) {
      Utils.TagLog(tag, log);
    };
  };

  let _runtime_id = Utils.generateGUID();
  let _path = settings['path'];
  verbose('Daemon', 'Path setted as '+ _path);
  settings.services_path = _path+settings.services_path;
  settings.services_files_path = _path+settings.services_files_path;
  settings.rsa_2048_priv_key = settings.rsa_2048_priv_key;
  settings.rsa_2048_pub_key = settings.rsa_2048_pub_key;
  settings.database_path = settings.database_path;
  // initialize variables
  let _connection;
  let _authorization;
  let _authorizationhandler;
  let _authenticity;
  let _router;
  let _service;
  let _entity;
  let _serviceAPI;
  let _implementation;
  let _nocrypto;
  let _nsps;
  let _workerd;
  let _database;
  let _model;


  this.checkandlaunch = () => {
    // initialize environment
    verbose('Daemon', 'Checking environment...')

    if (this.isinitialized() === false) {
      this.initialize((err)=>{
        if(err) {
          verbose('*ERR*', 'Error occured during initializing.');
          console.log(err);
          this.onTerminated();
        }
        else {
          Utils.TagLog('OKAY', 'Initialized. Please restart!');
          process.exit();
        }
      });
    }
    else {
      this.launch();
    }
    ;
  };

  this.launch = () => {
    let launchwrap = ()=>{

      process.title = settings.daemon_name;

      if (process.pid) {
        verbose('Daemon', 'Process Id: ' + process.pid);
      }
      // initialize variables
      // verbose('Daemon', 'Initializing variables.')
      // // let _connection = null;
      // // let _authorization = null;
      // // let _authorizationhandler = null;
      // // let _authenticity = null;
      // // let _router = null;
      // // let _service = null;
      // // let _entity = null;
      // // let _serviceAPI = null;
      // // let _implementation = null;
      // // let _nocrypto = null;
      // // let _nsps = null;
      // verbose('Daemon', 'Initializing variables done.')
      verbose('Daemon', 'Starting directory: ' + process.cwd());
      // setup variables
      verbose('Daemon', 'Setting up variables.')
      _connection = new Connection({allow_ssl_self_signed: true});
      _authorization = new Authorization();
      _authorizationhandler = new AuthorizationHandler();
      _authenticity = new Authenticity();
      _router = new Router();
      _service = new Service();
      _entity = new Entity();
      _serviceAPI = new ServiceAPI();
      _implementation = new Implementation();
      _nocrypto = new NoCrypto();
      _nsps = new NSPS();
      _database = new Database(settings.database);
      _model = new Model();
      _workerd = new WorkerDaemon()

        //
        let _daemon = {
          Settings: settings,
          close: () => {
            if(!_daemon.close_emmited) {
              process.send({t:0});
              _daemon.close_emmited = true;
              _connection.close();
              _router.close();
              _service.close(()=> {
                _authorization.close();
                _authorizationhandler.close();
                _authenticity.close();
                _entity.close();
                _serviceAPI.close();
                _implementation.close();
                _nocrypto.close();
                _nsps.close();
                _workerd.close();
                verbose('Daemon', 'Stopping daemon in '+settings.kill_daemon_timeout+'ms.');
                setTimeout(process.exit, settings.kill_daemon_timeout);
              });
            }
          },
          relaunch: ()=> {
            if(!_daemon.close_emmited) {
              _daemon.close_emmited = true;
              _connection.close();
              _router.close();
              _service.close(()=> {
                _authorization.close();
                _authorizationhandler.close();
                _authenticity.close();
                _entity.close();
                _serviceAPI.close();
                _implementation.close();
                _nocrypto.close();
                _nsps.close();
                _workerd.close();
                verbose('Daemon', 'Relaunching daemon in '+settings.kill_daemon_timeout+'ms.');
                setTimeout(process.exit, settings.kill_daemon_timeout);
              });
            }
          },
          Variables: Constants
        }

        this.close = _daemon.close;

        process.on('SIGINT', () => {
          verbose('Daemon', 'Caught interrupt signal.');
          _daemon.close();
        });
        // create gateway
        verbose('Daemon', 'Creating coregateway...');
        let coregateway = {
            Database: _database,
            Model: _model,
            Utilities: Utils,
            Settings: settings,
            Authorization: _authorization,
            AuthorizationHandler: _authorizationhandler,
            Service : _service,
            Connection: _connection,
            Router: _router,
            ServiceAPI: _serviceAPI,
            Entity: _entity,
            Authenticity: _authenticity,
            Implementation: _implementation,
            NoCrypto: _nocrypto,
            NSPS: _nsps,
            Daemon: _daemon,
            Variables: Constants
          };
        verbose('Daemon', 'Creating coregateway done.')
      // trust myself
      settings.connection_servers.push({
            "type": "Local",
            "ip": "LOCALIP",
            "port": "LOCALPORT"
      });

      if(settings.default_server === 'Local' || !settings.default_server ) {
        settings.default_server = settings.connection_servers.length-1;
      }

      for(let i in settings.connection_servers) {
        settings.trusted_domains.push(settings.connection_servers[i].ip);
      }

      // setup NOOXY Service protocol secure
      try {
        _nsps.importRSA2048KeyPair(fs.readFileSync(settings.rsa_2048_priv_key, 'utf8'), fs.readFileSync(settings.rsa_2048_pub_key, 'utf8'));
        _nsps.importCryptoModule(_nocrypto);
        _nsps.importOperationTimeout(settings.operations_timeout);
        // setup router
        _router.importCore(coregateway);
      }
      catch(e) {

      }

      // setup connection
      _connection.setDebug(settings.debug);
      if(settings.ssl_priv_key!=null && settings.ssl_cert!=null) {
        // read ssl certificate
        let privateKey = fs.readFileSync(settings.ssl_priv_key, 'utf8');
        let certificate = fs.readFileSync(settings.ssl_cert, 'utf8');
        _connection.importSSLPrivateKey(privateKey);
        _connection.importSSLCert(certificate);
      }

      _connection.importConnectionMethodNameMap(Constants.CONNECTION_METHOD_NAME_MAP);

      for(let server in settings.connection_servers) {
        _connection.addServer(settings.connection_servers[server].type,
           settings.connection_servers[server].ip, settings.connection_servers[server].port);
      }

      _connection.importHeartBeatCycle(settings.heartbeat_cycle);



      // setup implementation
      _implementation.importConnectionModule(_connection);

      // connect to database
      verbose('Daemon', 'Connecting to database.')
      _database.connect((err)=> {
        if(err) {
          Utils.TagLog('*ERR*', 'Occur failure on connecting database.');
          throw(err);
        }
        verbose('Daemon', 'Importing Database to Model...');
        // Import connected db to model module
        _model.setTableName(Constants.MODEL_TABLE_NAME);
        _model.setTablePrefix(Constants.MODEL_TABLE_PREFIX);
        _model.setIndexkey(Constants.MODEL_INDEX_KEY);
        _model.setGroupkey(Constants.MODEL_GROUP_KEY);

        _model.importDatabase(_database, (err)=> {
          if(err) {
            Utils.TagLog('*ERR*', 'Occur failure on importing database for model.');
            throw(err);
          }
          verbose('Daemon', 'Importing Model to Authenticity...')

          // setup authenticity
          _authenticity.TokenExpirePeriod = settings.token_expire_period;
          _authenticity.setDefaultUsername(Constants.default_user.username);
          _authenticity.setUserModelName(Constants.AUTHE_USER_MODEL_NAME);

          _authenticity.importModelModule(_model, (err)=> {
            if(err) {
              Utils.TagLog('*ERR*', 'Occur failure on importing model for authenticity.');
              throw(err);
            }
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
            _service.importWorkerDaemon(_workerd);
            _service.setDebugService(settings.debug_service);
            _service.setMasterService(settings.master_service);
            _service.setupServicesPath(settings.services_path);
            _service.setupServicesFilesPath(settings.services_files_path);
            _service.importAuthorization(_authorization);
            _service.importAuthenticity(_authenticity);
            // add shell related service to List.
            if(settings.shell_service != null) {
              let index = settings.services.indexOf(settings.shell_service);
              if(index>=0)
                settings.services.splice(index, 1);
              settings.services.push(settings.shell_service);
            }
            if(settings.shell_client_service != null) {
              let index = settings.services.indexOf(settings.shell_client_service);
              if(index>=0)
                settings.services.splice(index, 1);
              settings.services.push(settings.shell_client_service);

            }
            // add debug
            if(settings.debug_service != null ) {
              let index = settings.services.indexOf(settings.debug_service);
              if(index>=0)
                settings.services.splice(index, 1);
              settings.services.unshift(settings.debug_service);
            }
            verbose('Daemon', 'Debug service enabled.');

            _service.importServicesList(settings.services);
            _service.importEntity(_entity);
            _service.importAPI(_serviceAPI);
            _service.importOwner(settings.local_services_owner);
            _service.importDaemonAuthKey(settings.daemon_authorization_key);
            // setup WorkerDaemon
            _workerd.importCloseTimeout(settings.kill_daemon_timeout);
            _workerd.importClearGarbageTimeout(settings.clear_garbage_timeout);
            _workerd.setConstantsPath(require("path").join(__dirname, './constants.json'));
            _workerd.setUnixSocketPath(Constants.WORKER_UNIX_SOCK_PATH);
            _workerd.start();

            //

            // setup api
            _serviceAPI.importCore(coregateway);

            verbose('Daemon', 'Setting up variables done.');

            // launch services
            verbose('Daemon', 'Launching services...');
            _service.launch((err)=> {
              if(err) {
                _daemon.close();
              }
            });
            verbose('Daemon', 'Launching services done.');
            //
            verbose('Daemon', 'NOOXY Service Framework successfully started.');
            if(!settings.shell_service) {
              verbose('Shell', 'Shell Service not implemented.');
            }

            if(!settings.shell_client_service) {
              verbose('Shellc', 'Local Shell not implemented.');
            }

          });
        });
      });
    };
    launchwrap();
  }

  this.isinitialized = () => {
    if (fs.existsSync('eula.txt')) {
      if(settings.sercure === false) {
        return true;
      }
      else if(fs.existsSync(settings.rsa_2048_priv_key) && fs.existsSync(settings.rsa_2048_pub_key)) {
        return true;
      }
      else {
        Utils.TagLog('*ERR*', 'Secure is on. But RSA2048 Key Pair is not set. Please geneate it by openssl.');
        Utils.TagLog('*ERR*', 'Your settings:');
        Utils.TagLog('*ERR*', 'PrivateKey: '+settings.rsa_2048_priv_key);
        Utils.TagLog('*ERR*', 'PublicKey: '+settings.rsa_2048_pub_key);
        Utils.TagLog('*ERR*', '-');
        Utils.TagLog('*ERR*', 'You can generate it in UNIX system by openssl.');
        Utils.TagLog('*ERR*', '$ openssl genrsa -des3 -out private.pem 2048');
        Utils.TagLog('*ERR*', '$ openssl rsa -in private.pem -outform PEM -pubout -out public.pem');
        Utils.TagLog('*ERR*', '$ openssl rsa -in private.pem -out private.pem -outform PEM');
        this.onTerminated();
        return false;
      }
    }
    else {
      return false;
    }
  }

  this.initialize = (callback) => {
    verbose('Daemon', 'Initializing NoService daemon...')
    verbose('Daemon', 'Checking Database and Authenticity...');

    let _init_db = new Database(settings.database);
    let _init_model = new Model();
    let _init_auth = new Authenticity();


    // Connect to db
    _init_db.connect((err)=> {
      if(err) {
        Utils.TagLog('*ERR*', 'Occur failure on connecting database.');
        throw(err);
      }
      verbose('Daemon', 'Importing Database...')
      // Import connected db to model module
      _init_model.setTableName(Constants.MODEL_TABLE_NAME);
      _init_model.setTablePrefix(Constants.MODEL_TABLE_PREFIX);
      _init_model.setIndexkey(Constants.MODEL_INDEXKEY);
      _init_model.setGroupkey(Constants.MODEL_GROUPKEY);

      _init_model.importDatabase(_init_db, (err)=> {
        if(err) {
          Utils.TagLog('*ERR*', 'Occur failure on importing database for model.');
          throw(err);
        }
        verbose('Daemon', 'Importing Model...')
        // setup authenticity
        _init_auth.TokenExpirePeriod = settings.token_expire_period;
        _init_auth.setDefaultUsername(Constants.default_user.username);
        _init_auth.setUserModelName(Constants.AUTHE_USER_MODEL_NAME);
        // Import set Model Module to authenticity.
        _init_auth.importModelModule(_init_model, (err)=>{
          if(err) {
            Utils.TagLog('*ERR*', 'Occur failure on importing model for authenticity.');
            throw(err);
          }
          verbose('Daemon', 'Initializing authenticity...')
          _init_auth.createUser(Constants.default_user.username, Constants.default_user.displayname, Constants.default_user.password, 0, null, 'The', 'Admin', (err)=> {
            if(err) {
              Utils.TagLog('*ERR*', 'Occur failure on creating database.');
              console.log(err);
              callback(err);
            }
            else {
              verbose('Daemon', 'NoService Superuser "'+Constants.default_user.username+'" with password "'+Constants.default_user.password+'" created. Please change password later for security.');
              verbose('Daemon', 'Creating eula...')
              fs.writeFile('./eula.txt', '', (err)=> {
                if(err) {
                  Utils.TagLog('*ERR*', 'Writing EULA error.');
                  console.log(err);
                  callback(err);
                }
                else {
                  verbose('Daemon', 'NoService daemon initilalized.');
                  callback(err);
                }
              });
            }
          });
        });
      });
    });

  }
}

module.exports = Core;
