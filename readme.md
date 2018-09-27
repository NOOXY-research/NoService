![alt text](/imgs/NSFdescription.png)

This project is still in aphla!

# NOOXY Service Framework

## Why we build NOOXY Service framework?

### security
NSF has built-in sercure protocol bulit by AES and RSA to sercure your data. It also has authorization API, provides you ability to authorize user to protect your data. Besides, you can block IPs and domains. The operations on daemon will not be executed until the client has the right response of authorization that emited from daemon side.
### lightweight
NSF is superlightweight both in client and daemon. But it has lots of feature. And it's features can be expanded by services.
### communication between services
The design of NSF sockets that we called service socket and activity socket. With the characteristic of those sockets, services can communicate each others.
### realtime
NSF is design for realtime purpose.
### services
NSF is built for service. From it's protocol to it's structure. It also have user authorization system natively integrated with protocol and software.
### for general conditions
NSF is design for any kind of condition such as game, IoT, text contain. However, we have only implemented game([reversi](https://nooxy.org/noversi)), notification([NOOXY](https://nooxy.org)), shell([NoShell](https://www.nooxy.org/static/nsf/shell.html)). Nevertheless the development of NSF is still in progress. We can fix bugs and add features to comfirm other abilities.
### cross platform
Now, NSF can run on browser(javascript) and desktop(javascript). It also supports TCP/IP, websocket connections. Other languages is still on the way.

## Target version
* daemon: alpha 0.0.0
* protocol: NSP alpha
## Document Overview
1. Orientation
2. Architecture
3. serverside module
4. clientside module
5. Service, ServiceSocket and ServiceAPI
6. Activities and ActivitySocket(Client socket) 
7. NSP(NOOXY Service Protocol)
8. Preinstalled Service
9. Setting file

## NSF's Orientation
1. Entities system(Services, Activities), each entities have it’s profile(with contain that showing attached user and user’s domain) for deciding should it be trusted. 
2. User Orientation, User(in a daemon or a client) can create entities(activities, services). Entities and Users are both owned(registered) by NSd(NOOXY Service daemon) of particular domain.
3. Server(we call it “Services”) , client(we call it “Activities”) structure.
4. Authorization API for Services. Services have responsibilities to protect their contains itself
5. Module idea, “Everything based on service” concept.
6. Lightweight. “Everything based on service” concept.
7. Decentralized. Make it possible to parallelize task in future.
8. NSP(NOOXY Service Protocol) is request response style protocol.

## Architecture
![](https://i.imgur.com/Vi7RhkX.png)


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

### Service
Objective: Loading and managing services, and routing the messages on internet. Also provide service socket, activity socket.

### Crypto
Objective: Providing AES, RSA, Hasing abilities for NSPS(NOOXY Service Protocol Secured).


### Entity(as part of service)
Objective: Create identity system for Service , Activity or future stuff. Entities are generated and being realtime. So there is no need for databases.

## Clientside module

### Core
Objective: setting up environment for NOOXY service client.

### Router
Objective: A parser and a router. To phrase Json from connection and do local operations. And to switch and trigger between different operations of remotes.

### Service
Objective: Loading and managing services, and routing the messages on internet. Also provide service socket, activity socket.

### Authorization Handler
Objective: To handle authoritative actions. Confirming the sensitive data or operation is secured.

### Crypto
Objective: Providing AES, RSA, Hasing abilities for NSPS(NOOXY Service Protocol Secured).

## Service and Sockets
### Explaination of how service work
Once the core of the NSF is started.
The core of NSF will navigate the directories of “services” directory which is under the root of NSF files. And in that directory it will exist a file called “entry.js”. The figure below can help you understand the concept.
```
------|--(NSd(NOOXY Service deamon))-- ...
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
// NSF/services/youservice/entry.js
// Description:
// "youservice/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.

let files_path;
let settings;
// Your service entry point
function start(api) {
    // Get the service socket of your service
  let ss = api.Service.ServiceSocket;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not API provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by api.SafeCallback.
  // E.g. setTimeout(api.SafeCallback(callback), timeout)
  let safec = api.SafeCallback;
  // Please save and manipulate your files in this directory
  files_path = api.Me.FilesPath;
  // Your settings in manifest file.
  settings = api.Me.Settings;
}

// If the daemon stop, your service recieve close signal here.
function close() {
  // Saving state of you service.
  // Please save and manipulate your files in this directory
}

// Export your work for system here.
module.exports = {
  start: start,
  close: close
}
```
Beware that code in Service is ran as a superuser

### Service socket and Activity socket

#### Sending data
Here is an example of sending data from service to client, client to service can be done by same way.

In service
``` javascript
// Your service's entry.js
function start(api) {
  // Get the service socket of your service
  let ss = api.Service.ServiceSocket;
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
          console.log(json.d); // Print "Hello! NOOXY Service Framework!""
        }
      });
      
      as.call('HelloSecured', {d:'I am client.'}, (err, json)=>{
        if(err) {
          console.log(err);
        }
        else {
          console.log(json.d); 
          // Print "Hello! NOOXY Service Framework! Secured." If is admin.
        }
      });
  });
  
```

JSON function defined in service
``` javascript
// Your service's entry.js
function start(api) {
  // Normally define a JSONfunction
  ss.def('Hello', (json, entityID, returnJSON)=>{
    console.log(json.d); // Print "I am client.".
    let json_be_returned = {
      d: 'Hello! NOOXY Service Framework!'
    }
    
    returnJSON(false, json_be_returned);
  });

  // Safe define a JSONfunction. User should be admin.
  ss.sdef('HelloSecured', (json, entityID, returnJSON)=>{
    console.log(json.d); // Print "I am client.".
    let json_be_returned = {
      d: 'Hello! NOOXY Service Framework! Secured.'
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
api.Authorization.Authby.Token(entityID, (err, pass)=>{
  if(pass) {
      // what ever you want.
  }
  else {
      // failed.
  }
}
```

## APIs
  api.Utils.returnPassword(prompt)\
  api.Utils.returnJSONfromFile(filename)\
  api.Utils.printLOGO(version, copyright)\
  api.Utils.tagLog(tag, logstring)\
  api.Utils.generateUniqueID()\
  api.Utils.hashString(string)\
  api.Utils.removeHTML(string)\
  api.Utils.generateGUID()\
  api.Utils.searchObject(object, value)\
  api.Utils.addDays(date, days)\
  api.Utils.DatetoSQL(sqlDate)\
  api.Utils.SQLtoDate(JsDate)\
  api.SafeCallback(callback)\
  api.Service.ActivitySocket.createSocket(method, targetip, targetport, service, owner, callback)\
  api.Service.ActivitySocket.createDefaultDeamonSocket(service, owner, callback)\
  api.Service.ActivitySocket.createDeamonSocket(method, targetip, targetport, service, owner, callback)\
  api.Service.ActivitySocket.createAdminDeamonSocket(method, targetip, targetport, service, callback)
  api.Service.ActivitySocket.createDefaultAdminDeamonSocket(service, callback)\
  api.Service.Entity.getfliteredEntitiesMetaData: (key, value, callback)\
  api.Service.Entity.getfliteredEntitiesList: (query, callback)\
  api.Service.Entity.returnEntityValue(entityID, key)\
  api.Service.Entity.returnEntityOwner(entityID, key)\
  api.Service.Entity.getEntitiesMetaData(callback)\
  api.Service.Entity.returnEntityMetaData(entityID)\
  api.Service.Entity.returnCount()\
  api.Service.Entity.getEntities(callback)\
  api.Service.Entity.returnEntitiesID()\
  api.Service.Entity.getEntityConnProfile(entityId, callback)\
  api.Service.Entity.on(type, callback)\
  api.Service.returnList()\
  api.Service.returnServiceManifest(service_name)\
  api.Service.returnJSONfuncList(service_name)\
  api.ServicereturnJSONfuncDict(service_name)\
  api.Authorization.Authby.Token: (entityID, callback)\
  api.Authorization.Authby.Password(entityID, callback)\
  api.Authorization.Authby.isSuperUser(entityID, callback)\
  api.Authorization.Authby.Domain(entityID, callback)\
  api.Authorization.Authby.DaemonAuthKey(entityID, callback)\
  api.Authorization.importTrustDomains(domains)\
  api.Daemon.Settings\
  api.Daemon.close()\
  api.Daemon.Variables\
  api.Authenticity.createUser(username, displayname, password, privilege, detail, firstname, lastname, callback)\
  api.Authenticity.deleteUser(username, callback)\
  api.Authenticity.updatePassword(username, newpassword, callback)\
  api.Authenticity.updateToken(username, callback)\
  api.Authenticity.updatePrivilege(username, privilege, callback)\
  api.Authenticity.updateName(username, privilege, callback)\
  api.Authenticity.getUserMeta(username, callback)\
  api.Authenticity.getUserID(username, callback)\
  api.Connection.getServers(callback)\
  api.Connection.getClients(callback)\
  api.Connection.addServer(conn_method, ip, port)\
  api.Crypto.encryptString(algo, key, toEncrypt, callback)\
  api.Crypto.decryptString(algo, key, toDecrypt, callback)\
  api.Me.Settings\
  api.Me.Manifest\
  api.Me.FilesPath
  
  ActivitySocket.call(name, Json, callback)\
  ActivitySocket.sendData(data)\
  ActivitySocket.returnEntityID()\
  ActivitySocket.onData(data)\
  ActivitySocket.onClose()\
  ActivitySocket.close()
  
  ServiceSocket.def(name, callback)\
  ServiceSocket.sdef(name, callback, failopearation)\
  ServiceSocket.sendData(entityID, data)\
  ServiceSocket.broadcastData(data)\
  ServiceSocket.onData(entityID, data)\
  ServiceSocket.onClose(entityID, callback)\
  ServiceSocket.onConnect(entityID, callback)
  
## NOOXY Service Protocol
### Basic
1. NSP(NOOXY Service Protocol) is based on text, based on Json data structure.
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

## Preinstalled Service
### list
1. NoShell
2. NoServiceManager
3. NoUser
4. NoShellc
