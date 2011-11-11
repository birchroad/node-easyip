/*!
 *  Copyright © 2011 Peter Magnusson.
 *  All rights reserved.
 */
var OPERANDS = require('./enums').OPERANDS;

var Storage = function(){
	this.areas={};
}

Storage.prototype.set = function(operand, index, value){
	if(typeof(this.areas[operand])=='undefined'){
		this.areas[operand] = [];
	}
	this.areas[operand][index] = value;
}

Storage.prototype.get = function(operand, index){
	var def=0;
	if(operand==OPERANDS.STRING){
		def="";
	}
	if(typeof(this.areas[operand])=='undefined'){
		return def;
	}
	if(typeof(this.areas[operand][index])=='undefined'){
		return def;
	}
	return this.areas[operand][index];
}

exports.Storage = Storage;