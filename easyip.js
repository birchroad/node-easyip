var dgram = require('dgram')
	, EventEmitter = require('events').EventEmitter
	, Packet = require('./lib/packet').Packet
	, Storage = require('./lib/storage').Storage;

var EASYIP_PORT=995;


//The constructor
function Service(bind_port){
	EventEmitter.call(this);
	var m=this;
	this.storage = new Storage(); 

	var server = dgram.createSocket("udp4");
	

	
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

	this._addReq = function(counter, packet){
		var timeout = setTimeout(function(counter){
			//TODO:call callback with err set.
			delete request_dict[counter];
		}, 2000, counter)
		request_dict[counter]={counter:counter, timer=timeout }
	}

	this._gotRes = function(packet){
		var req_entry = request_dict[packet.counter]
		clearTimeout(req_entry.timer);
		//TODO:call callback with err=null
	}

	server.on("message", function(msg, rinfo){
		var packet = Packet(msg);
		var is_response = packet.isResponse();
		var is_acknowleged=packet.isAck();
		var is_request = packet.isRequest();
		var has_payload = msg.length > 20; //anything more then a header is payload
		
		//can not be a send and response packet at the same time but both can carry a payload
		if(is_response && has_payload){
			//can't be anything else but a response to a request for data
			var offset = packet.header.REQ_OFFSET_CLIENT;
			var operand = packet.payload_operand;
			for(var index=0; index<packet.header.REQ_SIZE ;index++){
				m.storage.set(operand, offset+index, packet.payload[index]);	
			}
		}
		else if (is_request){
			//it's a request for something
			var offset = packet.header.REQ_OFFSET_CLIENT;
			var operand = packet.header.REQ_TYPE;
			var payload = [];
			for(var index=0; index < packet.header.REQ_SIZE; index++){
				payload.push(m.storage.get(operand, offset+index));
			}
			//TODO: do something with the payload

			req.setFlags(FLAGS.RESPONSE_FLAG);

			//someone better process it
			m.emit('request', req, res);
		}
		else{
			//it's not a request
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
});


exports.createService = function(bind_port){
	return new Service(bind_port);
};

exports.EASYIP_PORT = EASYIP_PORT;