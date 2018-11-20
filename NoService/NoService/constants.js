let Constant = {
  'version': 'aphla-0.3.5',
  'NSP_version': 'aphla 0.2.0',
  'copyright': 'copyright(c)2018 NOOXY inc.',
  'default_user': {
    'username': 'admin',
    'displayname': 'NoService Superuser',
    'password': 'admin'
  },
  'dependencies': [
    'ws'
  ],
  'AUTHE_USER_MODEL_NAME': 'NSUser',
  'MODEL_TABLE_NAME': 'NoService_Models',
  'MODEL_TABLE_PREFIX': 'NoService_Model_',
  'MODEL_INDEXKEY': 'Idx',
  'MODEL_GROUPKEY': 'Grp'
}

module.exports = Constant;
