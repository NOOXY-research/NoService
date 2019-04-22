# NoService/NoService/service/python/api_prototype.py
# Description:
# "api_prototype.py" is service worker client python version for NOOXY service framework.
# Copyright 2018-2019 NOOXY. All Rights Reserved.

import functools, types, traceback, json

def vdir(obj):
    return [x for x in dir(obj) if not x.startswith('__')]

def generateObjCallbacksTree(obj_raw):
    if callable(obj_raw):
        return {}
    else:
        def deeper(subobj):
            obj_tree = {}
            if isinstance(obj_raw, types.FunctionType) or obj_raw == None:
                return None
            else:
                for i in vdir(subobj):
                    obj_tree[key] = deeper(getattr(subobj, key))

        return deeper(obj_raw)

# NoService API prototype
class NestedCallable:
    def __init__(self):
        pass
#
class RemoteCallbackTree:
    def __init__(self, cbtree):
        self.obj_id = cbtree[0]
        self.tree = cbtree[1]
        self.destroyRemoteCallback = None
        self.emitRemoteCallback = None
    def returnCallbacks(self):
        return generateObjCallbacks(self.obj_id, self.tree, self.emitRemoteCallback)

class LocalCallback:
    def __init__(self, id, callback):
        self.id = id
        self.callback = callback
    def callCallback(self, args):
        self.callback(*args)
    def returnTree(self):
        return [self.id, {}]


def generateObjCallbacks(callback_id, obj_tree, callparent):
    if len(obj_tree):
        def deeper(sub_obj_tree, walked_path_list):
            if isinstance(sub_obj_tree, dict):
                ObjCallback = NestedCallable()
                for key in sub_obj_tree:
                    setattr(ObjCallback, key, deeper(sub_obj_tree[key], walked_path_list+[key]))
                return ObjCallback
            else:
                def callablefunc(*args):
                    callparent([callback_id, walked_path_list], list(args))
                return callablefunc
        return deeper(obj_tree, [])
    else:
        def callablefunc(*args):
            callparent([callback_id, []], list(args))
        return callablefunc

def callObjCallback(Obj, Objpath, args):
    def getTargetObj(path, subobj):
        if(len(path)):
            return getTargetObj(path[1:], getattr(subobj, path[0]))
        else:
            return subobj
    f = getTargetObj(Objpath, Obj)
    try:
        f(*args)
    except Exception as e:
        print(str(traceback.format_exc()))
        print(f)

def encodeArgumentsToBinary(args):
    result = bytes(0)
    for i in range(len(args)):
        arg = args[i]
        if isinstance(arg, (bytes, bytearray)):
            blob = arg
            result += bytearray([3])+str(str(len(blob)).zfill(15)).encode()+blob
        elif isinstance(arg, LocalCallback):
            blob = str(json.dumps(arg.returnTree())).encode()
            result += bytearray([2])+str(str(len(blob)).zfill(15)).encode()+blob
        else:
            blob = str(json.dumps(arg)).encode()
            result += bytearray([1])+str(str(len(blob)).zfill(15)).encode()+blob
    return result


def decodeArgumentsFromBinary(blob):
    result = []
    while len(blob):
        type = blob[0]
        length = int(blob[1:16])
        token = blob[16:16+length]
        blob = blob[16+length:]
        if(type == 0):
            result.append({"type": "error", "data": token.decode()})
        elif(type == 1):
            result.append(json.loads(token.decode()))
        elif(type == 2):
            result.append(RemoteCallbackTree(json.loads(token.decode())))
        elif(type == 3):
            result.append(token)
    return result
