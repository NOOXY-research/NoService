# NoService
![](https://raw.githubusercontent.com/NOOXY-inc/Art-Collection/master/NoService/NoService.png)
The project is still in alpha!
## Installation and Deploy
``` sh
npm install noservice -save
npx create-noservice .
```
## What is NoService?
NoService is a high level framework for services that provide you nodejs environment and eliminate service designer to care about low level part of your project.Such as authorization, user system, database, protocol and so on. It also run multiple services intergrated and we also provide a manager and shell to manipulate all of them.

## Why we build NoService? And why you should give it a try?

### All-in-one but async multithreaded
NoService is supposed to be a all-in-one framework. But each service is managed by a worker which is seperated thread from core. And since multithread, a service's restart doesn't require restarting the whole framework and mantain connection while relauching. Which is a huge benefit in deploying on a production environment.
### Serperating backend applications from physical differences
NoService provide a layer that handle backend designer for connection, database and authenticity. Thus other designer project can basically install on your NoService.
### security
NoService has built-in sercure protocol bulit by SHA-256, AES and RSA to sercure your data. It also has authorization API, provides you ability to authorize user to protect your data. Besides, you can block IPs and domains. The operations on daemon will not be executed until the client has the right response of authorization that emited from daemon side.
### lightweight + microcore
NoService is superlightweight both in client and daemon. But it has lots of feature. And it's features can be expanded by services.
### communication between services
The design of NoService sockets that we called service socket and activity socket. With the characteristic of those sockets, services can communicate each others. By this way each service don't need to sync data to promise the data is the newest.
### realtime
NoService is design for realtime purpose. And it's of course super responsive.
### deploying services
NoService is built for service. From it's protocol to it's local structure. It also have user authorization system natively integrated with protocol and software.
### for general conditions
NoService is design for any kind of condition such as game, IoT, text contain. However, we have only implemented game([reversi](https://nooxy.org/noversi)), notification([NOOXY](https://nooxy.org)), shell([NoShell](https://www.nooxy.org/static/nsf/shell.html)). Nevertheless the development of NoService is still in progress. We can fix bugs and add features to comfirm other abilities.
### cross platform
Now, NoService can run on browser(javascript) and desktop(javascript). It also supports TCP/IP, websocket connections. Other languages is still on the way.

### Socket-based+API control
Socket base+API pattern makes the concept easy to understand. NoService wraps the native TCP/IP, websocket or even http polling mode in the future as transportation layer. Make you no need to consider about intergrating features with different connections. And with the advantage of NoService, in theory different activities(clients) can share same the socket in the same time. If the NoService Client is implemented well.

### Bundled Services
NoService provide bundled services such as NoShell which give you access of NoService. NoUser for user system. And so on.

### Intergrated ORM

## Target version
* daemon: alpha 0.4.8
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
NOOXY Http Service provide you file upload, oauth and contain control intergrated with NoService. If you don't use NoContent service there is no need to install additional packages.

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
Objective: Providing AES, RSA, Hasing abilities for NSPS(NoService Protocol Secured).

### Service
Objective: Loading and managing services, and routing the messages on internet. Also provide service socket, activity socket.

### Workerd+Worker+ServiceAPI
Objective: A worker daemon will import API and create communication between a worker client which make service multithreaded.


### Entity(as part of service)
Objective: Create identity system for Service , Activity or future stuff. Entities are generated and being realtime. So there is no need for databases.

## Clientside module(prototype)

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
### Explaination of how service work
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

  // If the daemon stop, your service recieve close signal here.
  this.close = ()=> {
    // Saving state of you service.
    // Please save and manipulate your files in this directory
  }
}
// Export your work for system here.
module.exports = Service;
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
``` javascript
// Your service's entry.js
this.start = ()=> {
  // Get the service socket of your service
  let ss = NoService.Service.ServiceSocket;
  ss.onConnect = (entityID, callback) => {
    // Send msg on connected entity.
    ss.sendData(entityID, 'Hello world!');
    callback(false);
  }
}
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

#### JSON function(recommended)
JSON function is a framework for self-defined protocol that with "json datastructure" and "request, response" style. It is included by NOOXY service framework. And with JSON function NOOXY shell service can natively support the command that call your service.
Note that the function name should be short as possible. Since it will be sent in NSP(NOOXY service protocol).

In client(browser)
JSON function called by client
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

JSON function defined in service
``` javascript
// Your service's entry.js
this.start = ()=> {
  // Normally define a JSONfunction
  ss.def('Hello', (json, entityID, returnJSON)=>{
    console.log(json.d); // Print "I am client.".
    let json_be_returned = {
      d: 'Hello! NoService Framework!'
    }

    returnJSON(false, json_be_returned);
  });

  // Safe define a JSONfunction. User should be admin.
  ss.sdef('HelloSecured', (json, entityID, returnJSON)=>{
    console.log(json.d); // Print "I am client.".
    let json_be_returned = {
      d: 'Hello! NoService Framework! Secured.'
    }
    // First parameter for error, next is JSON to be returned.
    returnJSON(false, json_be_returned);
  },
  // In case fail.
  ()=>{
    console.log('Auth Failed.');
  });

}
```
In order to well defined your protocol. It's sugesst to defined your protocol in manifest.json file. (optional)

in your manifest.json:
```JSON
"JSONfunciton_prototypes": {
    "Hello": {
      "displayname": "Hello",
      "description": "Hello description.",
      "secure": false,
      "protocol": {
        "JSON_call": {
          "d": "data from client"
        },
        "JSON_return": {
          "d": "data from service"
        }
      }
    },

    "HelloSecured": {
      "displayname": "HelloSecured",
      "description": "HelloSecured description.",
      "secure": true,
      "protocol": {
        "JSON_call": {
          "d": "data from client"
        },
        "JSON_return": {
          "d": "data from service"
        }
      }
    }
  },
```
### Authorization API
In case that the service that user acesses might be sensitive. You can call many kinds of api to protect your data.

For example:
``` javascript
// Token can vertify that the userA is that true userA.
NoService.Authorization.Authby.Token(entityID, (err, pass)=>{
  if(pass) {
      // what ever you want.
  }
  else {
      // failed.
  }
}
```
### Model API
In case that the service that user acesses might be sensitive. You can call many kinds of api to protect your data.

For example:
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
  NoService.Service.Entity.getfliteredEntitiesMetaData: (key, value, callback)\
  NoService.Service.Entity.getfliteredEntitiesList: (query, callback)\
  NoService.Service.Entity.getEntityValue(entityID, key, callback)\
  NoService.Service.Entity.getEntityOwner(entityID, key, callback)\
  NoService.Service.Entity.getEntitiesMetaData(callback)\
  NoService.Service.Entity.getEntityMetaData(entityID, callback)\
  NoService.Service.Entity.getCount(callback)\
  NoService.Service.Entity.getEntities(callback)\
  NoService.Service.Entity.getEntitiesID(callback)\
  NoService.Service.Entity.getEntityConnProfile(entityId, callback)\
  NoService.Service.Entity.on(type, callback)\
  NoService.Service.Entity.addEntityToGroups(entityID, grouplist, callback)\
  NoService.Service.Entity.deleteEntityFromGroups(entityID, grouplist, callback)\
  NoService.Service.Entity.clearAllGroupsOfEntity(entityID, callback)\
  NoService.Service.Entity.isEntityIncludingGroups(entityID, grouplist, callback)\
  NoService.Service.Entity.isEntityInGroup(entityID, group, callback)\
  NoService.Service.Entity.getGroupsofEntity(entityID, callback)\
  NoService.Service.getList()\
  NoService.Service.getServiceManifest(service_name)\
  NoService.Service.getJSONfuncList(service_name)\
  NoService.Service.getJSONfuncDict(service_name)\
  NoService.Service.relaunch(service_name)\
  NoService.getWorkerMemoryUsage(callback)

  ### Authorization
  NoService.Authorization.emitSignin: (entityID)\
  NoService.Authorization.Authby.Token: (entityID, callback)\
  NoService.Authorization.Authby.Password(entityID, callback)\
  NoService.Authorization.Authby.isSuperUser(entityID, callback)\
  NoService.Authorization.Authby.Domain(entityID, callback)\
  NoService.Authorization.Authby.DaemonAuthKey(entityID, callback)\
  NoService.Authorization.importTrustDomains(domains)

  ### Daemon
  NoService.Daemon.getSettings(callback)\
  NoService.Daemon.close()\
  NoService.Daemon.relaunch()\
  NoService.Daemon.getVariables(callback)

  ### Authenticity
  NoService.Authenticity.createUser(username, displayname, password, privilege, detail, firstname, lastname, callback)\
  NoService.Authenticity.deleteUser(username, callback)\
  NoService.Authenticity.updatePassword(username, newpassword, callback)\
  NoService.Authenticity.updateToken(username, callback)\
  NoService.Authenticity.updatePrivilege(username, privilege, callback)\
  NoService.Authenticity.updateName(username, privilege, callback)\
  NoService.Authenticity.getUserMeta(username, callback)\
  NoService.Authenticity.getUserID(username, callback)

  ### Connection
  NoService.Connection.addServer(conn_method, ip, port)

  ### Crypto
  NoService.Crypto.encryptString(algo, key, toEncrypt, callback)\
  NoService.Crypto.decryptString(algo, key, toDecrypt, callback)

  ### Database
  NoService.Database.Databse.query(sql, values, callback);

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
  model.getWhere(key_value, callback)\
  model.create(properties_dict, callback)\
  model.replace(properties_dict, callback)\
  model.remove(key, callback)\
  model.update(properties_dict, callback)\
  model.addProperties(properties_dict, callback)\
  model.existProperty(property_name, callback)\
  model.removeProperties(properties_list, callback)




  #### Model(IndexedList)
  model.get(index_value, callback)\
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
  NoService.Serivce.ServiceSocket.sdef(name, callback, failopearation)\
  NoService.Serivce.ServiceSocket.sendData(entityID, data)\
  NoService.Serivce.ServiceSocket.broadcastData(data)\
  NoService.Serivce.ServiceSocket.sendDataToUsername(username, data)\
  NoService.Serivce.ServiceSocket.emit(entityID, event, data)\
  NoService.Serivce.ServiceSocket.semit(entityID, event, data)\
  NoService.Serivce.ServiceSocket.emitToUsername(username, event, data)\
  NoService.Serivce.ServiceSocket.emitToGroups(groups, event, data)\
  NoService.Serivce.ServiceSocket.emitToIncludingGroups(groups, event, data)\
  NoService.Serivce.ServiceSocket.broadcastEvent(event, data)\
  NoService.Serivce.ServiceSocket.sendDataToUsername(username, data)\
  NoService.Serivce.ServiceSocket.sendDataToGroups(groups, data)\
  NoService.Serivce.ServiceSocket.sendDataToIncludingGroups(groups, data)\
  NoService.Serivce.ServiceSocket.broadcastData(data)\
  NoService.Serivce.ServiceSocket.on(type, callback)\
  NoService.Serivce.ServiceSocket.close(entityId)

  ### Me
  Me.Settings\
  Me.Manifest\
  Me.FilesPath

  ### ActivitySocket Object
  ActivitySocket.call(name, Json, callback)\
  ActivitySocket.sendData(data)\
  ActivitySocket.returnEntityID()\
  ActivitySocket.on(type, callback)\
  ActivitySocket.close()\
  ActivitySocket.onEvent(event, callback);

## NoService Protocol
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
"Sercure protocol"
RSA_Public = text
Request(daemon):
{
       m: “SP”,
       s: “rq”,
       d: {p: RSA_Public}
}

RSA_Public_encrypted = text
Response(client):
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

after updraded protocol, data will be transfer as:
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
