/*!
 *  Copyright © 2011-2015 Peter Magnusson.
 *  All rights reserved.
 */
var debug = require('debug')('easyip:datawriter');

var DataWriter = module.exports = function (size) {
  this.buf = new Buffer(size || 512);
  this.buf.fill(0);
  this.offset = 0;
};

DataWriter.prototype.tell = function () {
  return this.offset;
};

DataWriter.prototype.buffer = function (v) {
  if (typeof v === 'undefined') {
    return this;
  }
  if (v instanceof DataWriter) {
    v = v.dump();
  }
  if (!(v instanceof Buffer)) {
    throw new Error('VariableError: not a buffer');
  }
  if (v.length > 0) {
    v.copy(this.buf, this.offset);
    this.offset += v.length;
  }
  return this;
};


DataWriter.prototype.seek = function (pos) {
  // debug('seek(%d)', pos);
  if (pos < 0) {
    throw new Error('Negative pos not allowed');
  }
  if (pos > this.buf.length) {
    debug('bad packet', this.buffer.toString('hex'));
    throw new Error(util.format('Cannot seek after EOF. %d > %d',
      pos, this.buf.length));
  }
  this.offset = pos;
  return this;
};

DataWriter.prototype.byte = function (v) {
  // debug('writing byte:', v);
  this.buf.writeUInt8(v, this.offset);
  this.offset += 1;
  return this;
};


DataWriter.prototype.short = function (v) {
  // debug('writing short:', v);
  this.buf.writeUInt16LE(v & 0xFFFF, this.offset);
  this.offset += 2;
  return this;
};

DataWriter.prototype.stringNt = function (v, encoding) {
  // debug('writing strintNt:', v);
  encoding = encoding || 'ascii';
  this.buf.write(v, this.tell(), v.length, encoding);
  this.offset += v.length;
  this.byte(0);
  return this;
};

DataWriter.prototype.slice = function (start, end) {
  return this.buf.slice(start, end);
};


DataWriter.prototype.toBuffer = function () {
  return this.slice(0, this.tell());
};
