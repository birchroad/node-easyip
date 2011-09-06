var dgram = require('dgram'), 
	EventEmitter = require('events').EventEmitter,
	jspack = require('jspack').jspack;


var EASYIP_PORT=995;
var HEADER_FORMAT='<B B H H B B H H B B H H H';

var FLAGS = function (){
	throw new Error();
}

FLAGS.prototype = { 
	EMPTY_FLAG: 0,
    BIT_OR_FLAG: 0x2,
    BIT_AND_FLAG: 0x4,
    NO_ACK_FLAG: 0x40,
    RESPONSE_FLAG: 0x80
};

var	FLAGS_FIELD=0,
	ERROR_FIELD=1,
	COUNTER_FIELD=2,
	SEND_TYPE_FIELD= 5,
	SEND_SIZE_FIELD= 6,
	SEND_OFFSET_FIELD= 7,
	REQ_TYPE_FIELD= 9,
	REQ_SIZE_FIELD=10,
	REQ_OFFSET_SERVER_FIELD=11,
	REQ_OFFSET_CLIENT_FIELD=12;

var OPERANDS = function(){throw new Error();}
OPERANDS.prototype = {
	OPERAND_EMPTY: 0, 
	OPERAND_STRING: 11
}


function checkBit(value, bit){
	return (value & bit)==bit;
}

function _repeat(pattern, count) {
    if (count < 1) return '';
    var result = '';
    while (count > 0) {
        if (count & 1) result += pattern;
        count >>= 1, pattern += pattern;
    };
    return result;
};


function Packet(server, msg, rinfo){
	var header = header;
	var m = this;
	var server = server;
	var flags = header[FLAGS_FIELD];
	var send_type = header[SEND_TYPE_FIELD];
	var req_type = header[REQ_TYPE_FIELD];
	var req_size = header[REQ_SIZE_FIELD];
	var offset = header[REQ_OFFSET_SERVER_FIELD];
	var payload=null;


	this.setPayload = function(type, value){		
		if (type == OPERANDS.OPERAND_STRING){
			payload = new Buffer(value.length+1)
			payload.write(value + "\0", 0, 'ascii');
		}
		else{	
			//Turn the array into a row of 16-bit words with the correct endian
			//TODO:Check that value is an array
			payload = new Buffer(jspack.Pack('<' + _repeat('H', size), value));
		}	
	};

	this.end = function(callback){
		header[FLAGS_FIELD]=flags;
		var response_size = (payload!=null?payload.length + 20:20);
		var buf = new Buffer(response_size);

		jspack.PackTo(HEADER_FORMAT, buf, 0, header);
		if (payload != null){
			payload.copy(buf, 20);
		}

		jspack.PackTo(HEADER_FORMAT, buf, 0, header);
		server.send(buf, 0, buf.length, 
			rinfo.port, rinfo.address,
			callback);
	};
}


//The constructor
function Service(bind_port){
	EventEmitter.call(this);
	var server = dgram.createSocket("udp4");
	var m=this;
	
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


	server.on("message", function(msg, rinfo){
		var header = jspack.Unpack(HEADER_FORMAT, msg, 0);
		var flags = header[FLAGS_FIELD]; //get the header
		var packet = new Packet(server, header, rinfo);
				
		var is_response = checkBit(packet.flags, FLAGS.RESPONSE_FLAG);
		var is_acknowleged=true;
		if(is_response && checkBit(packet.flags, FLAGS.NO_ACK_FLAG)) { is_acknowleged=false; }
		var is_request = packet.req_type != OPERANDS.OPERAND_EMPTY;
		var has_payload = msg.length > 20; //anything more then a header is payload
		
		//can not be a send and response packet at the same time but both can carry a payload
		if(is_response && has_payload){
			//can't be anything else but a response to a request for data

		}

		// (packet.send_type != OPERAND_EMPTY);

		// if(!has_payload && 
		
		// m.emit('message', packet, operand, payload)

	     
		if (is_request){
			//it's a request for something
			console.log("req");
			req.setFlags(FLAGS.RESPONSE_FLAG);
			console.log("emit");
			m.emit('request', req, res);
		}
		else{
			//no need for waiting for user to do error checking
			var req = new Packet(server, header, rinfo);
			req.setFlags(FLAGS.RESPONSE_FLAG);
			req.end(function(err,bytes){
				//TODO:do something about errors here perhaps..?
			});
		}
	});


	server.on("listening", function () {
	  var address = server.address();
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
})

exports.createService = function(bind_port){
	return new Service(bind_port);
};
exports.FLAGS = FLAGS;
exports.OPERANDS = OPERANDS;
exports.EASYIP_PORT = EASYIP_PORT;