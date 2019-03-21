# NoService/NoService/service/python/worker.py
# Description:
# "worker.py" is service worker client python version for NOOXY service framework.
# Copyright 2018-2019 NOOXY. All Rights Reserved.

# NOOXY Service WorkerDaemon protocol
# message['t']
# 0 worker established {t, a: api tree, p: service module path, c: closetimeout}
# 1 launch
# 2 callback {t, p: [obj_id, callback_path], a: arguments, o:{arg_index, [obj_id, callback_tree]}}
# 3 unbindobj {t, i: id};
# 4 getLCBOcount {t, i}
# 5 getMemoryUsage
# 99 close

import sys, asyncio, socket, json, re, random, os, signal, json, importlib, traceback
from api_prototype import *

UNIX_Sock_Path = sys.argv[1]
Service_Name = sys.argv[2]
IPC_MSG_SIZE_PREFIX_SIZE = 16
MSG_READ_SIZE = 2**16

loop = asyncio.get_event_loop()

def keyboardInterruptHandler(signal, frame):
    pass

signal.signal(signal.SIGINT, keyboardInterruptHandler)

# class dummy():
#     def __init__(self):
#         pass
#     def a(self, err, m):
#         print(m)

# main class of the NoService python worker
class WorkerClient:
    def __init__(self, loop, reader, writer):
        self.loop = loop
        self.alive = True
        # Although WorkerClient has reader. It is supposed not to use it.
        self.reader = reader
        self.writer = writer
        self._local_obj_callbacks_dict = {}
        self._service_module = None
        self._closed = False

    # send message to nodejs parent
    def send(self, message):
        encoded = None
        if(isinstance(message, str)):
            encoded = message.encode()
        else:
            encoded = json.dumps(message).encode()
        self.writer.write(str(len(encoded)).zfill(16).encode()+encoded)

    # parent API caller wrapper
    def callParentAPI(self, id_APIpath, args):
        id, APIpath = id_APIpath
        _data = {"t":4, "p": APIpath, "a": args, "o": {}}
        for i in range(len(args)):
            arg = args[i]
            if callable(arg):
                args[i] = None
                _Id = random.randint(0, 999999)
                self._local_obj_callbacks_dict[_Id] = arg
                _data["o"][i] = [_Id, generateObjCallbacksTree(arg)]
        self.send(_data)

    # parent API caller wrapper
    def emitParentCallback(self, id_APIpath, args):
        obj_id, path = id_APIpath
        _data = {"t":5, "p": [obj_id, path], "a": args, "o": {}}
        for i in range(len(args)):
            arg = args[i]
            if callable(arg):
                args[i] = None
                _Id = random.randint(0, 999999)
                self._local_obj_callbacks_dict[_Id] = arg
                _data["o"][i] = [_Id, generateObjCallbacksTree(arg)]
        self.send(_data)

    # onMessage event callback
    async def onMessage(self, message):
        message = json.loads(message)
        if message['t'] == 0:
            p = re.compile('.*\/([^\/]*)\/entry')
            self._service_name = p.match(message['p']).group(1)
            self._close_timeout = message['c'];
            self._clear_obj_garbage_timeout = message['g'];
            self._api = generateObjCallbacks('API', message['a'], self.callParentAPI)

            def getMeCallback(err, Me):
                self._Me = Me
                def getSettingsCallback(err, daemon_setting):
                    if Me['Manifest']['LibraryAPI']:
                        pass
                    setattr(self._api, 'Constants', json.loads(open(sys.path[0]+'/'+message['cpath']).read()))
                    os.chdir(Me['FilesPath'])
                    sys.path.append(message['p'].split('/entry')[0])
                    from entry import Service
                    self._service_module = Service(Me, self._api)
                    self.send({'t':1})
                self._api.Daemon.getSettings(getSettingsCallback)
            self._api.getMe(getMeCallback)
            # not completed
        elif message['t'] == 1:
            try:
                self._service_module.start(self._Me, self._api)
                self.send({'t': 2});
            except Exception as e:
                self.send({'t': 98, 'e': str(traceback.format_exc())});
        elif message['t'] == 2:
            callObjCallback(self._local_obj_callbacks_dict[message['p'][0]], message['p'][1], message['a'], message['o'], self.emitParentCallback, generateObjCallbacks)
        elif message['t'] == 3:
            del  self._local_obj_callbacks_dict[message['i']]
        elif message['t'] == 4:
            self.send({'t':6, 'i':message['i'], 'c': len(_local_obj_callbacks_dict)})
        elif message['t'] == 5:
            # not implemented
            self.send({'t':7, 'i':message['i'], 'c': {"rss":0}})
        elif message['t'] == 98:
            print(message['e'])
        elif message['t'] == 99:
            if self._closed == False:
                self._closed = True
                if self._service_module:
                    try:
                        if self._service_module.close:
                            self._service_module.close(self._Me, self._api)
                            self.send({'t':3})
                        else:
                            self.send({'t':96, 'e': 'The service "'+self._service_name+'" have no "close" function.'})
                    except Exception as e:
                        self.send({'t': 96, 'e': str(traceback.format_exc())});
            self.alive = False

    def established(self):
        self.send({'t':0, 's': Service_Name})

# readOneMessege from reader and follows the NoService TCP protocol
async def readOneMessege(reader):
    msg_string = ""
    msg_size = (await reader.read(IPC_MSG_SIZE_PREFIX_SIZE)).decode()
    if msg_size == '':
        return None
    else:
        msg_size = int(msg_size)
        left = msg_size
        while left>0:
            if left>MSG_READ_SIZE:
                msg_string += (await reader.read(MSG_READ_SIZE)).decode()
                left = left - MSG_READ_SIZE
            else:
                msg_string += (await reader.read(left)).decode()
                left = 0
        return msg_string

# first layer of eventloop
async def unix_sock_client(loop):
    global UNIX_Sock_Path
    reader, writer = await asyncio.open_unix_connection(UNIX_Sock_Path, loop=loop)
    w = WorkerClient(loop, reader, writer)
    w.established()
    while w.alive:
        msg_string = await readOneMessege(reader)
        if(msg_string != None):
            loop.create_task(w.onMessage(msg_string))
        elif(w.alive):
            print('Disconnect from NoService Core. "'+Service_Name+'" forced to exit. Your state may not be saved!')
            exit(0)
        else:
            exit(0)


loop.run_until_complete(unix_sock_client(loop))
