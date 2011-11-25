function checkBit(value, bit){
  var mask = 1 << bit;
  return (value & mask)!==0? 1 : 0;
}

function setBit(value, bit){
  var mask = 1 << bit
  return parseInt((value | mask));
}

function clearBit(value, bit){
  var mask = 1 << bit;
  return parseInt((value & (~mask)));
}


exports.checkBit = checkBit;
exports.setBit = setBit;
exports.clearBit = clearBit;