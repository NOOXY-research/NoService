// NoService/NoService/crypto/crypto.js
// Description:
// "crypto.js" provide wrapped crypto api for nooxy service framework.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const crypto = require('crypto');

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
        let iv = new Buf.from(toDecrypt.substring(0, 24), "base64");
        let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        toDecrypt = toDecrypt.substring(24);
        let dec = decipher.update(toDecrypt, 'base64', 'utf8');
        dec += decipher.final('utf8');
        callback(false, dec);
      },

      // For NSPS 2
      encrypt: (key, toEncrypt, callback) => {
        let iv = crypto.randomBytes(16);
        let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let salt = crypto.randomBytes(64);
        let crypted = Buf.concat([iv, cipher.update(Buf.concat([salt, toEncrypt])), cipher.final()]);
        callback(false, crypted);
      },
      decrypt: (key, toDecrypt, callback) => {
        let iv = toDecrypt.slice(0, 16);
        let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        toDecrypt = toDecrypt.slice(16);
        let dec = Buf.concat([decipher.update(toDecrypt), decipher.final()]);
        callback(false, dec.slice(64));
      }
    },

    // Keys is in pem format
    RSA2048: {
      encryptString: (publicKey, toEncrypt, callback) => {
        let buffer = new Buf.from(toEncrypt);
        let encrypted = crypto.publicEncrypt(publicKey, buffer);
        callback(false, encrypted.toString("base64"));
      },
      decryptString: (privateKey, toDecrypt, callback) => {
        let buffer = new Buf.from(toDecrypt, "base64");
        let decrypted = crypto.privateDecrypt(privateKey, buffer);
        callback(false, decrypted.toString("utf8"));
      },
      encrypt: (publicKey, toEncrypt, callback) => {
        let buffer = new Buf.from(toEncrypt);
        let encrypted = crypto.publicEncrypt(publicKey, buffer);
        callback(false, encrypted);
      },
      decrypt: (privateKey, toDecrypt, callback) => {
        let buffer = new Buf.from(toDecrypt);
        let decrypted = crypto.privateDecrypt(privateKey, buffer);
        callback(false, decrypted);
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

  this.encrypt = (algo, key, toEncrypt, callback) => {
    try{
      _algo[algo].encrypt(key, toEncrypt, callback);
    }
    catch(e) {
      callback(e);
    }

  };

  this.decrypt = (algo, key, toDecrypt, callback) => {
    try {
      _algo[algo].decrypt(key, toDecrypt, callback);
    }
    catch(e) {
      callback(e);
    }
  };

  this.close = () => {};
}

module.exports = NoCrypto;
