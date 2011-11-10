var dgram = require('dgram')
	, EventEmitter = require('events').EventEmitter
	, packets = require('./lib/packet')
	, Storage = require('./lib/storage').Storage
	, enums = require('./lib/enums');

var EASYIP_PORT=995;


//The constructor
function Service(bind_port){
	EventEmitter.call(this);
	var m=this;
	this.storage = new Storage(); 
	this.counter = 0;
	var server = dgram.createSocket("udp4");
	m.server = server;

	
	var request_dict = {}
	// this.setData = function(type, offset, size, payload, rinfo){
	// 	var values;
	// 	if (type==OPERANDS.OPERAND_STRING){
	// 		str = payload.toString('ascii', 0);
	// 		values = str.split("\0");
	// 	}
	// 	else{
	// 		fmt = '<' + _repeat('H', size);
	// 		values = jspack.Unpack(fmt, payload);
	// 	}

	// 	this.emit('set', type, offset, size, values, rinfo);
	// };

	this._addReq = function(counter, callback){
		var timeout = setTimeout(function(counter){
			request_dict[counter].callback({counter:counter, message:"timeout"});
			m.emit("request timeout", counter);
			delete request_dict[counter];
		}, 1000, counter);
		request_dict[counter]={counter:counter, timer:timeout, callback:callback };
	}

	this._gotRes = function(packet){
		clearTimeout(request_dict[packet.header.COUNTER].timer);
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
				var offset = packet.header.REQ_OFFSET_CLIENT;
				var operand = packet.payload_operand;
				for(var index=0; index<packet.header.REQ_SIZE ;index++){
					m.storage.set(operand, offset+index, packet.payload[index]);	
				}
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
			m.emit('request', packet, res);
		}
		else{
			if(! has_payload){
				throw new Error('must have a payload');
			}
			var res = packets.Packet.parse(msg);
			res.setResponse(true);
			res.payload=[];
			var buf = new Buffer(20);
			res.packTo(buf, 0);
			m.server.send(buf, 0, 20, rinfo.port, rinfo.address);
			m.emit("send", packet, res);
		}
	});


	server.on("listening", function () {
	  var address = server.address();
	  m.emit("listening", address);
	  console.log("easyip service listening on " +
	      address.address + ":" + address.port);
	});

	server.bind(bind_port);
};

Service.super_ = EventEmitter;
Service.prototype = Object.create(EventEmitter.prototype, {
	constructor: {
		value: Service,
		enumerable: false
	}
});

Service.prototype.address = function(){
	return this.server.address();
}

Service.prototype.getCounter = function(){
	this.counter += 1;
	return this.counter;
}

Service.prototype.__defineGetter__('flagwords', function(){
	var data =  this.storage.areas[enums.OPERANDS.FLAGWORD];
	if (typeof(data)=='undefined'){
		this.storage.areas[enums.OPERANDS.FLAGWORD]=[];
	}
	return this.storage.areas[enums.OPERANDS.FLAGWORD];
});


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
	//TODO:callback on send....
	this.server.send(buf, 0, buf.length, address.port, address.address, function(err, sent){
		if(err){
			callback(err);
			return;
		} 
		m._addReq(h.COUNTER, callback);	
	});
}

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


exports.createService = function(bind_port){
	//if(typeof(bind_port)=='undefined') bind_port = EASYIP_PORT;
	return new Service(bind_port);
};

exports.OPERANDS = enums.OPERANDS;
exports.FLAGS = enums.FLAGS;
exports.EASYIP_PORT = EASYIP_PORT;