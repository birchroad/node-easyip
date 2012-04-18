/*!
 *  Copyright © 2011 Peter Magnusson.
 *  All rights reserved.
 */
var enums = require('./enums')
	, jspack = require('jspack').jspack;

var FLAGS = enums.FLAGS;
var FIELDS = enums.FIELDS;
var OPERANDS = enums.OPERANDS;
var HEADER_FORMAT='<B B H H B B H H B B H H H';
var HEADER_BYTE_SIZE=20;
var HEADER_FIELD_COUNT=13;
var BYTES_PER_WORD=2;

function checkBit(value, bit){
	return (value & bit)===bit;
}

function setBit(value, bit){
	return (value | bit);
}

function clearBit(value, bit){
	return (value & (~bit));
}

function repeat(pattern, count) {
    if (count < 1) {return '';}
    var result = '';
    while (count > 0) {
        if (count & 1) {result += pattern;}
        count >>= 1; pattern += pattern;
    }
    return result;
}

function payloadPattern(size){
	return '<' + repeat('H', size);
}

var Header = function(/*arguments*/){
	//defaults
	var index;
	for(index in FIELDS){
		if(FIELDS.hasOwnProperty(index)){
			this[index] = 0;
		}
	}
	if(arguments[0] instanceof Array){
		var arr = arguments[0];
		if(arr.length !== HEADER_FIELD_COUNT) {throw new Error("bad length of array " + arr.length);}
		for(index in FIELDS){
			if(FIELDS.hasOwnProperty(index)){
				this[index] = arr[FIELDS[index]];
			}
		}
	}
};

Header.parse = function(buf){
	header = jspack.Unpack(HEADER_FORMAT, buf, 0);
	return new Header(header);
};

Header.prototype.packTo = function(buf, startindex){
	var index;
	if(!Buffer.isBuffer(buf)){throw new TypeError("must be a buffer");}
	var a = [];
	for(index in FIELDS){
		if(FIELDS.hasOwnProperty(index)){
			var num = FIELDS[index];
			a[num] = this[index];		
		}
	}
	jspack.PackTo(HEADER_FORMAT, buf, startindex, a);
	return HEADER_BYTE_SIZE; 
};


var Packet = function(/*arguments*/){
	this.header = new Header();
	this._hasPayload = false;
	this.payload_operand=OPERANDS.EMPTY;

	if(arguments[0] instanceof Array){
		this.header = new Header(arguments[0]);
	}
};

//returns bytes put on buffer
Packet.prototype.packTo = function(buf, startindex){
	var bytes = this.header.packTo(buf, startindex);
	if(typeof(this.payload)!=="undefined"){
		var payload_size=this.payload.length;
		jspack.PackTo(payloadPattern(payload_size), buf, HEADER_BYTE_SIZE, this.payload);
		bytes += this.payload.length * BYTES_PER_WORD;	
	}
	return bytes;
};

Packet.prototype.isResponse = function(){
	return checkBit(this.header.FLAGS, FLAGS.RESPONSE);
};

Packet.prototype.isRequest = function(){
	return this.header.REQ_TYPE !== OPERANDS.EMPTY;
};

Packet.prototype.isAck = function(){
	var is_acknowleged=true;
	if(this.isResponse() && checkBit(this.header.FLAGS, FLAGS.NO_ACK)) { is_acknowleged=false; }
	return is_acknowleged;
};

Packet.prototype.hasPayload = function(){
	return this._hasPayload;
}

Packet.prototype.setResponse = function(state){
	if(state){
		this.header.FLAGS = setBit(this.header.FLAGS, FLAGS.RESPONSE);
	}
	else{
		this.header.FLAGS = clearBit(this.header.FLAGS, FLAGS.RESPONSE);
	}
};

Packet.parse = function(buf){
	var p = new Packet();
	p.header = Header.parse(buf);
	if(buf.length>HEADER_BYTE_SIZE){
		var payload_operand;
		var payload_size;
		//ok, got a payload then what type is it.
		if (p.isResponse()){
			//ok response, check in the right locations
			payload_operand = p.header.REQ_TYPE; 
			payload_size = p.header.REQ_SIZE;
		}
		else{
			payload_operand = p.header.SEND_TYPE;
			payload_size = p.header.SEND_SIZE;
		}

		if(typeof(payload_operand)==='undefined'){
			throw new ReferenceError("payload operand not found");
		}
		//set the instance operator
		p.payload_operand = payload_operand;
		
		//if we got this far, then its safe to say we got a payload
		p._hasPayload=true;

		if(payload_operand === OPERANDS.STRING){
			throw new Error("not implemented");
		}
		else{
			if(payload_size > (buf.length - HEADER_BYTE_SIZE)/BYTES_PER_WORD){
				throw new Error("wrong payload size");
			}
			p.payload = jspack.Unpack(payloadPattern(payload_size), buf, HEADER_BYTE_SIZE);
		}
	}
	return p;
};


exports.Packet = Packet;
exports.Header = Header;

