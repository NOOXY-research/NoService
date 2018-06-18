// NSF/NSd/crypto.js
// Description:
// "crypto.js" provide wrapped crypto api for nooxy service framework.
// Copyright 2018 NOOXY. All Rights Reserved.
const crypto = require('crypto');

// NOOXY service protocol sercure
function NSPS() {
  let _rsa_pub = null;
  let _rsa_priv = null;

  this.emitRouter = () => {console.log('[*ERR*] emit not implemented');};

  this.RqRouter = () =>
  this.importRSA2048KeyPair = ()=>{};
};



function Crypto() {
  // to base64
  let _algo = {
    AESCBC256: {
      encryptString: function e(key, toEncrypt, callback) {
        let iv = Crypto.randomBytes(16);
        let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let crypted = cipher.update(toEncrypt,'utf8','base64');
        crypted += cipher.final('base64');
        crypted += iv.toString('base64');
        return crypted;
      },
      decryptString: function d(key, toDecrypt, callback) {
        let iv = new Buffer(toDecrypt.substring(0, 24), "base64");
        let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        toDecrypt = toDecrypt.substring(24);
        let dec = decipher.update(toDecrypt, 'base64', 'utf8');
        dec += decipher.final('utf8');
        return dec;
      }
    },

    RSA2048: {
      encryptString: (publicKey, toEncrypt, callback) => {
        var buffer = new Buffer(toEncrypt);
        var encrypted = crypto.publicEncrypt(publicKey, buffer);
        callback(false, encrypted.toString("base64"));
      },
      decryptString: (privateKey, toDecrypt, callback) => {
        var buffer = new Buffer(toDecrypt, "base64");
        var decrypted = crypto.privateDecrypt(privateKey, buffer);
        callback(false, decrypted.toString("utf8"));
      }
    },

  }

  // hashing two string (host and client pub key)by SHA512 to get AES-CBC 256 key
  this.generateAESCBC256KeyByHash = (string1, string2, callback) => {
    crypto.createHash('sha256').update(string1+string2, 'utf-8').digest('base64');
  };

  this.encryptString = (algo, key, toEncrypt, callback) => {
    _algo[algo].encryptString(key, toEncrypt, callback);
  };

  this.decryptString = (algo, key, toDecrypt, callback) => {
    _algo[algo].decryptString(key, toDecrypt, callback);
  };

  this.returnNSPSModule = () => {

  };


}

module.exports = {
  Crypto: Crypto,
  NSPS: NSPS
};
