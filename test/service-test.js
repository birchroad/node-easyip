/*!
 *  Copyright © 2011 Peter Magnusson.
 *  All rights reserved.
 */
var vows = require('vows')
  , assert = require('assert');

var EventEmitter = require('events').EventEmitter
  ,easyip = require('../easyip')
  ,util = require('util');

vows.describe('Service').addBatch({
  'module':{
    topic:function(){
      return require('../easyip');
    },
    'has EASYIP_PORT':function(mod){
      assert.isObject(mod);
      assert.includes(mod, 'EASYIP_PORT');
    },
    'has Service constructor':function(mod){
      assert.isFunction(mod.Service);
    },
    'has OPERANDS': function(mod){
      assert.includes(mod, 'OPERANDS');
    },
    'new Service instance':{
      topic:function(mod){
        var s = new mod.Service();
        return s
      },
      'returns EventEmitter':function(obj){
        assert.instanceOf(obj, EventEmitter)
      },
      'has bind() function': function(obj){
        assert.isFunction(obj.bind);
      },
      'has address() function':function(obj){
        assert.isFunction(obj.address);
      },
      'has doSend() function':function(obj){
        assert.isFunction(obj.doSend);
      },
      'has doRequest() function':function(obj){
        assert.isFunction(obj.doRequest);
      },
      'listen for request': {
        topic:function(){
          var server = new easyip.Service();
          var f0 = server.createField('FW0');
          var f1 = server.createField('FW1');
          var f2 = server.createField('FW2');
          f0.value=10;
          f1.value=11;
          f2.value=12;
          server.bind(1000 + easyip.EASYIP_PORT);
                    
          var self = this;
          server.on('request', function(req, res, rinfo){
            self.callback(null, req, res, rinfo);
          });
        },
        'have the request':function(err, req, res, rinfo){
          assert.isObject(req);
        },
        'have the response':function(err, req, res, rinfo){  
          assert.isObject(res);
          assert.equal(util.inspect(res.payload), util.inspect([10,11,12]));
        },
      }, //listen for request
      'listen for send': {
        topic:function(){
          var server = new easyip.Service();
          server.bind(2000 + easyip.EASYIP_PORT); 
          var self = this;
          var t = setTimeout(function(){
            self.callback('timeout', null)
          }, 1000);
          server.on('send', function(packet){
            clearTimeout(t);
            self.callback(null, packet, server);
          });
        },
        'have the packet':function(err, packet, server){
          assert.isNull(err);
          assert.isObject(packet);
        },
        'have a payload':function(err, packet, server){
          assert.isNull(err);
          assert.includes(packet, 'payload');
          var p = packet.payload
          assert.equal(util.inspect(p), util.inspect([10,11,12]));
        },
        'was put in storage':function(err, packet, server){
          assert.equal(util.inspect(server.storage.areas[easyip.OPERANDS.FLAGWORD]), util.inspect({'0':10, '1':11, '2':12}));   
          
        }
      }, //listen for send
      'do request':{
        topic:function(obj){
          var self = this;
          obj.doRequest({address:'127.0.0.1', port:1000 + easyip.EASYIP_PORT}
            , easyip.OPERANDS.FLAGWORD
            , 0 //offset
            , 3 //size
            , 0 //local offset
            , this.callback
          );
        },
        'does not have err':function(err, packet){
          assert.isNull(err);
        },
        'have a packet':function(err, packet){
          assert.isObject(packet);
        }
      }, //do request
      'do send':{
        topic:function(){
          var server = new easyip.Service();
          var f0 = server.createField('FW0');
          var f1 = server.createField('FW1');
          var f2 = server.createField('FW2');
          f0.value=10;
          f1.value=11;
          f2.value=12;
          server.bind(0);

          var self = this;
          var t = setTimeout(function(){
            self.callback('timeout', null);
          }, 1000);
          server.doSend({address:'127.0.0.1', port:2000 + easyip.EASYIP_PORT}
            , easyip.OPERANDS.FLAGWORD
            , 0 //offset
            , 3 //size
            , 0 //local offset
            ,function(err, packet){
              clearTimeout(t);
              self.callback(err, packet); 
            }
          );
          
        },
        'does not have err':function(err, packet){
          assert.isNull(err);
        },
        'have a packet':function(err, packet){
          assert.isObject(packet);
          assert.equal(packet.header.FLAGS, easyip.FLAGS.RESPONSE);
        }
      } //do request
    } //created service
  } //module
  
}).export(module);