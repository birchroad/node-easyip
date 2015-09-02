var debug = require('debug')('easyip:service');

var dgram = require('dgram')
  , EventEmitter = require('events').EventEmitter
  , Packet = require('./packet')
  , Storage = require('./storage').Storage
  , protocol = require('./protocol')
  , util = require('util')
  , EasyField = require('./easyfield');


function isEmpty(dict) {
  for (var prop in dict) if (dict.hasOwnProperty(prop)) return false;
  return true;
};

/**
* The service constructor
* @param {Number} port number to bind the service to
*
*/
function Service() {
  EventEmitter.call(this);
  var m = this;
  this.storage = new Storage();
  this.counter = 0;
  var server = dgram.createSocket('udp4');
  m.server = server;
  var sendQueue = [];
  var request_dict = {};

  this._addReq = function(counter, address, callback) {
    var msg = {message: 'timeout', counter: counter, address: address};

    var timeout = setTimeout(function (count) {
      debug('timeout on %s', count, Object.keys(request_dict));
      if (! request_dict.hasOwnProperty(count) ) {
        debug('already removed, timeout unneccesary');
        return;
      }

      if (typeof request_dict[count].callback !== 'undefined') {
        request_dict[count].callback(msg);
      }
      m.emit('timeout', count);
      m.emit('error', msg);
      debug('deleteing request %s on timeout', count);
      delete request_dict[count];
      m._sendQueue();
    }, protocol.RESPONSE_TIMEOUT, counter.toString());

    request_dict[counter.toString()] = {counter: counter, timer: timeout, callback: callback, address: address };

    debug('_addReq count: %d, dict: %j', counter, Object.keys(request_dict));
    this.emit('addReq', msg);
  };

  this._gotRes = function(packet, rinfo) {
    debug('_gotRes counter: %d', packet.counter);
    var count = packet.counter.toString();
    var task;
    try {
      if (request_dict.hasOwnProperty(count)) {
        task = request_dict[count];
        if (task.hasOwnProperty('timer')) {
          debug('stop timer on %s', count);
          clearTimeout(task.timer);
        }
      }
      else {
        debug('bad response %s', count, Object.keys(request_dict));
        return m.emit('error', {message: 'No such outstanding request', packet: packet});
      }
      //TODO:check if flags are RESPONSE or NO_ACK
      if (packet.isResponse() && packet.hasPayload()) {
        //can't be anything else but a response to a request for data
        payloadToStorage(packet.payload, packet.reqType
          , packet.reqOffsetClient
          , packet.reqSize);
      }
      var fn = task.callback;
      if (typeof(fn) !== 'undefined') {
        fn(null, packet, rinfo);
      }
      debug('deleteing request %s on response', count);
      delete request_dict[count];
      m.emit('response', packet, rinfo);
      m._sendQueue();
    }
    catch(err) {
      //can not clear timer... this is some sort of error.
      m.emit('error', {message: 'Error occured when taking care of the response',
        err: err, packet: packet});
    }
  };

  this._addQueue = function(address, packet, callback) {
    if (typeof(address) !== 'object') {
      address = {address: address, port: protocol.EASYIP_PORT};
    }
    sendQueue.push({address: address, packet: packet, callback: callback});
    m._sendQueue();
  };//_addQueue

  this._sendQueue = function() {
    process.nextTick(function() {
      if ( sendQueue.length > 0 && isEmpty(request_dict) ) {
        var q = sendQueue.shift();
        var buf = Packet.toBuffer(q.packet);
        m._addReq(q.packet.counter, q.address, q.callback);
        debug('about to send %s', q.packet.counter);
        m.server.send(buf, 0, buf.length, q.address.port, q.address.address, function (err) {
          if (err) {
            return q.callback(err);
          }
        });
      }
    });
  };//_sendQueue

  server.on('message', function(msg, rinfo) {
    var index, res, buf;
    var packet = Packet.parse(msg);
    debug('on message from %s: %j', rinfo.address, packet);
    m.emit('message', packet, rinfo);
    var is_response = packet.isResponse();
    //var is_acknowleged = packet.isAck();
    var is_request = packet.isRequest();
    var has_payload = packet.hasPayload(); //anything more then a header is payload

    //can not be a send and response packet at the same time but both can carry a payload
    if (is_response) {
      //check the request queue for a match
      debug('is_response', Object.keys(request_dict));
      m._gotRes(packet, rinfo);
    }
    else if (is_request) {
      debug('is_request');
      //it's a request for something
      var offset = packet.reqOffsetServer;
      var operand = packet.reqType;
      var payload = [];
      //get the payload from storage
      for (index = 0; index < packet.reqSize; index++) {
        payload.push(m.storage.get(operand, offset + index));
      }
      res = Packet.parse(msg);

      res.flags = ['RESPONSE'];
      res.payload = payload;
      buf = Packet.toBuffer(res);

      m.server.send(buf, 0, buf.length, rinfo.port, rinfo.address);
      m.emit('request', packet, res, rinfo);
    }
    else {
      debug('message to receive som data');
      //someone sent some data
      if (!has_payload) {
        m.emit('error', {message: 'received a send request without payload',
          msg: msg, msg_length: msg.length, packet: packet});
        return;
      }
      payloadToStorage(packet.payload, packet.sendType
          , packet.sendOffset
          , packet.sendSize);

      debug('preparing response');
      res = Packet.parse(msg);
      res.setResponse(true);
      res.payload = [];
      buf = Packet.toBuffer(res);
      debug('sending response with %s bytes payload', res.payload.length);
      m.server.send(buf, 0, buf.length, rinfo.port, rinfo.address);
      m.emit('send', packet, res, rinfo);
    }
  });


  server.on('listening', function () {
    var address = server.address();
    m.emit('listening', address);
  });

  server.on('close', function() {
    debug('close');
    m.emit('close');
  });

  this.storage.on('changing', function(operand, index, from, to) {
    debug('changing %s at index: %s, from: `%s`, to: `%s`', operand, index, from, to);
    m.emit('changing', operand, index, from, to);
  });

  this.storage.on('changed', function(operand, index, from, to) {
    debug('changed %s at index: %s, from: `%s`, to: `%s`', operand, index, from, to);
    m.emit('changed', operand, index, from, to);
  });

  function payloadToStorage(payload, operand, offset, size) {
    debug('payloadToStorage `%s`', operand);
    var index;
    for (index = 0; index < size ;index++) {
      m.storage.set(operand, offset + index, payload[index]);
    }
  }
}

/**
* Inherit from EventEmitter
*/
util.inherits(Service, EventEmitter);

/**
* Binds the service to a defined or default port
* if you don't run as root with the default port
* you will get a 'bind EACCES' error.
*
* @param {Number} Optional port number to bind to. default=EASYIP_PORT, 0 - gives a random port
*
* @api public
*/
Service.prototype.bind = function(bind_port) {
  if (typeof(bind_port) === 'undefined') { bind_port = protocol.EASYIP_PORT; }
  this.bind_port = bind_port;
  this.server.bind(bind_port);
};

/**
* Returns bound address and port
*
* @api public
*/
Service.prototype.address = function() {
  //if not bound then this throws an error
  return this.server.address();
};


/**
* Generates next packet counter
*/
Service.prototype.getCounter = function() {
  this.counter += 1;
  if (this.counter > 65535) {
    this.counter = 1;
  }
  return this.counter;
};


/*
* Shortcut for creating a EasyField
*
* @api public
*/
Service.prototype.createField = function(op, setToActive) {
  var activate = typeof(setToActive) !== 'undefined' ? setToActive : false;
  var f = new EasyField(op, this.storage);
  if (activate) {
    f.setActive();
  }
  return f;
};


/**
* Request data from remote address and store in local storage
* @param {Object} {address:<address>, port:<number>}
* @param {Number} OPERANDS datatype to get from remote
* @param {Number} Start address at remote
* @param {Number} Number of values
* @param {Number} Where to start store the requested data locally
* @param {Function} Optional (err, response_packet) callback
*
* @api public
*/
Service.prototype.doRequest = function (address, operand, offset, size, local_offset, callback) {
  debug('doRequest to %s (%s, offset: %d, size: %d, local_offset: %d)', address, operand, offset, size, local_offset);
  var p = new Packet();
  p.counter = this.getCounter();
  p.reqType = operand;
  p.reqSize = size;
  p.reqOffsetServer = offset;
  p.reqOffsetClient = local_offset;
  this._addQueue(address, p, callback);
};


/**
* Send data from local storage to remote address.
* @param {Object}/{String} {address:<address>, port:<number>} / 'ipaddress or hostname'
* @param {Number} OPERANDS datatype to send from local storage
* @param {Number} Start address at remote
* @param {Number} Number of values
* @param {Number} Where to start fetching data from local storage
* @param {Function} Optional (err, response_packet) callback
*
* @callback (err, packet, rinfo)
*
* @api public
*/
Service.prototype.doSend = function (address, operand, offset, size, local_offset, callback) {
  debug('doSend');
  var m = this;
  var p = new packets.Packet();
  var index;

  if (typeof operand === 'number') {
    protocol.keyOf(protocol.OPERANDS, operand);
  }

  if (typeof(address) === 'string') {
    address = {address: address, port: protocol.EASYIP_PORT};
  }
  p.counter = this.getCounter();
  p.sendType = operand;
  p.sendSize = size;
  p.sendOffset = offset;
  //TODO:Fix the rest
  var payload = [];
  //get the payload from storage
  for (index = 0; index < size; index++) {
    payload.push(m.storage.get(operand, local_offset + index));
  }
  p.payload = payload;
  this._addQueue(address, p, callback);
};


module.exports = Service;
