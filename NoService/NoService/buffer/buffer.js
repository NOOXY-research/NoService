// NoService/NoService/buffer/buffer.js
// Description:
// "buffer.js" provide unified buffer interface.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

module.exports = {
  alloc : (...args)=> {
    return Buffer.alloc.apply(null, args);
  },

  encode : (...args)=> {
    return Buffer.from.apply(null, args);
  },

  decode : (...args)=> {
    return args[0].toString();
  },

  concat : (...args)=> {
    return Buffer.concat.apply(null, args);
  },

  isBuffer : (...args)=> {
    return Buffer.isBuffer.apply(null, args);
  }
};
