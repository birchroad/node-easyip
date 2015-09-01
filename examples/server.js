
var easy = require('../');

var service = new easy.Service();

service.on('listening', function (address) {
  console.log('easyip service listening on %s:%d', address.adress, address.port);
});

service.on('message', function () {
  console.log('on message');
});

service.on('send', function (req, res, rinfo) {
  console.log('send:', req.payload, res.flags, rinfo);
  console.log('storage:', service.storage);
});

service.on('request', function (req, res, rinfo) {
  console.log('request:', res.payload, res.flags, rinfo);
});

service.bind();
