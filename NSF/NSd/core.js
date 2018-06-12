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
    // initialize environment
    console.log('Checking environment...')
    if (this.isinitialized() == false) {
      this.initialize();
    };
    console.log('Checking environment done.')

    // initialize variables
    console.log('Initializing variables.')
    let _connection = new Connection();
    let _authorization = null;
    let _authenticity = null;
    let _router = null;
    let _service = null;
    let _entity = null;
    let _serviceAPI = null;
    console.log('Initializing variables done.')

    // setup variables
    console.log('Setting up variables.')
    _connection = new Connection();
    _authorization = new Authorization();
    _authenticity = new Authenticity();
    _router = new Router();
    _service = new Service();
    _entity = new Entity();
    _serviceAPI = new ServiceAPI();

      // create gateway
      console.log('Creating coregateway...')
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
      console.log('Creating coregateway done.')

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

    // setup api
    _serviceAPI.importCore(coregateway);

    console.log('Setting up variables done.');

    // launch services
    console.log('Launching services...');
    console.log();
    _service.launch();
    console.log('Launching services done.');

    console.log('NOOXY Service Framework successfully started.');
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
    console.log('Initializing NSd...')
    console.log('Creating eula...')

    if (fs.existsSync(_path+settings.database_path)) {
      console.log('Database already exist.')
    }
    else {
      console.log('Creating database...')
      let _auth = new Authenticity();
      _auth.createDatabase(_path+settings.database_path);
      _auth.createUser('root', 'rootd', 'root', 0,(err)=> {
        if(err) {
          console.log('[ERR] Occur failure on creating database.');
        }
        else {
          console.log('NSF Superuser "root" with password "root" created. Please change password later for security.');
        }
      });
    }

    fs.writeFile('./eula.txt', '', function(err) {
      if(err) {
          return console.log(err);
      }
    });
    console.log('NSd initilalized.');
  }
}


module.exports = Core;
