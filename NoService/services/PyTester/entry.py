# entry.py
# Description:
# "entry.py" is an NoService entry point
# Copyright 2019 NOOXY. All Rights Reserved.

class Service:
    def log(self, obj):
        print('< NOSERVICE PYTESTER >', obj)

    def __init__(self, Me, NoService):
        self.log(Me)

    def start(self, Me, NoService):
        log = self.log
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
                json_be_returned = {'d': 'Hello! ServiceFunction return from service!'}
                returnJSON(False, json_be_returned)
            NoService.Authorization.Authby.Token(entityId, auth_callback)

        ss.define('jfunc1', jfunc1)

        def onDataCallback(entityId, data):
            def getEntityOwnerCallback(err, username):
                log('Recieved a data from activity. owner: '+username)
                log(data)
            NoService.Service.Entity.getEntityOwner(entityId, getEntityOwnerCallback)
        ss.on('data', onDataCallback)

        def onConnectCallback(entityId, callback):
            log('Activty "'+entityId+'" connected.')
            ss.sendData(entityId, 'A sent data from service 1.')
            ss.sendData(entityId, 'A sent data from service 2.')
            callback(False)

        ss.on('connect', onConnectCallback)

        def createDefaultAdminDeamonSocketCallback(err, activitysocket):
            def onDataCallback(err, data):
                log('Received data from service.')
                log(data)
            activitysocket.on('data', onDataCallback)

            activitysocket.sendData('A sent data from activity.')
            def jfunc1Callback(err, json):
                log(json)
            activitysocket.call('jfunc1', {'d':'Hello! ServiceFunction call from client!'}, jfunc1Callback)

        NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('PyTester', createDefaultAdminDeamonSocketCallback)
        log('Get RawModel Test.')

        def RawModelgetCallback(err, model):
            def getModelTypeCallback(err, type):
                log('Got RawModel "'+NoService.Constants['AUTHE_USER_MODEL_NAME']+'". ModelType: '+type)
            model.getModelType(getModelTypeCallback)

        NoService.Database.RAWModel.get(NoService.Constants['AUTHE_USER_MODEL_NAME'], RawModelgetCallback)

    def close(self):
        self.log('Service Closed')
