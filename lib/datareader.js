/*!
 *  Copyright © 2011-2015 Peter Magnusson.
 *  All rights reserved.
 */
var debug = require('debug')('easyip:datareader');


var DataReader = module.exports = function DataReader(arg) {
  if (!(arg instanceof Buffer)) {
    debug('arg', arg);
    throw new Error('Expected instance of Buffer');
  }
  this.buffer = arg;
  this.length = this.buffer.length;
  debug('new consumer of %d bytes', this.length);
  this._offset = 0;


};

DataReader.prototype.tell = function () {
  return this._offset;
};

DataReader.prototype.seek = function (pos) {
  debug('seek(%d)', pos);
  if (pos < 0) {
    throw new Error('Negative pos not allowed');
  }
  if (pos > this.length) {
    debug('bad packet', this.buffer.toString('hex'));
    throw new Error(util.format('Cannot seek after EOF. %d > %d',
      pos, this.length));
  }
  this._offset = pos;
  return this;
};


DataReader.prototype.byte = function () {
  this._offset += 1;
  return this.buffer.readUInt8(this._offset - 1);
};


DataReader.prototype.short = function () {
  debug('reading short at %d of %d', this._offset, this.length);
  this._offset += 2;
  return this.buffer.readUInt16LE(this._offset - 2);
};

DataReader.prototype.stringNt = function (encoding) {
  encoding = encoding || 'utf8';
  var index = this.tell();
  var b = this.buffer.readUInt8(index++);
  while (b !== 0 && index < this.length) {
    b = this.buffer.readUInt8(index++);
  }
  var s = this.string(encoding, (index - this._offset) - 1);
  this._offset += 1;
  return s;
};

DataReader.prototype.string = function (encoding, length) {
  var end;
  var ret;

  if (length === undefined) {
    end = this.buffer.length;
  }
  else {
    end = this.tell() + length;
    // if (end > this.length) {
    //   throw new errors.MalformedPacket(
    //     'Trying to read past eof. Start=%d, End=%s, Length=%s',
    //     this.tell(), end, this.length);
    // }
  }

  if (!encoding) {
    encoding = 'utf8';
  }
  ret = this.buffer.toString(encoding, this._offset, end);
  debug('got a %s character string:', length, ret);
  this.seek(end);
  return ret;
};


DataReader.prototype.isEOF = function () {
  return this._offset >= this.length;
};
