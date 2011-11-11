/*!
 *  Copyright © 2011 Peter Magnusson.
 *  All rights reserved.
 */
var dgram = require('dgram')
	, EventEmitter = require('events').EventEmitter
	, packets = require('./lib/packet')
	, Storage = require('./lib/storage').Storage
	, enums = require('./lib/enums');

var EASYIP_PORT=995;


/**
* The service constructor
* @param {Number} port number to bind the service to
*
*/
function Service(bind_port){
	EventEmitter.call(this);
	var m=this;
	this.storage = new Storage(); 
	this.counter = 0;
	var server = dgram.createSocket("udp4");
	m.server = server;

	
	var request_dict = {}
	
	this._addReq = function(counter, callback){
		var timeout = setTimeout(function(counter){
			request_dict[counter].callback({counter:counter, message:"timeout"});
			m.emit("timeout", counter);
			delete request_dict[counter];
		}, 1000, counter);
		request_dict[counter]={counter:counter, timer:timeout, callback:callback };
	}

	this._gotRes = function(packet){
		clearTimeout(request_dict[packet.header.COUNTER].timer);
		//TODO:check if flags are RESPONSE or NO_ACK
		var fn = request_dict[packet.header.COUNTER].callback;
		if (typeof(fn)!='undefined'){
			fn(null, packet);
		}				
		delete request_dict[packet.header.COUNTER]
	}

	server.on("message", function(msg, rinfo){
		var packet = packets.Packet.parse(msg);
		var is_response = packet.isResponse();
		var is_acknowleged=packet.isAck();
		var is_request = packet.isRequest();
		var has_payload = msg.length > 20; //anything more then a header is payload
		//can not be a send and response packet at the same time but both can carry a payload
		if(is_response){
			if(has_payload){
				//can't be anything else but a response to a request for data
				payloadToStorage(packet.payload, packet.payload_operand
					, packet.header.REQ_OFFSET_CLIENT
					, packet.header.REQ_SIZE);
			}
			m._gotRes(packet);
		}
		else if (is_request){
			//it's a request for something
			var offset = packet.header.REQ_OFFSET_CLIENT;
			var operand = packet.header.REQ_TYPE;
			var payload = [];
			//get the payload from storage
			for(var index=0; index < packet.header.REQ_SIZE; index++){
				payload.push(m.storage.get(operand, offset+index));
			}
			var res = packets.Packet.parse(msg);
			res.setResponse(true);
			res.payload = payload;
			var buf = new Buffer(80);
			var l = res.packTo(buf, 0);

			m.server.send(buf, 0, l, rinfo.port, rinfo.address);
			m.emit('request', packet, res, rinfo);
		}
		else{
			if(! has_payload){
				throw new Error('must have a payload');
			}
			payloadToStorage(packet.payload, packet.payload_operand
					, packet.header.SEND_OFFSET
					, packet.header.SEND_SIZE);

			var res = packets.Packet.parse(msg);
			res.setResponse(true);
			res.payload=[];
			var buf = new Buffer(20);
			res.packTo(buf, 0);
			m.server.send(buf, 0, 20, rinfo.port, rinfo.address);
			m.emit("send", packet, res, rinfo);
		}
	});


	server.on("listening", function () {
	  var address = server.address();
	  m.emit("listening", address);
	  console.log("easyip service listening on " +
	      address.address + ":" + address.port);
	});

	function payloadToStorage(payload, operand, offset, size){
		for(var index=0; index<size ;index++){
			m.storage.set(operand, offset+index, payload[index]);	
		}
	}

	server.bind(bind_port);
};


//Service.prototype.__proto__ = EventEmitter.prototype;
Service.super_ = EventEmitter;
Service.prototype = Object.create(EventEmitter.prototype, {
	constructor: {
		value: Service,
		enumerable: false
	}
});


/**
*	Returns bound address and port 
*
* @api public
*/
Service.prototype.address = function(){
	return this.server.address();
}


/**
* Generates next packet counter
*/
Service.prototype.getCounter = function(){
	this.counter += 1;
	return this.counter;
}


/*
* Shortcut for the FLAGWORD storage array
* 
* @api public
*/
Service.prototype.__defineGetter__('flagwords', function(){
	var data =  this.storage.areas[enums.OPERANDS.FLAGWORD];
	if (typeof(data)=='undefined'){
		this.storage.areas[enums.OPERANDS.FLAGWORD]=[];
	}
	return this.storage.areas[enums.OPERANDS.FLAGWORD];
});


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
	var h = new packets.Header();
	h.COUNTER = this.getCounter();
	h.REQ_TYPE=operand;
	h.REQ_SIZE=size;
	h.REQ_OFFSET_SERVER=offset;
	h.REQ_OFFSET_CLIENT=local_offset;
	var buf = new Buffer(20);
	h.packTo(buf, 0);
	this.server.send(buf, 0, buf.length, address.port, address.address, function(err, sent){
		if(err){
			callback(err);
			return;
		} 
		m._addReq(h.COUNTER, callback);	
	});
}


/**
* Send data from local storage to remote address.
* @param {Object} {address:<address>, port:<number>}
* @param {Number} OPERANDS datatype to send from local storage
* @param {Number} Start address at remote
* @param {Number} Number of values
* @param {Number} Where to start fetching data from local storage
* @param {Function} Optional (err, response_packet) callback
*
* @api public
*/
Service.prototype.doSend = function(address, operand, offset, size, local_offset, callback){
	var m = this;
	var p = new packets.Packet();
	var h = p.header;
	h.COUNTER=this.getCounter();
	h.SEND_TYPE=operand;
	h.SEND_SIZE=size;
	h.SEND_OFFSET=offset;
	//TODO:Fix the rest
	var payload = [];
	//get the payload from storage
	for(var index=0; index < size; index++){
		payload.push(m.storage.get(operand, local_offset+index));
	}
	p.payload=payload;

	var buf = new Buffer(20+3*size);
	var l = p.packTo(buf, 0);
	this.server.send(buf, 0, l, address.port, address.address, function(err, sent){
		if(err){
			callback(err);
			return;
		}
		m._addReq(h.COUNTER, callback);
	});
}

/**
* bind_port = 0 - gives a random port
* undefined tries to use the EASYIP_PORT or < 1024 and if not run as root
* you will get a 'bind EACCES' error.
* @param {Number} Optional port number to bind to 
*
* @api public
*/
exports.createService = function(bind_port){
	if(typeof(bind_port)=='undefined') bind_port = EASYIP_PORT;
	return new Service(bind_port);
};

exports.OPERANDS = enums.OPERANDS;
exports.FLAGS = enums.FLAGS;
exports.EASYIP_PORT = EASYIP_PORT;
