const readline = require('readline');

module.exports = function() {
  this.name = 'NoService Client Implementation';
  this.version = '0.0.0';
  this.noservice = "0.5.6";
  this.allow_older_noservice = false;


  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if (rl.stdoutMuted){
      rl.output.write("\x1B[2K\x1B[200D"+rl.query+"["+((rl.line.length%2==1)?"*.":".*")+"]");
    }
    else
      rl.output.write(stringToWrite);
  };

  // get username and password from terminal input
  let _get_username_and_password = (callback) => {
    let u = null;
    let p = null;
    rl.stdoutMuted = false;
    rl.query = 'username: ';
    rl.question(rl.query, (username) => {
      u = username;
      _get_password((err, p)=>{
        callback(false, u, p);
      });
    });

  };

  let _get_password = (callback)=> {
    rl.stdoutMuted = true;
    rl.query = 'password: ';
    rl.question(rl.query, (password) => {
      rl.stdoutMuted = false;
      console.log('');
      rl.history.shift();
      p = password;
      callback(false, p);
    });
  }

  this.plugin = (noservice_coregateway, noservice_isInitialized, deploy_settings, noservice_constants, verbose, next)=> {
    let Implementation = noservice_coregateway.Implementation;
    // setup NoService Auth implementation
    Implementation.setImplement('signin', (connprofile, data, emitResponse)=>{
      console.log('Please signin your account.');
      _get_username_and_password((err, u, p)=>{
        let _data = {
          u: u,
          p: p
        }
        Implementation.emitRequest(connprofile, 'GT', _data);
        commandread();
      });

    });

    // setup NoService Auth implementation
    Implementation.setImplement('AuthbyToken', (connprofile, data, emitResponse) => {
      let callback = (err, token)=>{
        let _data = {
          m:'TK',
          d:{
            t: data.d.t,
            v: token
          }
        }
        emitResponse(connprofile, _data);
      };
      if(_token == null) {
        Implementation.getImplement('signin', (err, im)=> {
          im(connprofile, data, emitResponse);
        });
      }
      else {
        callback(false, _token);
      }

    });

    Implementation.setImplement('onToken', (err, token)=>{
      _token = token;
    });

    Implementation.setImplement('AuthbyTokenFailed', (connprofile, data, emitResponse) => {
      Implementation.getImplement('signin', (err, im)=> {
        im(connprofile, data, emitResponse);
      });

    });

    // setup NoService Auth implementation
    Implementation.setImplement('AuthbyPassword', (connprofile, data, emitResponse) => {
      let callback = (err, password)=>{
        let _data = {
          m:'PW',
          d:{
            t: data.d.t,
            v: password
          }
        }
        emitResponse(connprofile, _data);
      };
      _get_password((err, p) => {
        callback(err, p);
      });
    });

    noservice_coregateway.ServiceAPI.addAPIGenerator(['Commandline'], (LCBO)=> {
      return({
        question: (question, remote_callback_obj)=> {
          rl.question();
          if(remote_callback_obj) {
            remote_callback_obj.run([], [err, answer]);
          }
        }
      });
    });
  }
}
