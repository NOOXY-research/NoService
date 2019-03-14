# NoService/NoService/service/python/worker.py
# Description:
# "worker.py" is service worker client python version for NOOXY service framework.
# Copyright 2018-2019 NOOXY. All Rights Reserved.

# NOOXY Service WorkerDaemon protocol
# message.t
# 0 worker established {t, a: api tree, p: service module path, c: closetimeout}
# 1 launch
# 2 callback {t, p: [obj_id, callback_path], a: arguments, o:{arg_index, [obj_id, callback_tree]}}
# 3 unbindobj {t, i: id};
# 4 getLCBOcount {t, i}
# 5 getMemoryUsage
# 99 close

import sys, asyncio, socket, json, re, random, os, psutil
from .api_prototype import *

UNIX_Sock_Path = sys.argv[1]
IPC_MSG_SIZE_PREFIX_SIZE = 16
MSG_READ_SIZE = 2**16

# main class of the NoService python worker
class WorkerClient:
    def __init__(self, loop, reader, writer):
        self.loop = loop
        # Although WorkerClient has reader. It is supposed not to use it.
        self.reader = reader
        self.writer = writer
        self._local_obj_callbacks_dict = {}
        self._service_module = None

    # send message to nodejs parent
    def send(self, message):
        if(isinstance(message, str)):
            self.loop.create_task(writer.write(message.encode()))
        else:
            self.loop.create_task(writer.write(json.dumps(message).encode()))

    # parent API caller wrapper
    def callParentAPI(self, [id, APIpath], args):
        _data = {"t":4, "p": APIpath, "a": args, "o": {}}
        for i, arg in args:
            if callable(arg):
                _Id = random.randint(0, 999999)
                self._local_obj_callbacks_dict[_Id] = arg
                _data["o"][i] = [_Id, generateObjCallbacksTree(arg)]
        self.send(data)

    # parent API caller wrapper
    def emitParentCallback(self, [obj_id, path], args):
        _data = {"t":5, "p": [obj_id, path], "a": args, "o": {}}
        for i, arg in args:
            if callable(arg):
                _Id = random.randint(0, 999999)
                self._local_obj_callbacks_dict[_Id] = arg
                _data["o"][i] = [_Id, generateObjCallbacksTree(arg)]
        self.send(data)

    # onMessage event callback
    async def onMessage(self, message):
        message = json.loads(message)
        if message.t == 0:
            p = re.compile('.*\/([^\/]*)\/entry')
            self._service_name = p.match(message.p).group(1)
            self._close_timeout = message.c;
            self._clear_obj_garbage_timeout = message.g;
            self._api = generateObjCallbacks('API', message.a, self.callParentAPI)
            self._api.getMe()
            # not completed
        else if message.t == 1:
            _service_module.start()
        else if message.t == 2:
            callObjCallback(self._local_obj_callbacks_dict[message['p'][0]], message['p'][1], message['a'], message['o'], self.emitParentCallback, generateObjCallbacks)
        else if message.t == 3:
            del  _local_obj_callbacks_dict[message['i']]
        else if message.t == 4:
            self.send({'t':6, 'i':message['i'], 'c': len(_local_obj_callbacks_dict)})
        else if message.t == 5:
            # not implemented
            self.send({'t':7, 'i':message['i'], 'c': None})
        else if message.t == 98:
            pass
        else if message.t == 99:
            pass

    def established(self):
        self.send({'t':0})

# readOneMessege from reader and follows the NoService TCP protocol
async def readOneMessege(reader):
    msg_string = ""
    msg_size = int((await reader.read(IPC_MSG_SIZE_PREFIX_SIZE)).decode())
    left = msg_size
    while(left>0) {
        if(left>MSG_READ_SIZE) {
            msg_string += (await reader.read(MSG_READ_SIZE)).decode()
            left = left - MSG_READ_SIZE
        }
        else {
            msg_string += (await reader.read(left)).decode()
            left = 0
        }
    }
    return msg_string

# first layer of eventloop
async def unix_sock_client(loop):
    global UNIX_Sock_Path
    reader, writer = await asyncio.open_unix_connection(UNIX_Sock_Path, loop=loop)
    w = WorkerClient(loop, reader, writer)
    w.established()
    while true:
        msg_string = await readOneMessege(reader)
        loop.create_task(w.onMessage(msg_string, reader, writer))
        # print('Send: %r' % message)
        # writer.write(message.encode())
        #
        # data = await reader.read(100)
        # print('Received: %r' % data.decode())
        #
        # print('Close the socket')
        # writer.close()

loop = asyncio.get_event_loop()
loop.run_until_complete(unix_sock_client(loop))
