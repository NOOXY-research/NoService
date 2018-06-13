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

  this.launch = () => {
    Utils.printLOGO('aphla', 'copyright(c)2018 NOOXY inc.');
    // initialize environment
    Utils.tagLog('Daemon', 'Checking environment...')
    if (this.isinitialized() == false) {
      this.initialize();
    };
    Utils.tagLog('Daemon', 'Checking environment done.')

    // initialize variables
    Utils.tagLog('Daemon', 'Initializing variables.')
    let _connection = new Connection();
    let _authorization = null;
    let _authenticity = null;
    let _router = null;
    let _service = null;
    let _entity = null;
    let _serviceAPI = null;
    Utils.tagLog('Daemon', 'Initializing variables done.')

    // setup variables
    Utils.tagLog('Daemon', 'Setting up variables.')
    _connection = new Connection();
    _authorization = new Authorization();
    _authenticity = new Authenticity();
    _router = new Router();
    _service = new Service();
    _entity = new Entity();
    _serviceAPI = new ServiceAPI();

      // create gateway
      Utils.tagLog('Daemon', 'Creating coregateway...')
      let coregateway = {
          Settings: settings,
          Authoration: _authorization,
          Service : _service,
          Connection: _connection,
          Router: _router,
          ServiceAPI: _serviceAPI,
          Entity: _entity,
          Authenticity: _authenticity
        };
      Utils.tagLog('Daemon', 'Creating coregateway done.')

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
    _service.importServicesList(settings.services);
    _service.importEntity(_entity);
    _service.importAPI(_serviceAPI);
    _service.importOwner(settings.local_services_owner);

    // setup User

    //

    // setup api
    _serviceAPI.importCore(coregateway);

    Utils.tagLog('Daemon', 'Setting up variables done.');

    // launch services
    Utils.tagLog('Daemon', 'Launching services...');
    console.log();
    _service.launch();
    Utils.tagLog('Daemon', 'Launching services done.');
    //
    Utils.tagLog('Daemon', 'NOOXY Service Framework successfully started.');
    Utils.tagLog('Shell', 'Local Shell not implemented.');
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
    Utils.tagLog('Daemon', 'Initializing NSd...')
    Utils.tagLog('Daemon', 'Creating eula...')

    if (fs.existsSync(_path+settings.database_path)) {
      Utils.tagLog('Daemon', 'Database already exist.')
    }
    else {
      Utils.tagLog('Daemon', 'Creating database...')
      let _auth = new Authenticity();
      _auth.createDatabase(_path+settings.database_path);
      _auth.createUser('root', 'rootd', 'root', 0,(err)=> {
        if(err) {
          Utils.tagLog('Daemon', '[ERR] Occur failure on creating database.');
        }
        else {
          Utils.tagLog('Daemon', 'NSF Superuser "root" with password "root" created. Please change password later for security.');
        }
      });
    }

    fs.writeFile('./eula.txt', '', function(err) {
      if(err) {
          return console.log(err);
      }
    });
    Utils.tagLog('Daemon', 'NSd initilalized.');
  }
}


module.exports = Core;
