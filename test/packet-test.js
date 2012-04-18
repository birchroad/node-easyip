var vows = require('vows')
	, assert = require('assert');

var enums = require('../lib/enums');

var word_payload = new Buffer([255,0]);
var target_header = new Buffer([enums.FLAGS.RESPONSE, 2, 3, 0, 4, 0, 5, 6, 7, 0, 8, 0, 9, enums.OPERANDS.FLAGWORD, word_payload.length/2, 0, 12, 0, 13, 00]);
var target_header_array = [enums.FLAGS.RESPONSE,2,3,4,5,6,7,8,9,enums.OPERANDS.FLAGWORD,word_payload.length/2,12,13];


vows.describe('packet').addBatch({
	'packet module':{
		topic:function(){
			return require('../lib/packet');
		},
		'has Header':function(mod){
			assert.isObject(mod);
			assert.includes(mod, 'Header');
			assert.isFunction(mod.Header);
			assert.isFunction(mod.Header.parse);
		},
		'new Header()':{
			topic:function(mod){
				return new mod.Header();
			},
			'is an object with header properties':function(header){
				assert.isObject(header);
				var count=0;
				for(var index in enums.FIELDS){
					assert.includes(header, index);
					count++;	
				}
				assert.equal(count, 13);
				
			},
			

		},
		'new Header(array)':{
			topic:function(mod){
				return new mod.Header(target_header_array);
			},
			'correct data in fields': function(header){
				//console.log(header);
				for(var index in enums.FIELDS){
					var num = enums.FIELDS[index];
					assert.includes(header, index);
					assert.equal(header[index], target_header_array[num]);
						
				}
			},
			'can pack to a buffer':function(header){
				
				var buf = new Buffer(20);
				header.packTo(buf, 0);
				assert.equal(buf.length, 20);
				for(var i=0;i<target_header.length;i++){
					assert.equal(buf[i], target_header[i]);
				}
			}
		},
		'Header.parse':{
			topic:function(mod){
				return mod.Header.parse(target_header);	
			},
			'parsed ok':function(header){
				for(var index in enums.FIELDS){
					var num = enums.FIELDS[index];
					assert.includes(header, index);
					assert.equal(header[index], target_header_array[num]);		
				}
			}
		},
		'has Packet':{
			topic:function(mod){
				this.callback(new mod.Packet(), mod);
			},
			'has functions': function(packet, mod){
				assert.isFunction(packet.packTo);
				assert.isFunction(packet.setResponse);
				assert.isFunction(packet.isResponse);
				assert.isFunction(packet.isAck);
				assert.isFunction(packet.isRequest);
				assert.isFunction(packet.hasPayload);
				//statics
				assert.isFunction(mod.Packet.parse);	
			},
			'which includes a Header':function(packet, mod){
				assert.includes(packet, 'header');
				assert.instanceOf(packet.header, mod.Header);
			},
			'check for isResponse':function(packet, mod){
				assert.isFunction(packet.isResponse);
				assert.isFalse(packet.isResponse());
			},
			'set response':function(packet, mod){
				assert.isFalse(packet.isResponse());
				packet.setResponse(true);
				assert.isTrue(packet.isResponse());
				packet.setResponse(false);
				assert.isFalse(packet.isResponse());
				//false again
				packet.setResponse(false);
				assert.isFalse(packet.isResponse());	
			}
		},
		'parse Packet':{
			topic:function(mod){
				var buf = new Buffer(target_header.length + word_payload.length);
				target_header.copy(buf);
				word_payload.copy(buf, 20);
				return mod.Packet.parse(buf);
			},
			'word payload':function(packet){
				assert.isObject(packet);
				assert.equal(packet.payload.length, 1);
				assert.equal(packet.payload[0], 255);
			},
			'hasPayload()':function(packet){
				assert.isTrue(packet.hasPayload());
			}
		},
		'packet.packTo':{
			topic:function(mod){
				var packet = new mod.Packet(target_header_array);
				packet.payload = [255];
				return packet;
			},
			'do it':function(packet){
				var buf = new Buffer(25);
				var bytes = packet.packTo(buf, 0);
				//console.log(buf);
				for(var index in enums.FIELDS){
					var num = enums.FIELDS[index];
					assert.includes(packet.header, index);
					assert.equal(packet.header[index], target_header_array[num]);		
				}
				for(var i=0;i<target_header.length;i++){
					assert.equal(buf[i], target_header[i]);
				}
				//validate payload somehow
				assert.equal(bytes, 20+2);
				assert.equal(buf[20], 255);
				assert.equal(buf[21], 0);	
			}
		}
	}
	
}).export(module);