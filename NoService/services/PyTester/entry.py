# entry.py
# Description:
# "entry.py" is an NoService entry point
# Copyright 2019 NOOXY. All Rights Reserved.

class Service:
    def log(self, obj):
        print('< NOOXY TESTER >', obj)

    def __init__(self, Me, NoService):
        self.Me = Me
        self.NoService = NoService
        self.log(Me)

    def handleUserSearch(self, err, rows):
        self.log('searchUsersByUsernameNRows Test');
        self.log(rows)

    def start(self):
        self.NoService.Authenticity.searchUsersByUsernameNRows('ad%', 1, this.handleUserSearch)

    def close(self):
        pass
