// NoService/NoService/router/NSPS.js
// Description:
// "NSPS.js" NOOXY service protocol secure.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';
const Buf = require('../buffer');

// NOOXY service protocol secure
function NSPS() {
  let _rsa_pub;
  let _rsa_priv;
  let _resumes = {};
  let _crypto_module;
  let _operation_timeout = 60; // seconds

  this.emitRequest = () => {console.log('[*ERR*] emitRequest not implemented');};

  // daemon side
  this.ResponseHandler = (connprofile, blob) => {
    let data = JSON.parse(blob.toString('utf8'));
    let resume = _resumes[connprofile.returnGUID()];
    if(resume) {
      try{
        _crypto_module.decryptString('RSA2048', _rsa_priv, data, (err, decrypted) => {
          if(err) {
            resume(err);
          }
          else {
            let json;
            try {
              json = JSON.parse(decrypted);
              let host_rsa_pub = _rsa_pub;
              let client_random_num = json.r;
              _crypto_module.generateAESCBC256KeyByHash(host_rsa_pub, client_random_num, (err, aes_key) => {
                if(aes_key === json.a) {
                  connprofile.setBundle('aes_256_cbc_key', aes_key);
                  connprofile.setBundle('NSPS', true);
                  connprofile.setBundle('NSPSremote', true);
                  resume(err, true);
                }
                else {
                  resume(err, false);
                }

              });
            }
            catch (err) {
              resume(err, false);
            }
          }
        });
      }
      catch(er) {
        console.log(er);
        connprofile.closeConnetion();
        resume(true, false);
      }
    };
  };

  // Nooxy service protocol secure request ClientSide
  // in client need to be in implementation module
  this.RequestHandler = (connprofile, blob, emitResponse) => {
    let data = JSON.parse(blob.toString('utf8'));
    let host_rsa_pub = data.p;
    let client_random_num = _crypto_module.returnRandomInt(99999);
    connprofile.setBundle('host_rsa_pub_key', host_rsa_pub);
    _crypto_module.generateAESCBC256KeyByHash(host_rsa_pub, client_random_num, (err, aes_key) => {
      connprofile.setBundle('aes_256_cbc_key', aes_key);
      let _data = {
        r: client_random_num,
        a: aes_key// aes key to vertify
      };
      _crypto_module.encryptString('RSA2048', host_rsa_pub, JSON.stringify(_data), (err, encrypted)=> {
        connprofile.setBundle('NSPS', 'finalize');
        emitResponse(connprofile,  Buf.from(JSON.stringify(encrypted)));
      });
    });
  };

  this.encrypt = (connprofile, blob, callback)=> {
    connprofile.getBundle('aes_256_cbc_key', (err, key)=>{
      _crypto_module.encrypt('AESCBC256', key, blob, (err, encrypted)=> {
        callback(err, encrypted);
      });
    });
  };

  this.decrypt = (connprofile, blob, callback)=> {
    _crypto_module.decrypt('AESCBC256', connprofile.returnBundle('aes_256_cbc_key'), blob, (err, decrypted)=> {
      callback(err, decrypted);
    });
  };

  this.isConnectionSecured = (connprofile, callback)=> {
    connprofile.getBundle('NSPS', (err, NSPS)=>{
      if(NSPS === 'finalize') {
        connprofile.setBundle('NSPS', true);
        callback(false);
      }
      else {
        callback(NSPS);
      }
    });
  };

  this.upgradeConnection = (connprofile, callback) => {
    _resumes[connprofile.returnGUID()] = callback;
    // operation timeout
    setTimeout(()=>{
      delete _resumes[connprofile.returnGUID()];
    }, _operation_timeout*1000);

    let _data = {
      p: _rsa_pub// RSA publicKey
    };
    connprofile.setBundle('NSPS', 'pending');
    this.emitRequest(connprofile, 'SP',  Buf.from(JSON.stringify(_data)));
  }

  this.importOperationTimeout = (timeout) => {
    _operation_timeout = timeout;
  };

  this.importCryptoModule = (crypto_module) => {
    _crypto_module = crypto_module;
  }

  this.importRSA2048KeyPair = (rsa_priv, rsa_pub) => {
    _rsa_priv = rsa_priv;
    _rsa_pub = rsa_pub;
  };

  this.close = () => {
    _rsa_pub = null;
    _rsa_priv = null;
    _resumes = {};
    _crypto_module = null;
  };
};

module.exports = NSPS;
