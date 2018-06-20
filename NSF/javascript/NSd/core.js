// NSF/NSd/core.js
// Description:
// "core.js" control main behavior of deamon.
// Copyright 2018 NOOXY. All Rights Reserved.

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
  let _runtime_id = Utils.generateGUID();
  let _path = settings['path'];

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
      this.initialize(()=>{this.launch()});
    }
    else {
      this.launch();
    }
    ;
  };

  this.launch = () => {
    Utils.printLOGO(Vars.version, Vars.copyright);


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

    // setup variables
    verbose('Daemon', 'Setting up variables.')
    _connection = new Connection();
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
          _authorization.close();
          _authorizationhandler.close();
          _authenticity.close();
          _router.close();
          _service.close();
          _entity.close();
          _serviceAPI.close();
          _implementation.close();
          _nocrypto.close();
          _nsps.close();
        },
        Variables: Vars
      }
      // create gateway
      verbose('Daemon', 'Creating coregateway...')
      let coregateway = {
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

    for(let i in settings.connection_servers) {
      settings.trusted_domains.push(settings.connection_servers[i].ip);
    }

    // setup NOOXY Service protocol secure
    _nsps.importRSA2048KeyPair(fs.readFileSync(_path+settings.rsa_2048_priv_key, 'utf8'), fs.readFileSync(_path+settings.rsa_2048_pub_key, 'utf8'));
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
    _authenticity.importDatabase(_path+settings.database_path);

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
    _service.setupServicesPath(_path+settings.services_path);
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
    if (fs.existsSync(_path+'eula.txt')&&fs.existsSync(_path+settings.database_path)) {

      if(settings.sercure == false) {
        return true;
      }
      else if(fs.existsSync(_path+settings.rsa_2048_priv_key) && fs.existsSync(_path+settings.rsa_2048_pub_key)) {
        return true;
      }
      else {
        Utils.tagLog('*ERR*', 'Secure is on. But RSA2048 Key Pair is not set. Please geneate it by openssl.');
        Utils.tagLog('*ERR*', 'Your settings:');
        Utils.tagLog('*ERR*', 'PrivateKey: '+_path+settings.rsa_2048_priv_key);
        Utils.tagLog('*ERR*', 'PublicKey: '+_path+settings.rsa_2048_pub_key);
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

    if (fs.existsSync(_path+settings.database_path)) {
      verbose('Daemon', 'Database already exist.')
    }
    verbose('Daemon', 'Creating database...')
    let _auth = new Authenticity();
    _auth.createDatabase(_path+settings.database_path);
    _auth.createUser('root', 'displayname', 'root', 0, (err)=> {
      if(err) {
        verbose('Daemon', '[ERR] Occur failure on creating database.');
      }
      else {
        verbose('Daemon', 'NSF Superuser "root" with password "root" created. Please change password later for security.');
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


module.exports = Core;
