# NoService/NoService/service/python/worker.py
# Description:
# "worker.py" is service worker client python version for NOOXY service framework.
# Copyright 2018-2019 NOOXY. All Rights Reserved.

# NOOXY Service WorkerDaemon protocol
# type
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

    def emitParentMessage(self, type, blob):
        b = str(len(blob)+1).zfill(16).encode()+bytearray([type])+blob
        self.writer.write(b)

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
        _data = APIpath
        for i in range(len(args)):
            arg = args[i]
            if callable(arg):
                _Id = random.randint(0, 999999)
                self._local_obj_callbacks_dict[_Id] = LocalCallback(_Id, arg)
                args[i] = self._local_obj_callbacks_dict[_Id]
        self.emitParentMessage(4, bytearray([len(json.dumps(_data).encode())])+json.dumps(_data).encode()+encodeArgumentsToBinary(args))

    # parent API caller wrapper
    def emitParentCallback(self, id_APIpath, args):
        id, APIpath = id_APIpath
        _data = id_APIpath
        for i in range(len(args)):
            arg = args[i]
            if callable(arg):
                _Id = random.randint(0, 999999)
                self._local_obj_callbacks_dict[_Id] = LocalCallback(_Id, arg)
                args[i] = self._local_obj_callbacks_dict[_Id]
        self.emitParentMessage(5, bytearray([len(json.dumps(_data).encode())])+json.dumps(_data).encode()+encodeArgumentsToBinary(args))

    # onMessage event callback
    async def onMessage(self, type, blob):
        if type == 0:
            message = json.loads(blob)
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
                    setattr(self._api, 'Constants', json.loads(open(message['cpath']).read()))
                    os.chdir(Me['FilesPath'])
                    sys.path.append(message['p'].split('/entry')[0])
                    from entry import Service
                    self._service_module = Service(Me, self._api)
                    self.emitParentMessage(1, bytes(0))
                self._api.Daemon.getSettings(getSettingsCallback)
            self._api.getMe(getMeCallback)
            # not completed
        elif type == 1:
            try:
                self._service_module.start(self._Me, self._api)
                self.emitParentMessage(2, bytes(0))
            except Exception as e:
                self.emitParentMessage(98, json.dumps({'e': str(traceback.format_exc())}).encode())
        elif type == 2:
            id_path = json.loads(blob[1:1+blob[0]].decode())
            args = decodeArgumentsFromBinary(blob[1+blob[0]:])
            for i in range(len(args)):
                if(isinstance(args[i], RemoteCallbackTree)):
                    args[i].emitRemoteCallback = self.emitParentCallback
                    args[i] = args[i].returnCallbacks()
            self._local_obj_callbacks_dict[id_path[0]].callCallback(args);
        elif type == 3:
            message = json.loads(blob.decode())
            del  self._local_obj_callbacks_dict[message['i']]
        elif type == 4:
            self.emitParentMessage(6, json.dumps({'i':message['i'], 'c': len(_local_obj_callbacks_dict)}).encode())
        elif type == 5:
            # not implemented
            self.emitParentMessage(7, json.dumps({'i':message['i'], 'c': {"rss":0}}).encode())
        elif type == 98:
            message = json.loads(blob.decode())
            print(message['e'])
        elif type == 99:
            if self._closed == False:
                self._closed = True
                if self._service_module:
                    try:
                        if self._service_module.close:
                            self._service_module.close(self._Me, self._api)
                            self.emitParentMessage(3, bytes(0))
                        else:
                            self.emitParentMessage(96, json.dumps({'e': 'The service "'+self._service_name+'" have no "close" function.'}).encode())
                    except Exception as e:
                        self.emitParentMessage(96, json.dumps({'e': str(traceback.format_exc())}).encode())
            self.alive = False

    def established(self):
        self.emitParentMessage(0, json.dumps({'s': Service_Name}).encode())

# readOneMessege from reader and follows the NoService TCP protocol
async def readOneMessege(reader):
    blob = bytearray(0)
    msg_size = (await reader.read(IPC_MSG_SIZE_PREFIX_SIZE)).decode()
    if msg_size == '':
        return None
    else:
        msg_size = int(msg_size)
        left = msg_size
        while left>0:
            if left>MSG_READ_SIZE:
                blob += await reader.read(MSG_READ_SIZE)
                left = left - MSG_READ_SIZE
            else:
                blob += await reader.read(left)
                left = 0
        return blob

# first layer of eventloop
async def unix_sock_client(loop):
    global UNIX_Sock_Path
    reader, writer = await asyncio.open_unix_connection(UNIX_Sock_Path, loop=loop)
    w = WorkerClient(loop, reader, writer)
    w.established()
    while w.alive:
        blob = await readOneMessege(reader)
        if(blob != None):
            loop.create_task(w.onMessage(blob[0], blob[1:]))
        elif(w.alive):
            print('Disconnect from NoService Core. "'+Service_Name+'" forced to exit. Your state may not be saved!')
            exit(0)
        else:
            exit(0)


loop.run_until_complete(unix_sock_client(loop))
