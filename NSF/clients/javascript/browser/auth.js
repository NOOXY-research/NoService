let _NSc = new NSc();
_NSc.connect('www.nooxy.tk', '1487');
function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}
$(function () {
  $('#loginform').submit(function(e){
    try{
      _NSc.getImplement((err, implement_module)=>{
        implement_module.getClientConnProfile(getQueryVariable('conn_method'), getQueryVariable('remote_ip'), getQueryVariable('port'), (err, connprofile) => {
          let _data = {
            u: $('#loginform-username').val(),
            p: $('#loginform-password').val()
          }
          implement_module.returnImplement('setUser')(false, _data.u);
          implement_module.emitRouter(connprofile, 'GT', _data);
        });
      });
    }
    catch(e) {
      console.log(e);
    }
    return false;
  });

  $('#passwordform-username').val(getQueryVariable('username'));
  $('#passwordform').submit(function(e){
    try{
      _NSc.getImplement((err, implement_module)=>{
        implement_module.getClientConnProfile(getQueryVariable('conn_method'), getQueryVariable('remote_ip'), getQueryVariable('port'), (err, connprofile) => {
          let _data = {
            m: 'PW',
            d: {
              t: getQueryVariable('authtoken'),
              v: $('#passwordform-password').val()
            }
          }
          implement_module.sendRouterData(connprofile, 'AU', 'rs', _data);
          setTimeout(()=>{window.close();}, 500);
        });
      });
    }
    catch(e) {
      console.log(e);
    }
    return false;
  });
});
