// var vows = require('vows')
//  , assert = require('assert');
var expect = require('chai').expect;

var Storage = require('../lib/storage').Storage
  , EventEmitter = require('events').EventEmitter;

var EasyField = require('../lib/easyfield');

describe('EasyField', function () {

  it('should have common instance methods and properties', function () {
    var obj = new EasyField('F1.1', new Storage());
    expect(obj).to.be.instanceof(EasyField);
    expect(obj).to.be.instanceof(EventEmitter);
    expect(obj).to.include.keys('isBit', 'operand', 'index', '_value', 'storage');
    expect(obj.setActive).to.be.a('function');
    expect(obj.on).to.be.a('function');
    expect(obj.operand).to.equal('FLAGWORD');
    expect(obj._value).to.equal(0);
  });

  describe('with BIT op - F9000.14', function () {
    var st = new Storage();
    var obj = new EasyField('F9000.14', st);

    it('should be a bit', function () {
      expect(obj.isBit).to.be.ok;
    });

    it('should have bitNum', function () {
      expect(obj.bitNum).to.equal(14);
    });

    it('should have index', function () {
      expect(obj.index).to.equal(9000);
    });

    it('bit != 0 || 1 should fail', function () {
      expect(function () {
        obj.value = 2;
      }).to.throw(Error);

      expect(function () {
        obj.value = -1;
      }).to.throw(Error);
    });

    describe('setting value = 1', function () {
      before(function () {
        obj.value = 1;
      });

      it('should have a changed bit', function () {
        expect(obj.value).to.equal(1);
        expect(obj.storage.get('FLAGWORD', 9000)).to.equal(16384);
      });
    });//--setting value = 1

  });//--with BIT op

  describe('with WORD op', function () {
    var st = new Storage();
    var obj = new EasyField('FW9100', st);

    it('should NOT be a bit', function () {
      expect(obj.isBit).to.be.false;
    });

    it('should have bitNum -1', function () {
      expect(obj.bitNum).to.equal(-1);
    });

    it('should have index', function () {
      expect(obj.index).to.equal(9100);
    });

    it('should have operand', function () {
      expect(obj.operand).to.equal('FLAGWORD');
    });


    // it('should have bit manipulation functions', function () {
    //  expect(obj.setBit).to.be.a('function');
    //  expect(obj.checkBit, 'checkBit').to.be.a('function');
    //  expect(obj.getBit, 'getBit').to.be.a('function');
    // });

    it('> WORD should throw Error', function () {
      expect(function () {
        obj.value = 70000;
      }).to.throw(Error);
    });

    it('should do bit manipulation', function () {
      obj.value = 0;
      obj.setBit(0);
      expect(obj.value).to.equal(1);
      obj.setBit(1);
      expect(obj.value).to.equal(3);
    });
  });//--with WORD op

  describe('should emit', function () {


    it('changed word', function (done) {
      var st = new Storage();
      var obj = new EasyField('FW10', st);
      obj.setActive();


      obj.on('changed', function (sender, pv, cv) {
        expect(sender).to.be.equal(obj);
        expect(pv).to.equal(0);
        expect(cv).to.equal(20);
        done();
      });

      st.set('FLAGWORD', 10, 20);
    });

    it('changed bit', function (done) {
      var st = new Storage();
      var obj = new EasyField('F10.4', st);
      obj.setActive();


      obj.on('changed', function (sender, pv, cv) {
        expect(sender).to.be.equal(obj);
        expect(pv).to.equal(0);
        expect(cv).to.equal(1);
        done();
      });

      st.set('FLAGWORD', 10, 16);
    });

  });//--emitting

});//--EasyField
