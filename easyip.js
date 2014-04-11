/*!
 *  Copyright © 2011-2013 Peter Magnusson.
 *  All rights reserved.
 */
var dgram = require('dgram')
	, EventEmitter = require('events').EventEmitter
	, packets = require('./lib/packet')
	, Storage = require('./lib/storage').Storage
	, enums = require('./lib/enums')
	, util = require('util')
	, EasyField = require('./lib/easyfield');

var EASYIP_PORT=995;
var RESPONSE_TIMEOUT=200;

function isEmpty(dict) {
    for (var prop in dict) if (dict.hasOwnProperty(prop)) return false;
    return true;
};

/**
* The service constructor
* @param {Number} port number to bind the service to
*
*/
function Service(){
	EventEmitter.call(this);
	var m=this;
	this.storage = new Storage(); 
	this.counter = 0;
	var server = dgram.createSocket("udp4");
	m.server = server;
	var sendQueue = [];
	var request_dict = {};
	
	this._addReq = function(counter, address, callback){
		var msg = {message:'timeout', counter:counter, address:address};
		var timeout = setTimeout(function(counter){
			if(typeof(request_dict[counter].callback) !== 'undefined'){
				request_dict[counter].callback(msg);
			}
			m.emit("timeout", counter);
			m.emit("error", msg);
			delete request_dict[counter];
			m._sendQueue();
		}, RESPONSE_TIMEOUT, counter);
		request_dict[counter]={counter:counter, timer:timeout, callback:callback, address:address };
		this.emit('addReq', msg);
	};

	this._gotRes = function(packet, rinfo){
		try{
			clearTimeout(request_dict[packet.header.COUNTER].timer);
			//TODO:check if flags are RESPONSE or NO_ACK
			if(packet.isResponse() && packet.hasPayload()){
				//can't be anything else but a response to a request for data
				payloadToStorage(packet.payload, packet.payload_operand
					, packet.header.REQ_OFFSET_SERVER
					, packet.header.REQ_SIZE);
			}
			var fn = request_dict[packet.header.COUNTER].callback;
			if (typeof(fn) !== 'undefined'){
				fn(null, packet, rinfo);
			}				
			delete request_dict[packet.header.COUNTER];
			m.emit("response", packet, rinfo);
			m._sendQueue();
		}
		catch(err){
			//can not clear timer... this is some sort of error.
			m.emit("error", {message:'Error occured when taking care of the response', err:err, packet:packet});
		}	

		
	};

	this._addQueue = function(address, packet, callback){
		if(typeof(address)!='object') address={address:address, port:EASYIP_PORT};
		sendQueue.push({address:address, packet:packet, callback:callback});
		m._sendQueue();
	}//_addQueue

	this._sendQueue = function(){
		process.nextTick(function(){
			if ( sendQueue.length >0 && isEmpty(request_dict) ){
				var q = sendQueue.shift();
				var buf = new Buffer(20+3*q.packet.header.SEND_SIZE);
				var l = q.packet.packTo(buf, 0);
				m._addReq(q.packet.header.COUNTER, q.address, q.callback);
				m.server.send(buf, 0, l, q.address.port, q.address.address, function(err, sent){
					if(err){
						q.callback(err);
						return;
					}
				});
			}
		});
	}//_sendQueue

	server.on("message", function(msg, rinfo){
		var index, res, buf;
		var packet = packets.Packet.parse(msg);
		m.emit("message", packet, rinfo);
		var is_response = packet.isResponse();
		var is_acknowleged=packet.isAck();
		var is_request = packet.isRequest();
		var has_payload = packet.hasPayload(); //anything more then a header is payload
		//can not be a send and response packet at the same time but both can carry a payload
		if(is_response){
			//check the request queue for a match
			m._gotRes(packet, rinfo);
		}
		else if (is_request){
			//it's a request for something
			var offset = packet.header.REQ_OFFSET_SERVER;
			var operand = packet.header.REQ_TYPE;
			var payload = [];
			//get the payload from storage
			for(index=0; index < packet.header.REQ_SIZE; index++){
				payload.push(m.storage.get(operand, offset+index));
			}
			res = packets.Packet.parse(msg);
			res.setResponse(true);
			res.payload = payload;
			buf = new Buffer(80);
			var l = res.packTo(buf, 0);

			m.server.send(buf, 0, l, rinfo.port, rinfo.address);
			m.emit('request', packet, res, rinfo);
		}
		else{
			//someone sent some data
			if(! has_payload){
				m.emit("error", {message:'received a send request without payload', msg:msg, msg_length:msg.length, packet:packet});
				return;
			}
			payloadToStorage(packet.payload, packet.payload_operand
					, packet.header.SEND_OFFSET
					, packet.header.SEND_SIZE);

			res = packets.Packet.parse(msg);
			res.setResponse(true);
			res.payload=[];
			buf = new Buffer(20);
			res.packTo(buf, 0);
			m.server.send(buf, 0, 20, rinfo.port, rinfo.address);
			m.emit("send", packet, res, rinfo);
		}
	});


	server.on("listening", function () {
	  var address = server.address();
	  m.emit("listening", address);
	});

	server.on("close", function(){
		m.emit("close");
	});

	this.storage.on("changing", function(operand, index, from, to){
		m.emit("changing", operand, index, from, to);
	});

	this.storage.on("changed", function(operand, index, from, to){
		m.emit("changed", operand, index, from, to);
	});

	function payloadToStorage(payload, operand, offset, size){
		var index;
		for(index=0; index<size ;index++){
			m.storage.set(operand, offset+index, payload[index]);	
		}
	}
}

/**
* Inherit from EventEmitter
*/
util.inherits(Service, EventEmitter);

/**
*	Binds the service to a defined or default port
* if you don't run as root with the default port
* you will get a 'bind EACCES' error.
*
* @param {Number} Optional port number to bind to. default=EASYIP_PORT, 0 - gives a random port
*
* @api public
*/
Service.prototype.bind = function(bind_port){
	if(typeof(bind_port)==='undefined'){ bind_port = EASYIP_PORT;}
	this.bind_port = bind_port;
	this.server.bind(bind_port);
};

/**
*	Returns bound address and port 
*
* @api public
*/
Service.prototype.address = function(){
	//if not bound then this throws an error
	return this.server.address();
};


/**
* Generates next packet counter
*/
Service.prototype.getCounter = function(){
	this.counter += 1;
	if (this.counter > 65535){
		this.counter = 1;
	}
	return this.counter;
};


/*
* Shortcut for creating a EasyField
* 
* @api public
*/
Service.prototype.createField = function(op, setToActive){
	var activate = typeof(setToActive)!='undefined' ? setToActive : false;
	var f = new EasyField(op, this.storage);
	if(activate){
		f.setActive();
	}
	return f;
};


/**
* Request data from remote address and store in local storage
* @param {Object} {address:<address>, port:<number>}
* @param {Number} OPERANDS datatype to get from remote
* @param {Number} Start address at remote
* @param {Number} Number of values
* @param {Number} Where to start store the requested data locally
* @param {Function} Optional (err, response_packet) callback
*
* @api public
*/
Service.prototype.doRequest = function(address, operand, offset, size, local_offset, callback){
	var m = this;
	var p = new packets.Packet();
	var h = p.header;
	h.COUNTER = this.getCounter();
	h.REQ_TYPE=operand;
	h.REQ_SIZE=size;
	h.REQ_OFFSET_SERVER=offset;
	h.REQ_OFFSET_CLIENT=local_offset;
	this._addQueue(address, p, callback);
};


/**
* Send data from local storage to remote address.
* @param {Object}/{String} {address:<address>, port:<number>} / 'ipaddress or hostname'
* @param {Number} OPERANDS datatype to send from local storage
* @param {Number} Start address at remote
* @param {Number} Number of values
* @param {Number} Where to start fetching data from local storage
* @param {Function} Optional (err, response_packet) callback
*
* @callback (err, packet, rinfo)
*
* @api public
*/
Service.prototype.doSend = function(address, operand, offset, size, local_offset, callback){
	var m = this;
	var p = new packets.Packet();
	var h = p.header;
	var index;
	if(typeof(address)=='string'){
		address = {address:address, port:EASYIP_PORT};
	}
	h.COUNTER=this.getCounter();
	h.SEND_TYPE=operand;
	h.SEND_SIZE=size;
	h.SEND_OFFSET=offset;
	//TODO:Fix the rest
	var payload = [];
	//get the payload from storage
	for(index=0; index < size; index++){
		payload.push(m.storage.get(operand, local_offset+index));
	}
	p.payload=payload;
	this._addQueue(address, p, callback);
};


exports.VERSION='2.0.6';
exports.Service = Service;
exports.OPERANDS = enums.OPERANDS;
exports.FLAGS = enums.FLAGS;
exports.EASYIP_PORT = EASYIP_PORT;
exports.RESPONSE_TIMEOUT = RESPONSE_TIMEOUT;
