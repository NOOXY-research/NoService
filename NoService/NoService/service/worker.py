# NoService/NoService/worker.py
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

import sys, functools, asyncio, socket

UNIX_Sock_Path = sys.argv[1]
TCP_IP_Chunk_Token = '}{"""}<>'

def rsetattr(obj, attr, val):
    pre, _, post = attr.rpartition('.')
    return setattr(rgetattr(obj, pre) if pre else obj, post, val)

# using wonder's beautiful simplification: https://stackoverflow.com/questions/31174295/getattr-and-setattr-on-nested-objects/31174427?noredirect=1#comment86638618_31174427

def rgetattr(obj, attr, *args):
    def _getattr(obj, attr):
        return getattr(obj, attr, *args)
    return functools.reduce(_getattr, [obj] + attr.split('.'))

class NoService:
    def __init__(self, value, **attrs):
        self._value = value
        self._attrs = attrs

    def __getattr__(self, name):
        if name in self._attrs:
            return self._attrs[name]
        return getattr(self._value, name)

    def __setattr__(self, name, value):
        if name in {'_value', '_attrs'}:
            return super().__setattr__(name, value)
        self._attrs[name] = ShadowAttrs(value)

    def __repr__(self):
        return repr(self._value)

def process(RAWString):
    global TCP_IP_Chunk_Token
    result = []
    return result

async def unix_sock_client(loop):
    global UNIX_Sock_Path
    while true:
        reader, writer = await asyncio.open_unix_connection(UNIX_Sock_Path, loop=loop)
        callbacks_to_be_called = process()
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
