var easy = require('./easyip.js');

var service = easy.createService(1024+995);


service.on('set', function(type, offset, size, values, rinfo){
	console.log("set:" + type + "=" + values);
});

service.on('request', function(req){
	var x = new Array(req.getSize());
	for(i=0; i<x.length; i++){
		x[i]=100+i;
	}
	req.setPayload(x);
	req.end(function(err, bytes){
		console.log('err:' + err + " bytes:" + bytes);
	});
});