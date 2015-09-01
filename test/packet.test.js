

var expect = require('chai').expect;

var Packet = require('../').Packet;
var protocol = require('../lib/protocol');


var string_packet_data = '000001000000000b0100000000000000000000007c534d537c34367c666f6f00';
var string_message_packet = new Buffer(string_packet_data, 'hex');


describe('packet', function () {


  it('shoud parse sent string', function (done) {
    var packet = Packet.parse(string_message_packet);
    expect(packet).to.be.instanceOf(Packet);
    expect(packet.flags).to.eql([]);
    expect(packet.counter, 'counter').to.equal(1);
    expect(packet.sendType, 'sendType').to.equal('STRING');
    expect(packet.sendOffset, 'sendSize').to.equal(0);
    expect(packet.payload).to.be.instanceOf(Array);
    expect(packet.payload).to.have.length(1);
    expect(packet.payload[0]).to.equal('|SMS|46|foo');

    done();
  });

  it('should create buffer from packet', function (done) {
    var packet = new Packet();
    packet.counter = 1;
    packet.sendType = protocol.OPERANDS.STRING;
    packet.payload.push('|SMS|46|foo');

    var buf = Packet.toBuffer(packet);

    expect(buf).to.exist;
    expect(buf.toString('hex')).to.equal(string_packet_data);
    done();
  });


  it('should handle multiple flag values as string', function (done) {
    var packet = new Packet({flags: 'RESPONSE|NO_ACK'});
    var buf = Packet.toBuffer(packet);
    expect(buf.toString('hex').substr(0,2)).to.equal('c0');
    done();
  });


  it('should handle multiple flag values as Array', function (done) {
    var packet = new Packet({flags: ['RESPONSE', 'NO_ACK']});
    var buf = Packet.toBuffer(packet);
    expect(buf.toString('hex').substr(0,2)).to.equal('c0');

    packet = Packet.parse(buf);
    expect(packet.flags).to.eql([ 'NO_ACK', 'RESPONSE' ]);
    done();
  });


  it('should support send and request combined', function (done) {
    var first = new Packet({
      sendType: 'STRING', sendSize: 2,
      reqType: 'STRING', reqSize: 1,
      payload: ['foo', 'bar']}
    );

    var buf = Packet.toBuffer(first);
    expect(buf.toString('hex')).to.equal('000000000000000b02000000000b010000000000666f6f0062617200');
    buf.writeUInt8(protocol.FLAGS.RESPONSE, 0);
    second = Packet.parse(buf);
    expect(second.payload).to.have.length(first.reqSize);

    done();
  });

  it('should support isRequest()', function (done) {
    var p = new Packet();
    expect(p.reqType).to.equal('EMPTY');
    expect(p.isRequest()).to.equal(false);

    p = new Packet({reqType: 'STRING'});
    expect(p.isRequest()).to.equal(true);
    done();
  });

  it('should support isAck()', function (done) {
    var p = new Packet();
    expect(p.isAck()).to.equal(true);

    p = new Packet({flags: ['RESPONSE']});
    expect(p.isAck()).to.equal(true);

    p = new Packet({flags: ['RESPONSE', 'NO_ACK']});
    expect(p.isAck()).to.equal(false);

    done();
  });

});
