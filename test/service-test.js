/*!
 *  Copyright © 2011 Peter Magnusson.
 *  All rights reserved.
 */
// var vows = require('vows')
//   , assert = require('assert');

var expect = require('chai').expect;

var EventEmitter = require('events').EventEmitter
  ,easyip = require('../');


describe('Service', function () {
  // it('should have EASYIP_PORT', function (done) {
  //   expect(easyip.EASYIP_PORT).to.equal(995);
  //   done();
  // });

  it('should be able to create new instance', function (done) {
    var s = new easyip.Service();
    expect(s).to.be.instanceof(EventEmitter);
    expect(s).to.be.instanceof(easyip.Service);
    expect(s.bind).to.be.a('function');
    expect(s.address).to.be.a('function');
    expect(s.doSend).to.be.a('function');
    done();
  });

  describe('listen for request', function () {
    var server, f0, f1, f2;
    before(function (done) {
      server = new easyip.Service();
      f0 = server.createField('FW0');
      f1 = server.createField('FW1');
      f2 = server.createField('FW2');
      f0.value = 10;
      f1.value = 11;
      f2.value = 12;
      server.bind(easyip.EASYIP_PORT);

      server.on('listening', function () {
        done();
      });
    });

    it('should emit request', function (done) {
      var tasks = 2;
      server.once('request', function (req, res) {
        expect(req).to.be.a('object');
        expect(res).to.be.a('object');
        expect(res.payload).to.eql([10,11,12]);
        checkDone();
      });

      server.doRequest('127.0.0.1', 'FLAGWORD', 0, 3, 4, function (err, packet) {
        expect(err).to.not.exist;
        expect(packet).to.exist;
        checkDone();
      });

      function checkDone() {
        tasks -= 1;
        if (tasks <= 0) {
          done();
        }
      }


    });

  });

});
