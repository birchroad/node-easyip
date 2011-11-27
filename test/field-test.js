var vows = require('vows')
	, assert = require('assert');

var enums = require('../lib/enums')
	, Storage = require('../lib/storage').Storage
	, EventEmitter = require('events').EventEmitter;


var Class;

vows.describe('Fields').addBatch({
	'EasyField':{
		topic:function(){
			Class = require('../lib/easyfield');
			return Class;
		},
		'can be required':function(EasyField){
			assert.isFunction(EasyField);
		},
		'common instance methods and properties':{
			topic:function(EasyField){
				return new EasyField('F1.1', new Storage());
			},
			'instance of EasyField':function(obj){
				assert.instanceOf(obj, Class);
			},
			'instance of EventEmitter':function(obj){
				assert.instanceOf(obj, EventEmitter);
			},
			'has isBit':function(obj){
				assert.includes(obj, 'isBit');
			},
			'has operand':function(obj){
				assert.includes(obj, 'operand');
				assert.equal(obj.operand, enums.OPERANDS.FLAGWORD);
			},
			'has index':function(obj){
				assert.includes(obj, 'index');				
			},
			'has value':function(obj){
				assert.includes(obj, '_value');
				assert.equal(obj.value, 0);
			},
			'has storage':function(obj){
				assert.includes(obj, 'storage');
				assert.isObject(obj.storage);
			},
			'has setActive':function(obj){
				assert.isFunction(obj.setActive);
			},
			'has .on':function(obj){
				assert.isFunction(obj.on);
			},
		},
		'with BIT op':{
			topic:function(EasyField){
				var st = new Storage();
				return new EasyField('F9000.14', st);
			},
			'isBit':function(obj){
				assert.isTrue(obj.isBit);
			},
			'has bitNum':function(obj){
				assert.includes(obj, 'bitNum')
				assert.equal(obj.bitNum, 14);
			},
			'has index':function(obj){
				assert.includes(obj, 'index');
				assert.equal(obj.index, 9000);
			},
			'bit != 0 || 1 should fail':function(obj){
				assert.throws(function(){
					obj.value=2;
				}, Error);
				assert.throws(function(){
					obj.value=-1;
				},Error);
			},
			'setting value=1':{
				'topic':function(obj){
					obj.value=1;
					return obj;
				},
				'bit was changed':function(obj){
					//console.log(obj._value, obj.storage);
					assert.equal(obj.value, 1);
					assert.equal(obj.storage.get(enums.OPERANDS.FLAGWORD, 9000), 16384);
				}
			}//setting bits
		},//bit EasyField
		'with WORD op':{
			topic:function(EasyField){
				var st = new Storage();
				return new EasyField('FW9100', st);
			},
			'has isBit':function(obj){
				assert.includes(obj, 'isBit');
				assert.isFalse(obj.isBit);
			},
			'has bitNum':function(obj){
				assert.includes(obj, 'bitNum')
				assert.equal(obj.bitNum, -1);
			},
			'has operand':function(obj){
				assert.includes(obj, 'operand');
				assert.equal(obj.operand, enums.OPERANDS.FLAGWORD);
			},
			'has index':function(obj){
				assert.includes(obj, 'index');
				assert.equal(obj.index, 9100);
			},
			// 'have bit manipulation functions':function(obj){
			// 	assert.isFunction(obj.setBit);
			// 	assert.isFunction(obj.getBit);
			// 	assert.isFunction(obj.checkBit);
			// },
			'> WORD should fail':function(obj){
				assert.throws(function(){obj.value=70000;}, Error);
			},
			'can set value':function(obj){
				obj.value=65535;
				assert.equal(obj.value, 65535);
				assert.equal(obj.value.toString(2), '1111111111111111');
				assert.equal(obj.storage.get(enums.OPERANDS.FLAGWORD, 9100), 65535);
				//assert.equal(obj.storage.get(enum.OPERANDS.FLAGWORD, 9100), 3400);
			},
			'can do bit manipulation':function(obj){
				obj.value=0;
				obj.setBit(0);
				assert.equal(obj.value, 1);
				obj.setBit(1);
				assert.equal(obj.value, 3);
			},
		},//word EasyField
		'emit changed word':{
			'topic':function(EasyField){
				var fn = this.callback;
				var st = new Storage();
				var f = new EasyField('FW10', st);
				f.on('changed', function(sender, pv, cv){
					fn(null, sender, pv, cv)
				});
				f.setActive();
				st.set(enums.OPERANDS.FLAGWORD, 10, 20);
			},
			'triggered':function(err, sender, pv, cv){
				assert.isTrue(pv !== cv);
				assert.equal(cv, 20);
				assert.equal(sender.storage.get(enums.OPERANDS.FLAGWORD, 10), 20);
				
			}
		},//emit changed word
		'emit changed bit':{
			'topic':function(EasyField){
				var fn = this.callback;
				var st = new Storage();
				var f = new EasyField('F10.4', st);
				f.on('changed', function(sender, pv, cv){
					fn(null, sender, pv, cv)
				});
				f.setActive();
				st.set(enums.OPERANDS.FLAGWORD, 10, 16);
			},
			'triggered':function(err, sender, pv, cv){
				assert.isTrue(pv !== cv);
				assert.equal(cv, 1);
				//bit 4 = 16 dec
				assert.equal(sender.storage.get(enums.OPERANDS.FLAGWORD, 10), 16);
				
			}
		}//emit changed word
	}
	
}).export(module);