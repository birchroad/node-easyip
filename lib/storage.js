/*!
 *  Copyright © 2011-2015 Peter Magnusson.
 *  All rights reserved.
 */
var debug = require('debug')('easyip:storage');
var EventEmitter = require('events').EventEmitter
  , util = require('util');

var Storage = function() {
  this.areas = {};
  this.masks = {};
};

util.inherits(Storage, EventEmitter);

Storage.prototype.setMask = function(operand, index, mask) {
  if ( typeof(this.masks[operand]) === 'undefined') {
    this.masks[operand] = {};
  }
  this.masks[operand][index] = mask;
};

Storage.prototype.getMask = function(operand, index) {
  if (typeof(this.masks[operand]) !== 'undefined') {
    if (typeof(this.masks[operand][index]) === 'undefined') {
      this.setMask(operand, index, 65535);
    }
  }
  else {
    this.setMask(operand, index, 65535);
  }
  return this.masks[operand][index];
};

Storage.prototype.set = function(operand, index, value) {
  debug('storing %s:%s = %s', operand, index, value);
  var def = 0;
  if (operand === 'STRING') {
    def = '';
  }
  else {
    value = (value & this.getMask(operand, index));
  }


  if (typeof(this.areas[operand]) === 'undefined') {
    this.areas[operand] = {};
    this.areas[operand][index] = def;
  }
  var prev = this.areas[operand][index];
  if (prev !== value) {
    this.emit('changing', operand, index, prev, value);
  }
  this.areas[operand][index] = value;
  if (prev !== value) {
    this.emit('changed', operand, index, prev, value);
  }
  this.emit('set', operand, index, value);
};

Storage.prototype.get = function(operand, index) {
  var def = 0;
  if (operand === 'STRING') {
    def = '';
  }
  if (typeof(this.areas[operand]) === 'undefined') {
    return def;
  }
  if (typeof(this.areas[operand][index]) === 'undefined') {
    return def;
  }
  return this.areas[operand][index];
};


exports.Storage = Storage;
