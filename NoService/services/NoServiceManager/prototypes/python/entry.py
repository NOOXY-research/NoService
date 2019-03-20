# NoService/services/{{ servicename }}/entry.py
# Description:
# "{{ servicename }}/entry.py" is an NoService entry point
# Copyright 2019 NOOXY. All Rights Reserved.

class Service:
    def __init__(self, Me, NoService):
        # Initialize your service here synchronous. Do not use async here!
        # Get the service socket of your service
        ss = NoService.Service.ServiceSocket
        settings = Me['Settings']

        # ServiceFunction is a function that can be defined, which others entities can call.
        def ServiceFunction(json, entityId, returnJSON):
            # Code here for JSONfunciton
            # Return Value for ServiceFunction call. Otherwise remote will not recieve funciton return value.
            json_be_returned = {'d': 'Hello! NOOXY Service Framework!'}
            # First parameter for error, next is JSON to be returned.
            returnJSON(false, json_be_returned)
        ss.define('ServiceFunction', ServiceFunction)

        # Safe define a ServiceFunction.
        def SafeServiceFunction(json, entityId, returnJSON):
            # Code here for JSONfunciton
            # Return Value for ServiceFunction call. Otherwise remote will not recieve funciton return value.
            json_be_returned = {'d': 'Hello! NOOXY Service Framework!'}
            # First parameter for error, next is JSON to be returned.
            returnJSON(false, json_be_returned)
        # In case Auth fail.
        def SafeServiceFunctionAuthFailed(err):
            print('Auth Failed.')
        ss.sdefine('SafeServiceFunction', SafeServiceFunction, SafeServiceFunctionAuthFailed)

        # ServiceSocket.onData, in case client send data to this Service.
        # You will need entityId to Authorize remote user. And identify remote.
        def ServiceSocketOnData(entityId, data):
            # Get Username and process your work.
            def getEntityOwnerCallback(err, username):
                print('recieved a data by '+username)
                print(data)
            NoService.Service.Entity.getEntityOwner(entityId, getEntityOwnerCallback)
        ss.on('data', ServiceSocketOnData)

        # Send data to client.
        ss.sendData('A entity ID', 'My data to be transfer.')

        # ServiceSocket.onConnect, in case on new connection.
        def ServiceSocketOnConnect(entityId, callback):
            # Do something.
            # report error
            callback(False)
        ss.on('connect', ServiceSocketOnConnect)

        # ServiceSocket.onConnect, in case on new connection.
        def ServiceSocketOnClose(entityId, callback):
            # Do something.
            print('ServiceSocket closed')
            # report error
            callback(False)
        ss.on('close', ServiceSocketOnClose)

    # Here is where your service start
    def start(self, Me, NoService):
        # Access another service on this daemon
        def AnotherServiceActivitySocketCallback(err, activitysocket):
            pass # accessing other service
        NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('Another Service', AnotherServiceActivitySocketCallback);

    # If the daemon stop, your service recieve close signal here.
    def close(self, Me, NoService):
        self.log('Service Closed')
        # Close your service here synchronous. Do not use async here!
        # Saving state of you service.
        # Please save and manipulate your files in this directory
