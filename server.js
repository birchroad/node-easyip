/*!
 *  Copyright © 2011 Peter Magnusson.
 *  All rights reserved.
 */
var easy = require('./easyip.js');

var service = easy.createService(1024+easy.EASYIP_PORT);

service.on('listening', function(address){
  console.log("easyip service listening on " +
      address.address + ":" + address.port);
});

service.on('send', function(req, res, rinfo){
	console.log("send:", req.payload, res.header.FLAGS, rinfo);
  console.log(service.flagwords);
});

service.on('request', function(req, res, rinfo){
	console.log("request:", res.payload, res.header.FLAGS, rinfo);
});
service.bind();
