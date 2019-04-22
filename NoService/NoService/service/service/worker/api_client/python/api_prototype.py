# NoService/NoService/service/python/api_prototype.py
# Description:
# "api_prototype.py" is service worker client python version for NOOXY service framework.
# Copyright 2018-2019 NOOXY. All Rights Reserved.

import functools, types, traceback

def vdir(obj):
    return [x for x in dir(obj) if not x.startswith('__')]
# NoService API prototype
class NestedCallable:
    def __init__(self):
        pass

class RemoteCallbackTree:
    def __init__(self, cbtree):
        pass

class LocalCallbackTree:
    def __init__(self, cbtree):
        pass

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
            pass
        elif callable(arg):
            _Id = random.randint(0, 999999)


def decodeArgumentsFromBinary(blob, callparent):
    result = []
