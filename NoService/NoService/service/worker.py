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

from twisted.internet import reactor, protocol

class NoService(self):
    pass

class EchoClient(protocol.Protocol):
    """Once connected, send a message, then print the result."""

    def connectionMade(self):
        self.transport.write(b"hello, world!")

    def dataReceived(self, data):
        "As soon as any data is received, write it back."
        print("Server said:", data)
        self.transport.loseConnection()

    def connectionLost(self, reason):
        print("connection lost")

class EchoFactory(protocol.ClientFactory):
    protocol = EchoClient

    def clientConnectionFailed(self, connector, reason):
        print("Connection failed - goodbye!")
        reactor.stop()

    def clientConnectionLost(self, connector, reason):
        print("Connection lost - goodbye!")
        reactor.stop()

f = EchoFactory()

reactor.connectUNIX("/tmp/noservice.sock", f)
reactor.run()
