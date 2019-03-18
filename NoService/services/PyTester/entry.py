# entry.py
# Description:
# "entry.py" is an NoService entry point
# Copyright 2019 NOOXY. All Rights Reserved.

class Service:
    def log(self, obj):
        print('< NOSERVICE PYTESTER >', obj)

    def __init__(self, Me, NoService):
        self.Me = Me
        self.NoService = NoService
        self.log(Me)

    def start(self):
        log = self.log
        NoService = self.NoService
        ss = NoService.Service.ServiceSocket

        def handleUserSearch(err, rows):
            log('searchUsersByUsernameNRows Test')
            log(rows)
        NoService.Authenticity.searchUsersByUsernameNRows('ad%', 1, handleUserSearch)

        log('ServiceSocket Test');

        def jfunc1(json, entityId, returnJSON):
            def auth_callback(err, p):
                log('Auth status: '+str(p))
                log(json)
                json_be_returned = {'d': 'Hello! Jfunc return from service!'}
                returnJSON(False, json_be_returned)
            NoService.Authorization.Authby.Token(entityId, auth_callback)

        ss.define('jfunc1', jfunc1)

        def createDefaultAdminDeamonSocketCallback(err, activitysocket):
            def jfunc1Callback(err, json):
                log(json)
            activitysocket.call('jfunc1', {'d':'Hello! Jfunc call from client!'}, jfunc1Callback)

        NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('PyTester', createDefaultAdminDeamonSocketCallback)
    def close(self):
        pass
