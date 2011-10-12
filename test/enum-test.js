var vows = require('vows')
	, assert = require('assert');


vows.describe('enums').addBatch({
	'enums':{
		topic:function(){
			return require('../lib/enums');
		},
		'has FIELDS':function(mod){
			assert.isObject(mod);
			assert.includes(mod, 'FIELDS');
			assert.isObject(mod.FIELDS);
		},
		'with FIELDS':{
			topic:function(mod){
				return mod.FIELDS;
			},
			'has flags':function(obj){
				assert.includes(obj, 'FLAGS');
			},
			'is frozen':function(obj){
				obj.FLAGS=13;
				assert.equal(obj.FLAGS, 0);
			},
			'enumerates 13 number of fields':function(obj){
				var count=0;
				for(var index in obj){
					count++;
				}
				assert.equal(count, 13);
			},
		}
	}
	
}).export(module);