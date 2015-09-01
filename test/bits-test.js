var expect = require('chai').expect;

var bits = require('../lib/bits');

describe('lib/bits', function () {
  it('has 3 methods', function () {
    expect(bits).to.include.keys('checkBit', 'setBit', 'clearBit');
    expect(bits.checkBit).to.be.a('function');
    expect(bits.setBit).to.be.a('function');
    expect(bits.clearBit).to.be.a('function');
  });

  it('setBit 0->1', function () {
    expect(bits.setBit(1, 7)).to.equal(129);
  });

  it('clearBit 1->0', function () {
    expect(bits.clearBit(129, 0)).to.equal(128);
  });

  it('can check a 1 bit', function () {
    expect(bits.checkBit(129, 0)).to.equal(1);
  });

  it('can check a 0 bit', function () {
    expect(bits.checkBit(129,2)).to.equal(0);
  });
  it('test bit 14 from', function () {
    var val = 16384;
    expect(val.toString(2), '100000000000000');
    expect(bits.checkBit(val, 13)).to.equal(0);
    expect(bits.checkBit(val, 14)).to.equal(1);
  });

  it('set and check bit', function () {
    var val = bits.setBit(0, 14);
    expect(val).to.equal(16384);
    expect(val.toString(2), '100000000000000');
    expect(val).to.be.a('number');
    expect(bits.checkBit(val, 14), 1);
  });

});
