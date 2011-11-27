/*!
 *  Copyright © 2011 Peter Magnusson.
 *  All rights reserved.
 */
var OPERANDS = require('./enums').OPERANDS
	, EventEmitter = require('events').EventEmitter
	, util = require('util');

var Storage = function(){
	this.areas={};
};

util.inherits(Storage, EventEmitter);

Storage.prototype.set = function(operand, index, value){
	var def=0;
	if(operand===OPERANDS.STRING){
		def="";
	}

	if(typeof(this.areas[operand])==='undefined'){
		this.areas[operand] = {};
		this.areas[operand][index]=def;
	}
	var prev = this.areas[operand][index];
	if(prev !== value){
		this.emit("changing", operand, index, prev, value);
	}
	this.areas[operand][index] = value;
	if(prev!==value){
		this.emit("changed", operand, index, prev, value);
	}
};

Storage.prototype.get = function(operand, index){
	var def=0;
	if(operand===OPERANDS.STRING){
		def="";
	}
	if(typeof(this.areas[operand])==='undefined'){
		return def;
	}
	if(typeof(this.areas[operand][index])==='undefined'){
		return def;
	}
	return this.areas[operand][index];
};


exports.Storage = Storage;
