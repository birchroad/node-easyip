var vows = require('vows')
	, assert = require('assert');


vows.describe('bits').addBatch({
	'bits':{
		topic:function(){
			return require('../lib/bits');
		},
		'has 3 methods':function(mod){
			assert.isObject(mod);
			assert.includes(mod, 'checkBit');
			assert.isFunction(mod.checkBit);
			assert.isFunction(mod.setBit);
			assert.isFunction(mod.clearBit);
		},
		'0->1':function(mod){
			assert.equal(mod.setBit(1,7), 129);
		},
		'1->0':function(mod){
			assert.equal(mod.clearBit(129,0), 128);
		},
		'can check a 1 bit':function(mod){
			assert.equal(mod.checkBit(129,0), 1);
		},
		'can check a 0 bit':function(mod){
			assert.equal(mod.checkBit(129,2), 0);
		},
		'test bit 14 from':function(mod){
			var val = 16384;
			assert.equal(val.toString(2), '100000000000000');
			assert.equal(mod.checkBit(val, 13), 0);
			assert.equal(mod.checkBit(val, 14), 1);
			
		},
		'set and check bit':function(mod){
			var val = mod.setBit(0, 14);
			assert.equal(val, 16384);
			assert.equal(val.toString(2), '100000000000000');
			assert.isNumber(val);
			assert.equal(mod.checkBit(val, 14), 1);
		}
	}

	
}).export(module);