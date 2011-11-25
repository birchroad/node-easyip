/*!
 *  Copyright © 2011 Peter Magnusson.
 *  All rights reserved.
 */
var FLAGS = { 
	EMPTY: 0,
    BIT_OR: 0x2,
    BIT_AND: 0x4,
    NO_ACK: 0x40,
    RESPONSE: 0x80
};


var OPERANDS = {
	EMPTY: 0,
	FLAGWORD:1,
	INPUTWORD:2,
	OUTPUTWORD:3,
	REGISTER:4, 
	STRING: 11
};

var parseOperand = function(code){
	if(code==='F') return OPERANDS.FLAGWORD;
	if(code==='I') return OPERANDS.INPUT;
	throw new Error('Illeigal operand')
}

var FIELDS = {
	FLAGS:0,
	ERROR:1,
	COUNTER:2,
	INDEX1:3,
	SPARE1:4,
	SEND_TYPE: 5,
	SEND_SIZE: 6,
	SEND_OFFSET: 7,
	SPARE2:8,
	REQ_TYPE: 9,
	REQ_SIZE: 10,
	REQ_OFFSET_SERVER:11,
	REQ_OFFSET_CLIENT:12
};




exports.FLAGS = Object.freeze(FLAGS);
exports.OPERANDS = Object.freeze(OPERANDS);
exports.FIELDS = Object.freeze(FIELDS);
exports.parseOperand = parseOperand;