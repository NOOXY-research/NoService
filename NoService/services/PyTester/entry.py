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

        # Object Model Test
        log('Object Model Test.')
        def ObjectdefineCallback(err, model):
            if err:
                log(err)
            else:
                log('Object Model Create.')
                def createCallback(err):
                    if err:
                        log(err)
                    else:
                        log('Object Model Get.')
                        def getCallback(err, result):
                            if err:
                                log(err)
                            else:
                                log(result)
                                log('Object Model Replace.')
                                def replaceCallback(err):
                                    if err:
                                        log(err)
                                    else:
                                        def getCallback(err, result):
                                            if err:
                                                log(err)
                                            else:
                                                log(result)
                                                def removeCallback(err):
                                                    if err:
                                                        log(err)
                                                    else:
                                                        log('Object Model PASS.')
                                                NoService.Database.Model.remove('ObjectTest', removeCallback)
                                        model.get(0, getCallback)
                                model.replace({'objkey': 0,'property1': 'HAHARPLACE', 'property2': 0}, replaceCallback)
                        model.get(0, getCallback)
                model.create({'objkey': 0, 'property1': 'HAHA', 'property2': 0}, createCallback)
        NoService.Database.Model.define('ObjectTest', {'model_type': "Object",'do_timestamp': True,'model_key': "objkey",'structure': {'objkey': 'INTEGER','property1': 'TEXT','property2': 'INTEGER'}}, ObjectdefineCallback)

        # IndexedList Model Test
        log('IndexedList Model Test.')
        def IndexedListdefineCallback(err, model):
            if err:
                log(err)
            else:
                log('IndexedList Model Append Test.')
                def appendRowsCallback(err):
                    if err:
                        log(err)
                    else:
                        log('IndexedList Model Get Test.')
                        def getAllRowsCallback(err, result):
                            if err:
                                log(err)
                            else:
                                log(result)
                                log('IndexedList Model Update Test.')
                                def updateRowsCallback(err):
                                    if err:
                                        log(err)
                                    else:
                                        def getRowsFromToCallback(err, result):
                                            if err:
                                                log(err)
                                            else:
                                                log(result)
                                                def removeCallback(err):
                                                    if err:
                                                        log(err)
                                                    else:
                                                        log('IndexedList Model PASS.')
                                                NoService.Database.Model.remove('IndexedListTest', removeCallback)
                                        model.getRowsFromTo(1, 2, getRowsFromToCallback)
                                model.updateRows([{'Idx': 1,'property1': 'Br'},{'Idx': 2,'property1': 'Cr'}], updateRowsCallback)
                        model.getAllRows(getAllRowsCallback)
                model.appendRows([{'property1': 'A','property2': 0},{'property1': 'B','property2': 1},{'property1': 'C','property2': 2},{'property1': 'D','property2': 3}], appendRowsCallback)
        NoService.Database.Model.define('IndexedListTest', {'model_type': "IndexedList",'do_timestamp': True,'structure': {'property1': 'TEXT','property2': 'INTEGER' }}, IndexedListdefineCallback)

    def close(self):
        self.log('Service Closed')
