// NoService/NoService/router/NSPS.js
// Description:
// "NSPS.js" NOOXY service protocol secure.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

// NOOXY service protocol secure
function NSPS() {
  let _rsa_pub = null;
  let _rsa_priv = null;
  let _resumes = {};
  let _crypto_module = null;
  let _operation_timeout = 60; // seconds

  this.importOperationTimeout = (timeout) => {
    _operation_timeout = timeout;
  };

  this.emitRouter = () => {console.log('[*ERR*] emit not implemented');};

  // daemon side
  this.RsRouter = (connprofile, data) => {
    let resume = _resumes[connprofile.returnGUID()];
    if(resume) {
      try{
        _crypto_module.decryptString('RSA2048', _rsa_priv, data, (err, decrypted) => {
          if(err) {
            resume(err);
          }
          else {
            let json = null;
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
    // operation timeout
    setTimeout(()=>{
      delete _resumes[connprofile.returnGUID()];
    }, _operation_timeout*1000);

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

module.exports = NSPS;
