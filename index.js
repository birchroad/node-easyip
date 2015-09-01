/*!
 *  Copyright © 2011-2015 Peter Magnusson.
 *  All rights reserved.
 */
var pkg = require('./package.json');
var protocol = require('./lib/protocol');

exports.VERSION = pkg.version;

exports.Service = require('./lib/service');
exports.Packet = require('./lib/packet');
exports.OPERANDS = protocol.OPERANDS;
exports.FLAGS = protocol.FLAGS;
exports.EASYIP_PORT = protocol.EASYIP_PORT;
exports.RESPONSE_TIMEOUT = protocol.RESPONSE_TIMEOUT;
