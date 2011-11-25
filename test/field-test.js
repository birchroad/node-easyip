var vows = require('vows')
	, assert = require('assert');

var enums = require('../lib/enums')
	, Storage = require('../lib/storage').Storage;

vows.describe('Fields').addBatch({
	'EasyField':{
		topic:function(){
			return require('../lib/field');
		},
		'can be required':function(EasyField){
			assert.isFunction(EasyField);
		},
		'with BIT op':{
			topic:function(EasyField){
				var st = new Storage();
				return new EasyField('F9000.14', st);
			},
			'has isBit':function(obj){
				assert.includes(obj, 'isBit');
				assert.isTrue(obj.isBit);
			},
			'has bitNum':function(obj){
				assert.includes(obj, 'bitNum')
				assert.equal(obj.bitNum, 14);
			},
			'has operand':function(obj){
				assert.includes(obj, 'operand');
				assert.equal(obj.operand, enums.OPERANDS.FLAGWORD);
			},
			'has index':function(obj){
				assert.includes(obj, 'index');
				assert.equal(obj.index, 9000);
			},
			'has value':function(obj){
				assert.includes(obj, '_value');
				assert.equal(obj.value, 0);
			},
			'has storage':function(obj){
				assert.includes(obj, 'storage');
				assert.isObject(obj.storage);
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
			'> WORD should fail':function(obj){
				assert.throws(function(){obj.value=70000;}, Error);
			},
			'can set value':function(obj){
				obj.value=65535;
				assert.equal(obj.value, 65535);
				assert.equal(obj.value.toString(2), '1111111111111111');
				assert.equal(obj.storage.get(enums.OPERANDS.FLAGWORD, 9100), 65535);
				//assert.equal(obj.storage.get(enum.OPERANDS.FLAGWORD, 9100), 3400);
			}
		},//word EasyField
	}
	
}).export(module);