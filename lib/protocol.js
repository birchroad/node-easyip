/*!
 *  Copyright © 2011-2015 Peter Magnusson.
 *  All rights reserved.
 */

exports.EASYIP_PORT = 995;
exports.RESPONSE_TIMEOUT = 200;
exports.MAX_PACKET_SIZE = 120;

var debug = require('debug')('easyip:enums');
var FLAGS = {
  EMPTY: 0,
  BIT_OR: 0x2,
  BIT_AND: 0x4,
  NO_ACK: 0x40,
  RESPONSE: 0x80
};


var OPERANDS = {
  EMPTY: 0,
  FLAGWORD: 1,
  INPUTWORD: 2,
  OUTPUTWORD: 3,
  REGISTER: 4,
  STRING: 11
};

function parseOperand(code) {
  if (code === 'F') return 'FLAGWORD';
  if (code === 'I') return 'INPUT';
  throw new Error('Illeigal operand');
};

// var FIELDS = {
//     FLAGS:0,
//     ERROR:1,
//     COUNTER:2,
//     INDEX1:3,
//     SPARE1:4,
//     SEND_TYPE: 5,
//     SEND_SIZE: 6,
//     SEND_OFFSET: 7,
//     SPARE2:8,
//     REQ_TYPE: 9,
//     REQ_SIZE: 10,
//     REQ_OFFSET_SERVER:11,
//     REQ_OFFSET_CLIENT:12
// };


exports.FLAGS = Object.freeze(FLAGS);
exports.OPERANDS = Object.freeze(OPERANDS);
// exports.FIELDS = Object.freeze(FIELDS);
exports.parseOperand = parseOperand;

exports.keyOf = function (list, value) {
  var keys = Object.keys(list);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (list[key] === value) {
      return key;
    }
  }
  return;
};

exports.keyOfBits = function (list, value) {
  var newval = [];
  Object.keys(list).forEach(function (key) {
    debug('checking %s', key, (value & list[key]));
    if ((value & list[key]) > 0) {
      newval.push(key);
    }
  });
  debug('list of values', newval);
  return newval;
};
