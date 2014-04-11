var should = require('should');

var mod = require('../lib/packet');

var string_message_packet = new Buffer('000001000000000b0100000000000000000000007c534d537c34367c666f6f00', 'hex');

describe("Packet", function () {

    it("should parse string", function () {
        string_message_packet.should.have.property('length');
        var l = string_message_packet.length;
        l.should.equal(32);

        var p = mod.Packet.parse(string_message_packet);

        p.should.be.instanceOf(mod.Packet);
        p.payload.should.be.instanceOf(Array);
        p.payload[0].should.equal('|SMS|46|foo');
    });

});
