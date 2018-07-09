let _NSc = new NSc();
_NSc.connect('127.0.0.1', '1487', 'admin');
$(function () {
  $('#loginform').submit(function(e){
    try{
      _NSc.getImplement((err, implement_module)=>{
        implement_module.getClientConnProfile('WebSocket', '127.0.0.1', '1487', (err, connprofile) => {
          let _data = {
            u: $('#loginform-username').val(),
            p: $('#loginform-password').val()
          }
          implement_module.emitRouter(connprofile, 'GT', _data);
        });
      });
    }
    catch(e) {
      console.log(e);
    }
    return false;
  });
});
