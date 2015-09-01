Easy IP Protocol
================






## Status values
* -1 = Sent, waiting for response
* 0 = OK
* 1 = Partner does not support selected operand
* 2 = Offset error. The partner device can not accept this offset addres
* 4 = Partner thinks the number of requested/sent operands is to big.
* 128 = Timeout.
 



## Responding
There is a timeout for when to expect the response.
It is according to the documentation about 50 millisecods. Unless a response
is received within this time a "timeout fault" will be set in the status flag word.

There should because of this also be 1 outstanding request for each status flag
word index.








