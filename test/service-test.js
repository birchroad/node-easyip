/*!
 *  Copyright © 2011 Peter Magnusson.
 *  All rights reserved.
 */
var vows = require('vows')
  , assert = require('assert');

var EventEmitter = require('events').EventEmitter
var easyip = require('../easyip');

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
    'createdService':{
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
          server.bind(1000 + easyip.EASYIP_PORT);
          server.flagwords[0]=10;
          server.flagwords[1]=11;
          server.flagwords[2]=12;          
          var self = this;
          server.on('request', function(req, res){
            self.callback(null, req, res);
          });
        },
        'have the request':function(err, req, res){
          assert.isObject(req);
        },
        'have the response':function(err, req, res){  
          assert.isObject(res);
          assert.equal(res.payload.inspect, [10,11,12].inspect);
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
          assert.equal(p.inspect, [10,11,12].inspect);
        },
        'was put in storage':function(err, packet, server){
          assert.equal(server.flagwords.inspect, [10,11,12].inspect);          
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
        topic:function(obj){
          var self = this;
          var t = setTimeout(function(){
            self.callback('timeout', null);
          }, 1000);
          obj.doSend({address:'127.0.0.1', port:2000 + easyip.EASYIP_PORT}
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