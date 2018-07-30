// NSF/NSd/core.js
// Description:
// "core.js" control main behavior of deamon.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

var fs = require('fs');



let Connection = require('./connection');
let Authorization = require('./authorization').Authorization;
let AuthorizationHandler = require('./authorization').AuthorizationHandler;
let Authenticity = require('./authenticity');
let Router = require('./router');
let Service = require('./service');
let Entity = require('./entity');
let ServiceAPI = require('./serviceapi');
let Implementation = require('./implementation');
let Log = null;
let Utils = require('./utilities');
let NoCrypto = require('./crypto').NoCrypto;
let NSPS = require('./crypto').NSPS;
let Vars = require('./variables');

function Core(settings) {
  let verbose = (tag, log) => {
    if(settings.verbose||settings.debug) {
      Utils.tagLog(tag, log);
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



  this.checkandlaunch = () => {
    // initialize environment
    verbose('Daemon', 'Checking environment...')
    if (this.isinitialized() == false) {
      this.initialize((err)=>{
        if(err) {
          process.exit();
        }
        else {
          this.launch();
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
      Utils.printLOGO(Vars.version, Vars.copyright);

      process.title = 'NSF-daemon';
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

        //
        let _daemon = {
          Settings: settings,
          close: () => {
            _connection.close();
            _router.close();
            _service.close();
            _authorization.close();
            _authorizationhandler.close();
            _authenticity.close();
            _entity.close();
            _serviceAPI.close();
            _implementation.close();
            _nocrypto.close();
            _nsps.close();
            verbose('Daemon', 'Stopping daemon in '+settings.kill_daemon_timeout+'ms.');
            setTimeout(process.exit, settings.kill_daemon_timeout);
          },
          restart: ()=> {
            _daemon.close();
          },
          Variables: Vars
        }
        process.on('SIGINT', () => {
          verbose('Daemon', 'Caught interrupt signal.');
          _daemon.close();
        });
        // create gateway
        verbose('Daemon', 'Creating coregateway...');
        let coregateway = {
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
            Daemon: _daemon
          };
        verbose('Daemon', 'Creating coregateway done.')
      // trust myself
      settings.connection_servers.push({
            "type": "Local",
            "ip": "LOCALIP",
            "port": "LOCALPORT"
      });

      if(settings.default_server == 'Local' || settings.default_server == null ) {
        settings.default_server = settings.connection_servers.length-1;
      }

      for(let i in settings.connection_servers) {
        settings.trusted_domains.push(settings.connection_servers[i].ip);
      }

      // setup NOOXY Service protocol secure
      _nsps.importRSA2048KeyPair(fs.readFileSync(settings.rsa_2048_priv_key, 'utf8'), fs.readFileSync(settings.rsa_2048_pub_key, 'utf8'));
      _nsps.importCryptoModule(_nocrypto);
      // setup router
      _router.importCore(coregateway);

      // setup connection
      if(settings.ssl_priv_key!=null && settings.ssl_cert!=null) {
        // read ssl certificate
        let privateKey = fs.readFileSync(settings.ssl_priv_key, 'utf8');
        let certificate = fs.readFileSync(settings.ssl_cert, 'utf8');
        _connection.importSSLPrivateKey(privateKey);
        _connection.importSSLCert(certificate);
      }

      for(var server in settings.connection_servers) {
        _connection.addServer(settings.connection_servers[server].type,
           settings.connection_servers[server].ip, settings.connection_servers[server].port);
      }

      _connection.importHeartBeatCycle(settings.heartbeat_cycle);

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
      _service.setupServicesFilesPath(settings.services_files_path);
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
    };
    launchwrap();
  }

  this.isinitialized = () => {
    if (fs.existsSync('eula.txt')&&fs.existsSync(settings.database_path)) {

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
    let _auth = new Authenticity();
    if (fs.existsSync(settings.database_path)) {
      verbose('Daemon', 'Database already exist.')
      _auth.importDatabase(settings.database_path);
    }
    else {
      verbose('Daemon', 'Creating database...')
      _auth.createDatabase(settings.database_path);
    }
    _auth.createUser(Vars.default_user.username, Vars.default_user.displayname, Vars.default_user.password, 0, null, 'The', 'Admin', (err)=> {
      if(err) {
        Utils.tagLog('*ERR*', 'Occur failure on creating database.');
        console.log(err);
        callback(err);
      }
      else {
        verbose('Daemon', 'NSF Superuser "'+Vars.default_user.username+'" with password "'+Vars.default_user.password+'" created. Please change password later for security.');
        fs.writeFile('./eula.txt', '', function(err) {
          if(err) {
            Utils.tagLog('*ERR*', 'Writing EULA error.');
            console.log(err);
            callback(err);
          }
          else {
            verbose('Daemon', 'NSd initilalized.');
            callback(err);
          }
        });

      }
    });
  }
}


module.exports = Core;
