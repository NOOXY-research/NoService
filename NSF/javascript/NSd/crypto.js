// NSF/NSd/crypto.js
// Description:
// "crypto.js" provide wrapped crypto api for nooxy service framework.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

const crypto = require('crypto');
// NOOXY service protocol sercure
function NSPS() {
  let _rsa_pub = null;
  let _rsa_priv = null;
  let _resumes = {};
  let _crypto_module = null;

  this.emitRouter = () => {console.log('[*ERR*] emit not implemented');};

  // daemon side
  this.RsRouter = (connprofile, data) => {
    let resume = _resumes[connprofile.returnGUID()];
    try{
      _crypto_module.decryptString('RSA2048', _rsa_priv, data, (err, decrypted) => {
        let json = null;
        try {
          json = JSON.parse(decrypted);

          let host_rsa_pub = _rsa_pub;
          let client_random_num = json.r;
          _crypto_module.generateAESCBC256KeyByHash(host_rsa_pub, client_random_num, (err, aes_key) => {
            if(aes_key == json.a) {
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
          resume(true, false);
        }
      });
    }
    catch(er) {
      console.log(er);
      connprofile.closeConnetion();
      resume(true, false);
    }

  };

  // Nooxy service protocol sercure request ClientSide
  // in client need to be in implementation module
  this.RqRouter = (connprofile, data, data_sender) => {
    let host_rsa_pub = data.p;
    let client_random_num = _crypto_module.returnRandomInt(99999);
    connprofile.setBundle('host_rsa_pub_key', host_rsa_pub);
    _crypto_module.generateAESCBC256KeyByHash(host_rsa_pub, client_random_num, (err, aes_key) => {
      connprofile.setBundle('aes_256_cbc_key', aes_key);
      let _data = {
        r: client_random_num,
        a: aes_key// aes key to vertify
      };
      _crypto_module.encryptString('RSA2048', host_rsa_pub, JSON.stringify(_data), (err, encrypted)=>{
        connprofile.setBundle('NSPS', 'finalize');
        data_sender(connprofile, 'SP', 'rs', encrypted);
      });
    });
  };

  this.upgradeConnection = (connprofile, callback) => {
    _resumes[connprofile.returnGUID()] = callback;
    let _data = {
      p: _rsa_pub// RSA publicKey
    };
    connprofile.setBundle('NSPS', 'pending');
    this.emitRouter(connprofile, 'SP', _data);
  }

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


// NOOXY crypto
function NoCrypto() {
  // to base64
  let _algo = {
    // key is in length 32 char
    AESCBC256: {
      encryptString: (key, toEncrypt, callback) => {
        let iv = crypto.randomBytes(16);
        let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let crypted = cipher.update(toEncrypt,'utf8','base64');
        crypted += cipher.final('base64');
        crypted = iv.toString('base64')+crypted;
        callback(false, crypted);
      },
      decryptString: (key, toDecrypt, callback) => {
        let iv = new Buffer.from(toDecrypt.substring(0, 24), "base64");
        let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        toDecrypt = toDecrypt.substring(24);
        let dec = decipher.update(toDecrypt, 'base64', 'utf8');
        dec += decipher.final('utf8');
        callback(false, dec);
      }
    },

    // Keys is in pem format
    RSA2048: {
      encryptString: (publicKey, toEncrypt, callback) => {
        var buffer = new Buffer.from(toEncrypt);
        var encrypted = crypto.publicEncrypt(publicKey, buffer);
        callback(false, encrypted.toString("base64"));
      },
      decryptString: (privateKey, toDecrypt, callback) => {
        var buffer = new Buffer.from(toDecrypt, "base64");
        var decrypted = crypto.privateDecrypt(privateKey, buffer);
        callback(false, decrypted.toString("utf8"));
      }
    },

  }
  this.returnRandomInt = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
  }

  // hashing two string (host and client pub key)by SHA256 to get AES-CBC 256 key 32 char
  this.generateAESCBC256KeyByHash = (string1, string2, callback) => {
    callback(false, crypto.createHash('sha256').update(string1+string2, 'utf-8').digest('base64').substring(0, 32));
  };

  this.encryptString = (algo, key, toEncrypt, callback) => {
    try{
      _algo[algo].encryptString(key, toEncrypt, callback);
    }
    catch(e) {
      callback(e);
    }

  };

  this.decryptString = (algo, key, toDecrypt, callback) => {
    try {
      _algo[algo].decryptString(key, toDecrypt, callback);
    }
    catch(e) {
      callback(e);
    }

  };

  this.close = () => {};
}

module.exports = {
  NoCrypto: NoCrypto,
  NSPS: NSPS
};
