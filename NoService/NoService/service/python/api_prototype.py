# NoService/NoService/service/python/api_prototype.py
# Description:
# "api_prototype.py" is service worker client python version for NOOXY service framework.
# Copyright 2018-2019 NOOXY. All Rights Reserved.

import functools, types

def vdir(obj):
    return [x for x in dir(obj) if not x.startswith('__')]
# NoService API prototype
class NestedCallable:
    def __init__(self):
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
                print('.'.join(walked_path_list))
                return callablefunc
        return deeper(obj_tree, [])
    else:
        def callablefunc(*args):
            callparent([callback_id, []], list(args))
        return callablefunc

def callObjCallback(Obj, Objpath, args, arg_objs_trees, obj_callback_policy, generate_obj_policy):
    def getTargetObj(path, subobj):
        if(len(path)):
            return getTargetObj(path[1:], getattr(subobj, path[0]))
        else:
            return subobj
    for i in arg_objs_trees:
        args[i] = generate_obj_policy(arg_objs_trees[i][0], arg_objs_trees[i][1], obj_callback_policy)
    f = getTargetObj(Objpath, Obj)
    f(*args)
