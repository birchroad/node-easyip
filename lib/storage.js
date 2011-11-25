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
	var p = this.areas[operand][index];
	if(p !== value){
		this.emit("changing", operand, index, p, value);
	}
	this.areas[operand][index] = value;
	if(p!==value){
		this.emit("changed", operand, index, p, value);
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
