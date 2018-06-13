// NSF/NSd/core.js
// Description:
// "core.js" control main behavior of deamon.
// Copyright 2018 NOOXY. All Rights Reserved.

var fs = require('fs');


let Connection = require('./connection');
let Authorization = require('./authorization');
let Authenticity = require('./authenticity');
let Router = require('./router');
let Service = require('./service');
let Entity = require('./entity');
let ServiceAPI = require('./serviceapi');
let Implementation = require('./implementation');
let Log = null;
let Utils = require('./utilities');


function Core(settings) {
  let _runtime_id = Utils.generateGUID();
  let _path = settings['path'];

  // initialize variables
  let _connection = null;
  let _authorization = null;
  let _authenticity = null;
  let _router = null;
  let _service = null;
  let _entity = null;
  let _serviceAPI = null;
  let _implementation = null;

  let verbose = (tag, log) => {
    if(settings.verbose) {
      Utils.tagLog(tag, log);
    };
  };

  this.launch = () => {
    Utils.printLOGO('aphla', 'copyright(c)2018 NOOXY inc.');
    // initialize environment
    verbose('Daemon', 'Checking environment...')
    if (this.isinitialized() == false) {
      this.initialize();
    };
    verbose('Daemon', 'Checking environment done.')

    // initialize variables
    verbose('Daemon', 'Initializing variables.')
    let _connection = new Connection();
    let _authorization = null;
    let _authenticity = null;
    let _router = null;
    let _service = null;
    let _entity = null;
    let _serviceAPI = null;
    verbose('Daemon', 'Initializing variables done.')

    // setup variables
    verbose('Daemon', 'Setting up variables.')
    _connection = new Connection();
    _authorization = new Authorization();
    _authenticity = new Authenticity();
    _router = new Router();
    _service = new Service();
    _entity = new Entity();
    _serviceAPI = new ServiceAPI();
    _implementation = new Implementation();

      // create gateway
      verbose('Daemon', 'Creating coregateway...')
      let coregateway = {
          Settings: settings,
          Authoration: _authorization,
          Service : _service,
          Connection: _connection,
          Router: _router,
          ServiceAPI: _serviceAPI,
          Entity: _entity,
          Authenticity: _authenticity,
          Implementation: _implementation
        };
      verbose('Daemon', 'Creating coregateway done.')

    // setup router
    _router.importCore(coregateway);

    // setup connection
    for(var server in settings.connection_servers) {
      _connection.addServer(settings.connection_servers[server].type,
         settings.connection_servers[server].ip, settings.connection_servers[server].port);
    }

    // setup authenticity
    _authenticity.TokenExpirePeriod = settings.token_expire_period;
    _authenticity.importDatabase(_path+settings.database_path);

    // setup entity
    // pass

    // setup authoration
    _authorization.importAuthenticityModule(_authenticity);
    _authorization.importEntityModule(_entity);
    _authorization.importTrustDomains(_path+settings.trusted_domains);



    // setup service
    _service.setupServicesPath(_path+settings.services_path);
    _service.importAuthorization(_authorization);
    // add shell related service to List.
    if(settings.shell_service != null) {
      settings.services.push(settings.shell_service && settings.services.includes(settings.shell_service) == false);
    }
    if(settings.shell_client_service != null && settings.services.includes(settings.shell_client_service) == false) {
      settings.services.push(settings.shell_client_service);
    }
    //
    _service.importServicesList(settings.services);
    _service.importEntity(_entity);
    _service.importAPI(_serviceAPI);
    _service.importOwner(settings.local_services_owner);

    // setup User

    //

    // setup api
    _serviceAPI.importCore(coregateway);

    verbose('Daemon', 'Setting up variables done.');

    // launch services
    verbose('Daemon', 'Launching services...');
    console.log();
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
    if (fs.existsSync('./eula.txt')) {

      return true;
    }
    else {
      return false;
    }
  }

  this.initialize = () => {
    verbose('Daemon', 'Initializing NSd...')
    verbose('Daemon', 'Creating eula...')

    if (fs.existsSync(_path+settings.database_path)) {
      verbose('Daemon', 'Database already exist.')
    }
    else {
      verbose('Daemon', 'Creating database...')
      let _auth = new Authenticity();
      _auth.createDatabase(_path+settings.database_path);
      _auth.createUser('root', 'rootd', 'root', 0,(err)=> {
        if(err) {
          verbose('Daemon', '[ERR] Occur failure on creating database.');
        }
        else {
          verbose('Daemon', 'NSF Superuser "root" with password "root" created. Please change password later for security.');
        }
      });
    }

    fs.writeFile('./eula.txt', '', function(err) {
      if(err) {
          return console.log(err);
      }
    });
    verbose('Daemon', 'NSd initilalized.');
  }
}


module.exports = Core;
