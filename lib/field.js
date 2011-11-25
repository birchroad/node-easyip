var b = require('./bits')
  ,enums =require('./enums');

var EasyField = function(op, storage){
  this.op=op;
  this.storage=storage;
  this.isBit=false;
  this.bitNum=-1;
  this._value=0;
  this.operand = enums.parseOperand(op.substring(0,1));
  var point = op.indexOf('.');

  if(point>-1){
    this.isBit=true
    this.bitNum = parseInt(op.substring(point+1));
  }
  else{
    //second char must be a W
    if(op.substring(1,2) !== 'W'){
      throw new Error('Badly formated op:' + op);
    }
  }
  var s = this.isBit ? 1 : 2 ;
  var e = this.isBit ? point: op.length;

  this.index = parseInt(op.substring(s,e));
}

EasyField.prototype = {
  get value(){
    if(typeof(this.storage)!=='undefined' && this.storage!==null){
      var val = this.storage.get(this.operand, this.index);
      if(this.isBit){
        val = b.checkBit(val, this.bitNum);
      }
      this._value=val;
    }
    return this._value;
  },
  //Setter for value
  set value(val){
    //test for valid values
    if(this.isBit){
      if(val<0 || val >1){
        throw new Error('Bits can only bet set to 1 or 0:' + this.op);
      }
    }
    if(val>65535){
      throw new Error('65535 is the maximum value for a word:' + this.op);
    }
    //store locally
    this._value=val;
    if(typeof(this.storage)!=='undefined' && this.storage !== null){
      //put in storage as well
      if(this.isBit){
        var fn = val===1 ? b.setBit : b.clearBit
        val = fn(this.storage.get(this.operand, this.index), this.bitNum);
      }
      this.storage.set(this.operand, this.index, val);  
    }

  }
};


exports = module.exports = EasyField;