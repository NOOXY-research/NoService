const readline = require('readline');

module.exports = function() {
  this.name = 'NoService Client Implementation';
  this.version = '0.0.0';
  this.noservice = "0.6.0";
  this.allow_older_noservice = false;

  let tokens = {};
  let token_resumes = {};


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
      console.log('Please signin your account. Auth ('+data.d.t+').');
      _get_username_and_password((err, u, p)=>{
        let _data = {
          u: u,
          p: p
        }
        Implementation.emitRequest(connprofile, 'GT', _data);
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
      if(!tokens[data.d.u]) {
        console.log(data.d.u);
        token_resumes[data.d.u] = callback;
        Implementation.getImplement('signin', (err, im)=> {
          im(connprofile, data, emitResponse);
        });
      }
      else {
        callback(false, tokens[data.d.u]);
      }

    });

    Implementation.setImplement('onToken', (err, username, token)=>{
      console.log(token_resumes[username]);
      token_resumes[username](false, token);
      if(!err) tokens[username] = token;
    });

    Implementation.setImplement('AuthbyTokenFailed', (connprofile, data, emitResponse) => {
      Implementation.getImplement('signin', (err, im)=> {
        im(connprofile, data, emitResponse);
      });

    });

    // setup NoService Auth implementation
    Implementation.setImplement('AuthbyPassword', (connprofile, data, emitResponse) => {
      console.log('Please enter your password '+data.d.u+'. Auth ('+data.d.t+').');
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

    noservice_coregateway.ServiceAPI.addAPIGenerator((api, service_socket, manifest)=> {
      api.addAPI(['Commandline'], (LCBO)=> {
        return({
          question: (question, remote_callback_obj)=> {
            rl.question(question, (answer)=> {
              if(remote_callback_obj) {
                remote_callback_obj.run([], [answer]);
              }
            });
          }
        });
      });
    });

    next(false);
  }
}
