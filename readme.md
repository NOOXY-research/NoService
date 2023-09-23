![](https://raw.githubusercontent.com/NOOXY-inc/Art-Collection/master/NoService/NoService.png)

We have moved our service project to [NoXerve](https://github.com/NoXerve/NoXerve).
# NoService
Deploy services just like apps
The project is still in alpha!
## Installation and Deploy
``` sh
npm install noservice -save
npx create-noservice .
```
## Launch
1. launcher
``` sh
node launch.js
```
2. NoService Library(via runtime launcher)
``` javascript
const Launcher = require('./NoService').Runtime.Launcher;
const Path = require("path");

Launcher.launch(Path.resolve("./"), Path.resolve("./")+'/setting.json');
```
3. NoService Library(native library)
``` javascript
const NoService = require('./NoService');
const Core = NoService.Runtime.Core;
const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));

// you can modify NoService Library, such as changing module
NoService.Database = require('./my/own/database');

core = new Core(NoService, settings);
core.onTerminated = ()=> {
  // NoService terminated
};

core.checkandlaunch();

```
## What is NoService?
NoService is a high level framework for services that provide you "nodejs" and "python3" environment and eliminate service designer to care about low level part of your project. Such as authorization, user system, database, protocol and so on. It also run multiple services integrated and we also provide a manager and shell to manipulate all of them.

## Examples
1. Game that combine our neuralnet lib and NoService. ([noversi](https://nooxy.org/noversi))
2. Chat service. ([Talksy](https://talk.nooxy.org))
3. Notification([NOOXY](https://nooxy.org))
4. Shell that access NoService. ([NoShell](https://www.nooxy.org/static/NoService/shell.html))
5. A internet radio that uses our technology. ([goto&Play](https://gotoandplay.nctu.edu.tw/))

## Why we build NoService? And why you should give it a try?

### Seperating backend applications from physical differences
NoService provide a API layer that handle backend designer for connection, database and authenticity. Thus you other designer's project can basically deploy on any NoService framework.

### Resource network(distributable) (not yet)
Still working on it. With resource network you are supposed to put any kind of resource such as "database", "gpu" etc anywhere(hosts) that deploy noservice framework.

### All-in-one but async multithreaded
NoService is supposed to be a all-in-one framework. But each service is managed by a worker which is separated thread from core. And since multithread, a service's restart doesn't require restarting the whole framework and maintain connection while relaunching. Which is a huge benefit in deploying on a production environment.

### The missing protocol between TCP layer and Application layer
We think there are a lot to do between TCP layer and Application layer. Which we call it service layer. Provide basic functions for service to be deployed.

### security
NoService has built-in secure protocol built by SHA-256, AES and RSA to secure your data. It also has authorization API, provides you ability to authorize user to protect your data. Besides, you can block IPs and domains. The operations on daemon will not be executed until the client has the right response of authorization that emitted from daemon side.

### lightweight + micro-core
NoService is super-lightweight both in client and daemon. But it has lots of feature. And it's features can be expanded by services and plugins.

### communication between services
The design of NoService sockets that we called service socket and activity socket. With the characteristic of those sockets, services can communicate each others. By this way each service don't need to sync data to promise the data is the newest.

### realtime
NoService is designed for realtime purpose. And it's of course super responsive.

### deploying services
NoService is built for service. From it's protocol to it's local structure. It also have user authorization system natively integrated with protocol and software.

### for general conditions
NoService is designed for any kind of condition such as game, IoT, text contain. However, we have only implemented game([reversi](https://nooxy.org/noversi)), chat([Talksy](https://talk.nooxy.org)), notification([NOOXY](https://nooxy.org)), shell([NoShell](https://www.nooxy.org/static/nsf/shell.html)). Nevertheless the development of NoService is still in progress. We can fix bugs and add features to confirm other abilities.

### cross platform client
Now, NoService can run on browser, react.js(javascript) and desktop(javascript). It also supports TCP/IP, websocket connections. Other languages is still on the way.

### supporting Python in server-side
You can write your service in python and it's event-based asyncio module.

### Make your local scripts online
With ServiceFunction you can wrap your python or node.js scripts into the function that can be called online natively without implement yourself. Which is supported natively in our bundled service "NoShell".

### ServiceSocket + API = NoService
Socket base+API pattern makes the concept easy to understand. NoService wraps the native TCP/IP, websocket or even http polling mode in the future as transportation layer. Make you no need to consider about integrating features with different connections. And with the advantage of NoService, in theory different activities(clients) can share same the socket in the same time.

### Integrated ORM
The intergrated ORM seperate between database interface and your service's logic. Make switching database solution painless. Besides you will need no implement database query yourself.

### Modulizable and plugins
NoService has good software structure which means you can modify the native library to fit your taste. Such as database,  protocol, worker or something else.

### Bundled Services
NoService provide bundled services such as NoShell which give you access of NoService. NoUser for user system. And so on.

## Roadmap
### [alpha version]
- [0.1] First version of NoService
- [0.2] mthread_alpha
- [0.3] ORM_alpha
- [0.4] Service_alpha
- [0.5] python_worker_alpha (python+structural refresh+plugin support)
- ->[0.6] noservice_0_6_x (binaryize protocol NSP 0.5+streaming)
- [0.7] noservice_0_7_x (resource(decentralized) network+more plugin support)
>>>>>>> fed6a788a7ad6a2d42cb7f3fe94183ddc6d38384
- [0.8] noservice_0_8_x (refresh codes)

### [beta version]

### [official version]

## Final goal
not yet
We wish to develop an universal decentralized infrastructural framework for any kind of internet services.

## Target version
* daemon: alpha 0.5.5
* protocol: NSP alpha 0.4

## Dependences

### core
node packages
``` sh
npm install ws --save
```
for sqlite3 database
``` sh
npm install sqlite3 --save
```
for MySQL database
``` sh
npm install mysql --save
```

### NOOXY services bundle
#### NoHttp service(Not yet)
``` sh
npm install express multer --save
```
NOOXY Http Service provide you file upload, oauth and contain control integrated with NoService. If you don't use NoContent service there is no need to install additional packages.

## Document Overview
1. Orientation
2. Architecture
3. serverside module
4. clientside module
5. Service, ServiceSocket and ServiceAPI
6. Activities and ActivitySocket(Client socket)
7. NSP(NoService Protocol)
8. Preinstalled Service
9. Setting file

## NoService's Orientation
1. Entities system(Services, Activities), each entities have it’s profile(with contain that showing attached user and user’s domain) for deciding should it be trusted.
2. User Orientation, User(in a daemon or a client) can create entities(activities, services). Entities and Users are both owned(registered) by NSd(NoService daemon) of particular domain.
3. Server(we call it “Services”) , client(we call it “Activities”) structure.
4. Authorization API for Services. Services have responsibilities to protect their contains itself
5. Module idea, “Everything based on service” concept.
6. Lightweight. “Everything based on service” concept.
7. Decentralized. Make it possible to parallelize task in future.
8. NSP(NoService Protocol) is request response style protocol.

## Architecture
![](https://i.imgur.com/dA1DNxH.png)
### Cluster module Architecture


## Serverside module
### Core
Objective: setting up environment for NOOXY service daemon.

### Connection
Objective: Create a interface to get communication with remote device.

### Router
Objective: A parser and a router. To phrase Json from connection and do local operations. And to switch and trigger between different operations of remotes.

### Authorization
Objective: To provide function(API) to take authoritative actions. Confirming the sensitive data or operation is secured.

### Authenticity
Objective: To interact with Authenticity database. Providing Users  caching, Creating User Obj, User identification.

### Crypto
Objective: Providing AES, RSA, Hashing abilities for NSPS(NoService Protocol Secured).

### Service
Objective: Loading and managing services, and routing the messages on internet. Also provide service socket, activity socket.

### Workerd+Worker+ServiceAPI
Objective: A worker daemon will import API and create communication between a worker client which make service multithreaded.


### Entity(as part of service)
Objective: Create identity system for Service , Activity or future stuff. Entities are generated and being realtime. So there is no need for databases.

## Client-side module(prototype)

### Core
Objective: setting up environment for NOOXY service client.

### Router
Objective: A parser and a router. To phrase Json from connection and do local operations. And to switch and trigger between different operations of remotes.

### Service
Objective: Loading and managing services, and routing the messages on internet. Also provide service socket, activity socket.

### Authorization Handler
Objective: To handle authoritative actions. Confirming the sensitive data or operation is secured.

### Crypto
Objective: Providing AES, RSA, Hasing abilities for NSPS(NoService Protocol Secured).

## Service and Sockets
### Explanation of how service work
Once the core of the NoService is started.
The core of NoService will navigate the directories of “services” directory which is under the root of NoService files. And in that directory it will exist a file called “entry.js”. The figure below can help you understand the concept.
```
------|--(NSd(NoService deamon))-- ...
      |
      |--(services)--|--(services_A)--|--(entry.js)
      |              |                |--(manifest.json)
      |              |
      |              |--(services_B)--|--(entry.js)
      |              |                |--(manifest.json)
      |
      |--(service_files)-- ...
      |
      |--(launch.js)
      |--(settings.json)
```
After the core finish navigating the directories under “services”. It will call the entry.js and call it’s function “start()” and pass API parameter in to start() function. Below show how the “entry.js” file might be.

1. javascript
``` javascript
// NoService/services/youservice/entry.js
// Description:
// "youservice/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

function Service(Me, NoService) {

  // Here is where your service start
  this.start = ()=> {
    // where your service start.
    // do your jobs here
  }

  // If the daemon stop, your service receive close signal here.
  this.close = ()=> {
    // Saving state of you service.
    // Please save and manipulate your files in this directory
  }
}
// Export your work for system here.
module.exports = Service;
```
2. python3
``` python
# entry.py
# Description:
# "entry.py" is an NoService entry point
# Copyright 2019 NOOXY. All Rights Reserved.

class Service:
  def __init__(self, Me, NoService):

  # Here is where your service start
  def start(self, Me, NoService):
    pass
    # where your service start.
    # do your jobs here

  # If the daemon stop, your service receive close signal here.
  def close(self, Me, NoService):
    pass
    # Saving state of you service.
    # Please save and manipulate your files in this directory

```
Beware that code in Service is ran as a superuser

### Creating a service
launch NoService
``` sh
node launch.js
```

type command
```
service create "Your Service name"
```

### Service socket and Activity socket

#### Sending data
Here is an example of sending data from service to client, client to service can be done by same way.

In service
1. javascript
``` javascript
// Your service's entry.js
this.start = ()=> {
  // Get the service socket of your service
  let ss = NoService.Service.ServiceSocket;
  ss.on('connect', (entityId, callback) => {
    // Send msg on connected entity.
    ss.sendData(entityId, 'Hello world!');
    callback(false);
  });
}
```
2. python3
``` python
# Your service's entry.js
def start(self, Me, NoService):
  # Get the service socket of your service
  ss = NoService.Service.ServiceSocket;
  def onConnect(entityId, callback):
    # Send msg on connected entity.
    ss.sendData(entityId, 'Hello world!')
    callback(False)
  ss.on('connect', onConnect)
```

In client(browser)
``` javascript
// In your browser
let _NSc = new NSc();
  _NSc.connect('HostIP', 'HostPort');
  _NSc.createActivitySocket('MyService', (err, as)=>{
    as.onData = (data) => {
      console.log(data); // "Print Hello world!"
    }
  });
```

#### Service function(recommended)
Service function is a framework for self-defined protocol that with "json data-structure" and "request, response" style. It is included by NOOXY service framework. And with Service function NOOXY shell service can natively support the command that call your service.
Note that the function name should be short as possible. Since it will be sent in NSP(NOOXY service protocol).

In client(browser)
Service function called by client
``` javascript
// In your browser
let _NSc = new NSc();
  _NSc.connect('HostIP', 'HostPort');
  _NSc.createActivitySocket('MyService', (err, as)=>{
      // 2nd parameter is for function input
      as.call('Hello', {d:'I am client.'}, (err, json)=>{
        if(err) {
          console.log(err);
        }
        else {
          console.log(json.d); // Print "Hello! NoService Framework!""
        }
      });

      as.call('HelloSecured', {d:'I am client.'}, (err, json)=>{
        if(err) {
          console.log(err);
        }
        else {
          console.log(json.d);
          // Print "Hello! NoService Framework! Secured." If is admin.
        }
      });
  });

```

Service function defined in service

1. javascript
``` javascript
// Your service's entry.js
this.start = ()=> {
  // Normally define a ServiceFunction
  ss.def('Hello', (json, entityId, returnJSON)=>{
    console.log(json.d); // Print "I am client.".
    let json_be_returned = {
      d: 'Hello! NoService Framework!'
    }

    returnJSON(false, json_be_returned);
  });

  // Safe define a ServiceFunction. User should be admin.
  ss.sdef('HelloSecured', (json, entityId, returnJSON)=>{
    console.log(json.d); // Print "I am client.".
    let json_be_returned = {
      d: 'Hello! NoService Framework! Secured.'
    }
    // First parameter for error, next is Service Function to be returned.
    returnJSON(false, json_be_returned);
  },
  // In case fail.
  ()=>{
    console.log('Auth Failed.');
  });

}
```

2. python3
``` python
# Your service's entry.py
def start(self):
  NoService = self.NoService
  ss = NoService.Service.ServiceSocket

  # Normally define a ServiceFunction
  def Hello(json, entityId, returnJSON):
    print(json['d']) # Print "I am client.".
    json_be_returned = {'d': 'Hello! NoService Framework!'}
    returnJSON(false, json_be_returned)

  ss.define('Hello', Hello)

  # Safe define a ServiceFunction. User should be admin.
  def HelloSecuredPass(json, entityId, returnJSON):
    print(json['d']) # Print "I am client.".
    json_be_returned = {'d': 'Hello! NoService Framework! Secured.'}
    returnJSON(false, json_be_returned)

  def HelloSecuredNotPass(json, entityId, returnJSON):
    print('Auth failed.')

  ss.sdefine('HelloSecured', HelloSecuredPass, HelloSecuredNotPass)

```
In order to well defined your protocol. It's suggest to defined your protocol in manifest.json file. (optional)

in your manifest.json:
```JSON
"servicefunctions": {
    "Hello": {
      "displayname": "Hello",
      "description": "Hello description.",
      "secure": false,
      "protocol": {
        "call": {
          "d": "data from client"
        },
        "return": {
          "d": "data from service"
        }
      }
    },

    "HelloSecured": {
      "displayname": "HelloSecured",
      "description": "HelloSecured description.",
      "secure": true,
      "protocol": {
        "call": {
          "d": "data from client"
        },
        "return": {
          "d": "data from service"
        }
      }
    }
  },
```
### Authorization API
In case that the service that user acesses might be sensitive. You can call many kinds of api to protect your data.

For example:
1. javascript
``` javascript
// Token can vertify that the userA is that true userA.
NoService.Authorization.Authby.Token(entityId, (err, pass)=>{
  if(pass) {
      // what ever you want.
  }
  else {
      // failed.
  }
});
```

2. python3
``` python
# Token can vertify that the userA is that true userA.
def handleAuth(err, passed):
  if passed:
    pass # what ever you want.
  else:
    pass # failed.
NoService.Authorization.Authby.Token(entityId, handleAuth)
```

### Model API
In case that the service that user acesses might be sensitive. You can call many kinds of api to protect your data.

For example:
1. javascript
``` javascript
//
NoService.Database.Model.define('IndexedListTest', {
      model_type: "IndexedList",
      do_timestamp: true,
      structure: {
        property1: 'TEXT',
        property2: 'INTEGER'
      }
    }, (err, model)=>{

    if(err) {
        log(err)
      }
      else {
        log('IndexedList Model Append.');
        model.appendRows([
          {
            property1: 'A',
            property2: 0
          },
          {
            property1: 'B',
            property2: 1
          },
          {
            property1: 'C',
            property2: 2
          },
          {
            property1: 'D',
            property2: 3
          }
        ], (err)=> {
            // whatever
        });
    }
});
```
2. python
``` python
def ModelDefineCallback(err, model):
    if err:
        log(err)
    else:
        log('IndexedList Model Append.');
        def appendRowsCallback(err):
          # whatever
        model.appendRows([{'property1': 'A','property2': 0},{'property1': 'B','property2': 1},{'property1': 'C','property2': 2},{'property1': 'D','property2': 3}], appendRowsCallback);
NoService.Database.Model.define('IndexedListTest', {'model_type': "IndexedList",'do_timestamp': True,'structure': {'property1': 'TEXT','property2': 'INTEGER'}}, ModelDefineCallback);
```

## APIs

### Safecallback
  NoService.SafeCallback(callback)

### ActivitySocket
  NoService.Service.ActivitySocket.createSocket(method, targetip, targetport, service, owner, callback)\
  NoService.Service.ActivitySocket.createDefaultDeamonSocket(service, owner, callback)\
  NoService.Service.ActivitySocket.createDeamonSocket(method, targetip, targetport, service, owner, callback)\
  NoService.Service.ActivitySocket.createAdminDeamonSocket(method, targetip, targetport, service, callback)
  NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket(service, callback)

  ### Service
  NoService.Service.Entity.getfliteredEntitiesMetaData: (query, callback)\
  NoService.Service.Entity.getfliteredEntitiesList: (query, callback)\
  NoService.Service.Entity.getEntityValue(entityId, key, callback)\
  NoService.Service.Entity.getEntityOwner(entityId, callback)\
  NoService.Service.Entity.getEntityOwnerId(entityId, callback)\
  NoService.Service.Entity.getEntitiesMetaData(callback)\
  NoService.Service.Entity.getEntityMetaData(entityId, callback)\
  NoService.Service.Entity.getCount(callback)\
  NoService.Service.Entity.getEntities(callback)\
  NoService.Service.Entity.getEntitiesId(callback)\
  NoService.Service.Entity.getEntityConnProfile(entityId, callback)\
  NoService.Service.Entity.on(type, callback)\
  NoService.Service.Entity.addEntityToGroups(entityId, grouplist, callback)\
  NoService.Service.Entity.deleteEntityFromGroups(entityId, grouplist, callback)\
  NoService.Service.Entity.clearAllGroupsOfEntity(entityId, callback)\
  NoService.Service.Entity.isEntityIncludingGroups(entityId, grouplist, callback)\
  NoService.Service.Entity.isEntityInGroup(entityId, group, callback)\
  NoService.Service.Entity.getGroupsofEntity(entityId, callback)\
  NoService.Service.getList(callback)\
  NoService.Service.getServiceManifest(service_name, callback)\
  NoService.Service.getServiceFunctionList(service_name, callback)\
  NoService.Service.getServiceFunctionDict(service_name, callback)\
  NoService.Service.launch(service_name, callback)\
  NoService.Service.initialize(service_name, callback)\
  NoService.Service.relaunch(service_name, callback)\
  NoService.Service.close(service_name, callback)\
  NoService.Service.isServiceLaunched(service_name, callback)\
  NoService.Service.isServiceInitialized(service_name, callback)\
  NoService.Service.getCBOCount(callback)\
  NoService.Service.getWorkerMemoryUsage(callback)\

  ### Authorization
  NoService.Authorization.emitSignin: (entityId)\
  NoService.Authorization.Authby.Token: (entityId, callback)\
  NoService.Authorization.Authby.Password(entityId, callback)\
  NoService.Authorization.Authby.isSuperUser(entityId, callback)\
  NoService.Authorization.Authby.Domain(entityId, callback)\
  NoService.Authorization.Authby.DaemonAuthKey(entityId, callback)\
  NoService.Authorization.importTrustDomains(domains)

  ### Daemon
  NoService.Daemon.getSettings(callback)\
  NoService.Daemon.close()\
  NoService.Daemon.relaunch()\
  NoService.Daemon.getConstants(callback)

  ### Authenticity

  NoService.Authenticity.createUser(username, displayname, password, privilege, detail, firstname, lastname, callback)\
  NoService.Authenticity.deleteUserByUsername(username, callback)\
  NoService.Authenticity.updatePasswordByUsername(username, newpassword, callback)\
  NoService.Authenticity.updateTokenByUsername(username, callback)\
  NoService.Authenticity.updatePrivilegeByUsername(username, privilege, callback)\
  NoService.Authenticity.updateNameByUsername(username, privilege, callback)\
  NoService.Authenticity.getUserMetaByUsername(username, callback)\
  NoService.Authenticity.getUserIdByUsername(username, callback)\
  NoService.Authenticity.getUserExistenceByUsername(username, callback)\
  NoService.Authenticity.getUserTokenByUsername(username, callback)\
  NoService.Authenticity.getUserPrivilegeByUsername(username, callback)\
  NoService.Authenticity.searchUsersByUsernameNRows(username, N, callback)\

  NoService.Authenticity.deleteUserByUserId(userid, callback)\
  NoService.Authenticity.updatePasswordByUserId(userid, newpassword, callback)\
  NoService.Authenticity.updateTokenByUserId(userid, callback)\
  NoService.Authenticity.updatePrivilegeByUserId(userid, privilege, callback)\
  NoService.Authenticity.updateNameByUserId(userid, privilege, callback)\
  NoService.Authenticity.getUserMetaByUserId(userid, callback)\
  NoService.Authenticity.getUsernameByUserId(userid, callback)\
  NoService.Authenticity.getUserExistenceByUserId(userid, callback)\
  NoService.Authenticity.getUserTokenByUserId(userid, callback)\
  NoService.Authenticity.getUserPrivilegeByUserId(userid, callback)\
  NoService.Authenticity.getUserIdByUserId(userid, callback)

  ### Connection
  NoService.Connection.addServer(conn_method, ip, port)

  ### Crypto
  NoService.Crypto.encryptString(algo, key, toEncrypt, callback)\
  NoService.Crypto.decryptString(algo, key, toDecrypt, callback)

  ### Database
  NoService.Database.Database.query(query, callback);

  ### Database Model
  NoService.Database.Model.define(model_name, model_structure, callback)\
  NoService.Database.Model.get(model_name, callback)\
  NoService.Database.Model.exist(model_name, callback)\
  NoService.Database.Model.remove(model_name, callback)\
  NoService.Database.RAWModel.define(model_name, model_structure, callback)\
  NoService.Database.RAWModel.get(model_name, callback)\
  NoService.Database.RAWModel.exist(model_name, callback)\
  NoService.Database.RAWModel.remove(model_name, callback)\
  NoService.Database.RAWModel.getModelsDict(model_name, callback)
  ```
  model_structure
  ObjectModel example:
  {
     model_type: "Object",
     do_timestamp: true,
     model_key: 'username',
     structure: {
       username: 'text',
       height: 'int'
     }
  }


  PairModel example:
  {
     model_type: "Pair",
     do_timestamp: false,
     model_key: ['u1', 'u2'],
     structure: {
       u1: 'text',
       u2: 'text',
       content: 'text'
     }
  }

  IndexedListModel example:
  {
     model_type: "IndexedList",
     do_timestamp: false,
     structure: {
       u1: 'text',
       u2: 'text',
       content: 'text'
     }
  }

  GroupIndexedList example:
  {
     model_type: "GroupIndexedList",
     do_timestamp: false,
     structure: {
       u1: 'text',
       u2: 'text',
       content: 'text'
     }
  }
  ```
  #### Model(Pair)
  model.create(properties_dict, callback)\
  model.searchAll(keyword, callback)\
  model.searchColumns(column_list, keyword,)\
  model.searchAllNRows(keyword, N, callback)\
  model.searchColumnsNRows(column_list, keyword, N, callback)\
  model.getWhere(where, query_values, callback)\
  model.getAll(callback)\
  model.getbyPair(pair, callback)\
  model.getbyBoth(both, callback)\
  model.getbyFirst(first, callback)\
  model.getbySecond(second, callback)\
  model.replace(properties_dict, callback)\
  model.update(properties_dict, callback)\
  model.removebyPair(pair, callback)\
  model.removebyBoth(both, callback)\
  model.removebyFirst(first, callback)\
  model.removebySecond(second, callback)\
  model.addProperties(properties_dict, callback)\
  model.existProperty(property_name, callback)\
  model.removeProperty(properties_list, callback)

  #### Model(Object)
  model.get(where, callback)\
  model.getAll(callback)\
  model.getWhere(key_value, callback)\
  model.searchAll(keyword, callback)\
  model.searchColumns(column_list, keyword, callback)\
  model.searchAllNRows(keyword, N, callback)\
  model.searchColumnsNRows(column_list, keyword, N, callback)\
  model.create(properties_dict, callback)\
  model.replace(properties_dict, callback)\
  model.remove(key, callback)\
  model.update(properties_dict, callback)\
  model.addProperties(properties_dict, callback)\
  model.existProperty(property_name, callback)\
  model.removeProperties(properties_list, callback)

  #### Model(IndexedList)
  model.searchAll(keyword, callback)\
  model.searchColumns(column_list, keyword, callback)\
  model.searchAllNRows(keyword, N, callback)\
  model.searchColumnsNRows(column_list, keyword, N, callback)\
  model.get(index_value, callback)\
  model.getAll(callback)\
  model.getWhere(where, callback)\
  model.replaceRows(rows, callback)\
  model.updateRows(rows, callback)\
  model.deleteRows(begin, end, callback)\
  model.appendRows(rows, callback)\
  model.getLatestNRows(n, callback)\
  model.getRowsFromTo(begin, end, callback)\
  model.getAllRows(callback)\
  model.getLatestIndex(callback)\
  model.addFields(fields_dict, callback)\
  model.existField(fields_dict, callback)\
  model.removeFields(fields_dict, callback)

  #### Model(GroupIndexedList)
  model.searchAll(group_name, keyword, callback)\
  model.searchColumns(group_name, column_list, keyword, callback)\
  model.searchAllNRows(group_name, keyword, N, callback)\
  model.searchColumnsNRows(group_name, column_list, keyword, N, callback)\
  model.existGroup(group_name, callback)\
  model.get(group_name, index_value, callback)\
  model.getWhere(where, callback)\
  model.replaceRows(group_name, rows, callback)\
  model.updateRows(group_name, rows, callback)\
  model.deleteRows(group_name, begin, end, callback)\
  model.appendRows(group_name, rows, callback)\
  model.getLatestNRows(group_name, n, callback)\
  model.getRowsFromTo(group_name, begin, end, callback)\
  model.getAllRows(group_name, callback)\
  model.getLatestIndex(group_name, callback)\
  model.addFields(fields_dict, callback)\
  model.existField(fields_dict, callback)\
  model.removeFields(fields_dict, callback)


  ### ServiceSocket
  NoService.Serivce.ServiceSocket.def(name, callback)\
  NoService.Serivce.ServiceSocket.defBlob(name, callback)\
  NoService.Serivce.ServiceSocket.sdef(name, callback, failopearation)\
  NoService.Serivce.ServiceSocket.broadcastData(data)\
  NoService.Serivce.ServiceSocket.sendDataToUsername(username, data)\
  NoService.Serivce.ServiceSocket.emit(entityId, event, data)\
  NoService.Serivce.ServiceSocket.semit(entityId, event, data)\
  NoService.Serivce.ServiceSocket.emitBlob(username, event, data)\
  NoService.Serivce.ServiceSocket.emitToUsername(username, event, data)\
  NoService.Serivce.ServiceSocket.emitToGroups(groups, event, data)\
  NoService.Serivce.ServiceSocket.emitToIncludingGroups(groups, event, data)\
  NoService.Serivce.ServiceSocket.emitAll(event, data)\
  NoService.Serivce.ServiceSocket.sendDataToUsername(username, data)\
  NoService.Serivce.ServiceSocket.sendDataToGroups(groups, data)\
  NoService.Serivce.ServiceSocket.sendDataToIncludingGroups(groups, data)\
  NoService.Serivce.ServiceSocket.sendDataAll(data)\
  NoService.Serivce.ServiceSocket.on(type, callback)\
  NoService.Serivce.ServiceSocket.close(entityId)

  ### Me
  Me.Settings\
  Me.Manifest\
  Me.FilesPath

  ### ActivitySocket Object
  ActivitySocket.call(name, Json, callback)\
  ActivitySocket.callBlob(name, blob, meta, callback)\
  ActivitySocket.sendData(data)\
  ActivitySocket.returnEntityId()\
  ActivitySocket.on(type, callback)\
  ActivitySocket.close()\
  ActivitySocket.onBlobEvent(event, callback)\
  ActivitySocket.onEvent(event, callback)

## Plugin APIs(Note)
1.  note that NoService do not resolve plugins' dependencies.
2.  plugins are injected and be called before native module started.
3.  plugins are loaded without order
4.  plugins are supposed to be a feature that test the experimental abilities to be integrated into NoService core. You should implement your functions in your service not in the plugins!

### here is an example of a plugin
``` javascript
// NoService/plugins/dummy.js
// Description:
// "dummy.js" create an example of plugin.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

module.exports = function() {
  this.name = 'Dummy Plugin';
  this.version = '0.0.0';
  this.noservice = "0.5.6";
  this.allow_older_noservice = false;

  this.plugin = (noservice_coregateway, noservice_isInitialized, deploy_settings, noservice_constants, verbose, next)=> {
    verbose('Dummy', 'Dummy plugin being executed. NoService version "'+noservice_constants.version+'"');
    // add a protocol
    noservice_coregateway.Router.addProtocol(require('./protocol'));
    // replace native module
    noservice_coregateway.Database = new (require('./my/own/db'))();
    next(false);
  };
}

```
add your own protocols
``` javascript
// NoService/NoService/rumtime/plugins/cluster/protocol.js
// Description:
// "protocol.js" nooxy service protocol implementation of "Cluster"
// Copyright 2018-2019 NOOXY. All Rights Reserved.

'use strict';

module.exports = function Protocol(coregateway, emitRequest) {

  this.Protocol = "CR";

  this.Positions = {
    rq: "Server",
    rs: "Client"
  };


  this.RequestHandler = (connprofile, data, data_sender) => {

  };

  this.ResponseHandler = (connprofile, data) => {
  };
}

```

## NoService Protocol (outdated for NSP 0.4.1 and below)
### Basic
1. NSP(NoService Protocol) is based on text, based on Json data structure.
2. It’s communication style is like http. Existing a method, a request and a response.
3. NSP is designed to be handle by core, not recommended to let service have direct access.
4. Once a NSP package was sent. It contains 3 main parts.
> 	1. “method” for identify the type of operation
> 	2. “session” for identify the stage of request or response.
> 	3. “data” for the actual data that be transferred.
5. There are following standard methods for NSP.
> 	1. SP(Sercure protocol) for updrading to encrypted communication.
> 	2. GT(Get token) for getting token.
> 	3. AU(Authorization) for authorize user identity.
> 	4. CS(Call Service) client call daemon.
> 	5. CA(Call Activity) daemon call client.
6. In order to focus on data that be transferred We will abridge some terms.
> 	1. “method” refer to “m”
> 	2. “session” refer to “s”
> 	3. “data” refer to “d”
> 	
### Detail
#### SP(Sercure protocol)
```
"Secure protocol"
RSA_Public = text
RequestHandler(daemon):
{
       m: “SP”,
       s: “rq”,
       d: {p: RSA_Public}
}

RSA_Public_encrypted = text
ResponseHandler(client):
{
       m: “SP”,
       s: “rs”,
       d: RSA_Public_encrypted
}

decrypted "RSA_Public_encrypted" should be like:
client_random_num = int, aes_key = text(base64, generated by hashing
pub_key+client_random_num with sha256 algo. And substring 32.)
{
        r: client_random_num,
        a: aes_key
}

after upgrading protocol, data will be transfer as:
aes_iv(base64)+data_encrypted(base64)
```
#### GT(Get token)
#### AU(Authorization)
#### CS(Call Service)
#### CA(Call Activity)

## Preinstalled Service (NoServices Bundle)
### list
1. NoShell
2. NoServiceManager
3. NoUser
4. NoShellc
5. NoActivity
6. NoTalk
7. NoHttp
