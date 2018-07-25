![alt text](/imgs/NSFdescription.png)

This project is still in aphla!

# Overview
- Orientation
- Architecture
- APIs
- Protocol
- Figures

## Orientation
1. Entities system(Services, Activities), each entities have it’s profile(with contain that showing attached user and user’s domain) for deciding should it be trusted. 
2. User Orientation, User(in a daemon or a client) can create entities(activities, services). Entities and Users are both owned(registered) by NSd(NOOXY Service daemon) of particular domain.
3. Server(we call it “Services”) , client(we call it “Activities”) structure.
4. Authorization API for Services. Services have responsibilities to protect their contains itself
5. Module idea, “Everything based on service” concept.
6. Lightweight. “Everything based on service” concept.
7. Decentralized. Make it possible to parallelize task in future.
8. NSP(NOOXY Service Protocol) is request response style protocol.

## Architecture

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
  api.Service.ActivitySocket.createAdminDeamonSocket(method, targetip, targetport, service, callback)\
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
  api.Me.FilesPath\
  
  ActivitySocket.call(name, Json, callback)\
  ActivitySocket.sendData(data)\
  ActivitySocket.returnEntityID()\
  ActivitySocket.onData(data)\
  ActivitySocket.onClose()\
  ActivitySocket.close()\
  
  ServiceSocket.def(name, callback)\
  ServiceSocket.sdef(name, callback, failopearation)\
  ServiceSocket.sendData(entityID, data)\
  ServiceSocket.broadcastData(data)\
  ServiceSocket.onData(entityID, data)\
  ServiceSocket.onClose(entityID, callback)\
  ServiceSocket.onConnect(entityID, callback)\
  
## Protocol
### Basic
1. NSP is based on text, based on Json data structure.
2. It’s communication style is like http.Existing a method, a request and a response.
3. NSP method is designed to be handle by core, not recommend to let service have direct access.
4. Once a NSP package was sent. It contains 3 main parts. 
> 	1. “method” for identify the type of operation
> 	2. “session” for identify the stage of request or response.
> 	3. “data” for the actual data that be transferred.
5. There are following standard methods for NSP.
> 	1.
6. In order to focus on data that be transferred We will abridge some terms.
> 	1. “method” refer to “m”
> 	2. “session” refer to “s”
> 	3. “data” refer to “d”
> 	4. method terms will be explained next page

## Figures
![alt text](/imgs/login.png)
