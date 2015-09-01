/*!
 *  Copyright © 2011 Peter Magnusson.
 *  All rights reserved.
 */

/*
var vows = require('vows')
  , assert = require('assert');

var EventEmitter = require('events').EventEmitter
var easyip = require('../easyip');

var service = new easyip.Service();
service.on('response', function(packet, rinfo){
  console.log("got response for packet", packet.header.COUNTER);
});

var PLC_IP='192.168.1.91';

vows.describe('Service Live').addBatch({
  'Can bind':{
    topic:function(){
      var callback = this.callback;

      var t = setTimeout(function(){
        callback('timeout');
      }, 3000);

      service.on('listening',function(address){
        clearTimeout(t);
        callback(null, address);
      });
      var i;
      for(i=0; i<20;i++){
        service.storage.set(easyip.OPERANDS.FLAGWORD, i, i+1);
      }
      service.bind();
    },
    'listens on port EASYIP_PORT':function(err, address){
      assert.isNull(err);
      assert.isObject(address);
      console.log('listening on', address)
      assert.equal(address.port, easyip.EASYIP_PORT);
    },
    'and wait for a request':{
      topic:function(){
        var callback = this.callback;
        var t = setTimeout(function(){
          callback('timeout');
        },60000);

        service.on('request',function(packet, res, rinfo){
          clearTimeout(t);
          setTimeout(function(){
            callback(null, packet, res, rinfo);
          }, 500);

        });
      },
      'is not timeout':function(err, packet, res, rinfo){
        assert.isNull(err);
      },
      'have a request':function(err, packet, res, rinfo){
        assert.isObject(packet);
      },
      'have a response':function(err, packet, res, rinfo){
        assert.isObject(res);
      }
    }, //request
    'and send':{
      topic:function(){
        var callback = this.callback;
        service.doSend(PLC_IP, easyip.OPERANDS.FLAGWORD, 0, 5, 0, function(err, packet, rinfo){
          if(err)
            callback(err);
          else
            setTimeout(function(){
              callback(null, packet, rinfo);
            },500);
        });

      },
      'no errors':function(err, packet, rinfo){
        assert.isNull(err);
      },
      'with a ack response':function(err, packet, rinfo){
        assert.isObject(packet);
        assert.includes(packet, 'header');
        assert.isTrue(packet.isResponse());
        assert.isTrue(packet.isAck());
      },
      'to propper address':function(err, packet, rinfo){
        assert.isObject(rinfo);
        assert.includes(rinfo, 'address');
        assert.includes(rinfo, 'port');
        assert.equal(rinfo.port, easyip.EASYIP_PORT);
      },
    }//send
  } //bind

}).export(module);
*/
