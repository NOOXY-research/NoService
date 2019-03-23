// NoService/NoService/connection/virtualnet.js
// Description:
// "virtualnet.js" provide connection interface.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

function Virtualnet() {
  let _virt_servers = {};
  // define a socket pair
  function SocketPair(hip, cip) {
    let selfdestruct = ()=> {
      delete this;
    }
    // define an virtual socket
    function VirtualSocket(type, lIP, rIP, selfdestruct) {
      this.type = type;
      this.send = (d)=>{Utils.TagLog('*ERR*', 'VirtualSocket send not implemented. Of '+this.type+'. d=>'+d)};
      let _types = {
        open : ()=>{Utils.TagLog('*ERR*', 'VirtualSocket opopen not implemented. Of '+this.type)},
        message : ()=>{Utils.TagLog('*ERR*', 'VirtualSocket onmessage not implemented. Of '+this.type)},
        error : ()=>{Utils.TagLog('*ERR*', 'VirtualSocket onerror not implemented. Of '+this.type)},
        close : ()=>{Utils.TagLog('*ERR*', 'VirtualSocket onclose not implemented. Of '+this.type)}
      };

      this.returnLocalIP = () => {
        return lIP;
      }

      this.returnRemoteIP = () => {
        return rIP;
      }

      let _returntype = (type) => {
        return _types[type];
      }
      this.close = () => {Utils.TagLog('*ERR*', 'VirtualSocket onClose not implemented. Of '+this.type)};
      this.on = (type, callback)=> {_types[type] = callback;};
      this.emit = (type, d) =>{
        let _exe = _returntype(type);
        if(d) {
          _exe(d.msg);
        }
        else {
          _exe();
        }
      };

    };

    // cip clientip hostip
    let _vcs = new VirtualSocket('Client', cip, hip);
    let _vss = new VirtualSocket('Server', hip, cip);

    _vcs.send = (msg) => {
      let _d = {msg: msg}
      _vss.emit('message', _d);
    };

    _vss.send = (msg) => {
      let _d = {msg: msg}
      _vcs.emit('message', _d);
    };

    _vcs.close = (msg) => {
      _vss.emit('close');
      _vcs.emit('close');
      selfdestruct();
    };

    _vss.close = (msg) => {
      _vss.emit('close');
      _vcs.emit('close');
      selfdestruct();
    };

    this.ClientSocket = _vcs;
    this.ServerSocket = _vss;

  }

  function Server(virtip, virtport) {
    // add this server to list of virtual servers
    _virt_servers[virtip+':'+virtport] = this;
    let _virtip = virtip;
    let _virtport = virtport;
    let _vsclient = {};
    // let _virt_sockets = {};

    let type_callback = {
      'connection': null
    }

    this.ClientConnect = (clientvirtip, _virtport, vs, callback)=>{
      type_callback['connection'] (vs);
      _vsclient[clientvirtip] = vs;
    };


    this.ClientDisconnect = (clientvirtip)=>{
      delete _vsclient[clientvirtip];
    };

    this.on = (type, callback) => {type_callback[type] = callback};
  };

  // parameters local ip, port to remote ones.
  function Client(lvirtip, lvirtport) {
    let _virtip = lvirtip;
    let _virtport = lvirtport;
    // create sockets for both server and client

    this.connect = (rvirtip, rvirtport, callback) => {
      let sp = new SocketPair(rvirtip, lvirtip);
      let vss = sp.ServerSocket;
      let vcs = sp.ClientSocket;
      // return virtual client socket to callback
      callback(false, vcs);

      // trigger server and return server socket
      _virt_servers[rvirtip+':'+rvirtport].ClientConnect(_virtip, _virtport, vss);
    };

    this.getIP = () => {
      return _virtip;
    };

    this.close = () => {
      _virt_servers[rvirtip].ClientDisconnect(lvirtip);
    };

  };

  this.createServer = (virtip, virtport) => {
    let vs = new Server(virtip, virtport);
    _virt_servers[virtip] = vs;
    return vs;
  };

  this.createClient = (cip, cp, hip, hp) => {
    let vs = new Client(cip, cp, hip, hp);
    return vs;
  };
}

module.exports = Virtualnet;
