# NoService/NoService/service/python/api_prototype.py
# Description:
# "api_prototype.py" is service worker client python version for NOOXY service framework.
# Copyright 2018-2019 NOOXY. All Rights Reserved.

import functools

# NoService API prototype
class NoServiceAPI:
    def __init__(self, value, **attrs):
        self._value = value
        self._attrs = attrs

    # dynamic nested getattr
    def __getattr__(self, attr, *args):
        def _getattr(self, attr):
            return getattr(self, attr, *args)
        return functools.reduce(_getattr, [self] + attr.split('.'))

    # dynamic nested setattr
    def __setattr__(self, attr, val):
        pre, _, post = attr.rpartition('.')
        return setattr(self.__getattr__(self, pre) if pre else self, post, val)

    def __repr__(self):
        return repr(self._value)

def generateObjCallbacksTree():
    pass

def generateObjCallbacks(callback_id, api_tree, callparent):
    pass

def callObjCallback():
    pass
