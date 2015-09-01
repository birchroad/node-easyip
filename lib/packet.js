/*!
 *  Copyright © 2011-2015 Peter Magnusson.
 *  All rights reserved.
 */
var DataWriter = require('./datawriter');
var DataReader = require('./datareader');
var extend = require('util')._extend;
var debug = require('debug')('easyip:packet');
var protocol = require('./protocol');

var Packet = module.exports = function (source) {
  source = source || {};
  source.payload = source.payload || [];
  this.flags = protocol.keyOfBits(protocol.FLAGS, 0);
  this.error =  0;
  this.counter = 0;
  this.index1 = 0;
  this.spare1 = 0;
  this.sendType =  protocol.keyOf(protocol.OPERANDS, 0);
  this.sendSize = 0;
  this.sendOffset = 0;
  this.spare2 =  0;
  this.reqType =  protocol.keyOf(protocol.OPERANDS, 0);
  this.reqSize =  0;
  this.reqOffsetServer =  0;
  this.reqOffsetClient =  0;
  this.payload = [];

  extend(this, source);
  if (source.payload) {
    this.payload = source.payload;
  }
};

Packet.parse = function (buffer, isInbound) {
  isInbound = isInbound === true ? true : false;
  debug('parse');
  var reader = new DataReader(buffer);
  var packet = new Packet();
  packet.flags = protocol.keyOfBits(protocol.FLAGS, reader.byte());
  packet.error = reader.byte();
  packet.counter = reader.short();
  packet.index1 = reader.short();
  packet.spare1 = reader.byte();
  packet.sendType = protocol.keyOf(protocol.OPERANDS, reader.byte());
  packet.sendSize = reader.short();
  packet.sendOffset = reader.short();
  packet.spare2  = reader.byte();
  packet.reqType = protocol.keyOf(protocol.OPERANDS, reader.byte());
  packet.reqSize = reader.short();
  packet.reqOffsetServer = reader.short();
  packet.reqOffsetClient = reader.short();


  var parsingType = packet.sendType;
  var parsingSize = packet.sendSize;
  if (packet.flags.indexOf('RESPONSE') >= 0) {
    //its a response, parse payload with reqType..
    debug('payload as reqType:%s', packet.reqType);
    parsingType = packet.reqType;
    parsingSize = packet.reqSize;
  }


  if (parsingType !== 'EMPTY') {
    while (!reader.isEOF() && packet.payload.length < parsingSize) {
      var value;
      if (parsingType === 'STRING') {
        value = reader.stringNt();
      }
      else {
        value = reader.short();
      }
      packet.payload.push(value);
      debug('read %d of %d into payload', packet.payload.length, parsingSize);
    }

  }
  return packet;
};

Packet.prototype.validate = function () {

  if (valueOrParse(protocol.OPERANDS.STRING, this.sendType) === protocol.OPERANDS.STRING && this.sendSize === 0) {
    this.sendSize = this.payload.length;
    debug('send %d string(s)', this.sendSize);
  }

  if (valueOrParse(protocol.OPERANDS.STRING, this.reqType) === protocol.OPERANDS.STRING && this.reqSize === 0) {
    this.reqSize = this.payload.length;
    debug('req %d string(s)', this.reqSize);
  }
};


Packet.prototype.isResponse = function () {
  return this.flags.indexOf('RESPONSE') >= 0;
};

Packet.prototype.isRequest = function () {
  return this.reqType !== 'EMPTY';
};

Packet.prototype.isAck = function () {
  var isAck = true;
  if (this.isResponse() && this.flags.indexOf('NO_ACK') >= 0) {isAck = false;}
  return isAck;
};

Packet.prototype.hasPayload = function () {
  return this.payload.length > 0;
};

Packet.prototype.removeFlag = function (flag) {
  var index = this.flags.indexOf(flag);
  if (index >= 0) {
    this.flags = this.flags.splice(index, 1);
  }
};

Packet.prototype.addFlag = function (flag) {
  if (this.flags.indexOf(flag) === -1) {
    this.flags.push(flag);
  }
};

Packet.prototype.setResponse = function (state) {
  if (state) {
    this.addFlag('RESPONSE');
  }
  else  {
    this.removeFlag('RESPONSE');
  }
  debug('setResponse(%s)=%j', state, this.flags);
};


Packet.toBuffer = function (packet) {
  debug('toBuffer');
  var writer = new DataWriter(protocol.MAX_PACKET_SIZE);
  packet.validate();
  var sendType = valueOrParse(protocol.OPERANDS, packet.sendType);
  var reqType = valueOrParse(protocol.OPERANDS, packet.reqType);
  writer.byte(valueOrParse(protocol.FLAGS, packet.flags))
  .byte(packet.error)
  .short(packet.counter)
  .short(packet.index1)
  .byte(0)
  .byte(sendType)
  .short(packet.sendSize)
  .short(packet.sendOffset)
  .byte(0)
  .byte(reqType)
  .short(packet.reqSize)
  .short(packet.reqOffsetServer)
  .short(packet.reqOffsetClient);


  if (packet.payload.length > 0) {
    var isNumber = (typeof packet.payload[0] === 'number');
    packet.payload.forEach(function (p) {
      if (isNumber) {
        writer.short(p);
      }
      else {
        writer.stringNt(p);
      }
    });
    debug('payload written as %s', isNumber ? 'number' : 'string');
  }
  else {
    debug('no payload');
  }

  return writer.toBuffer();
};

function valueOrParse(list, value) {
  var newval = 0;
  if (typeof value === 'number') {
    return value;
  }
  else if (typeof value === 'string') {
    var values = value.split('|');
    values.forEach(function (v) {
      newval = newval | list[v];
    });
    debug('parsed value of `%s` to %d', value, newval);
    return newval;
  }
  else if (value instanceof Array) {
    values = value;
    values.forEach(function (v) {
      newval = newval | list[v];
    });
    debug('parsed value of `%s` to %d', value, newval);
    return newval;
  }
  else {
    debug('bad value', value);
    return 0;
  }
};
