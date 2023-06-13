Easy IP Protocol
================
The protocol is meant to be used for inter PLC connections betwen Festo devices and it's quite insecure.
Each node that communicates has to listen on port 995 UDP.
This protocol description might be wrong and if used it might have unforseen 
consequences. 
USE AT YOUR OWN RISK!

Everything described in this document and related source code is derived from experience and playing around with the protocol.
Nothing is official.

## Packet structure
Regardles of direction of packet (response or request) the header always have
the same structure.

__Header__
| Offset    | Name              | Datatype  | Description
| :-        | :-                | :-        |
| 0         | Flags             | Byte      | 
| 1         | Error             | Byte      |
| 2         | Counter           | Byte      | message counter
| 3         | Index             | Byte      |
| 4         | Reserved          | Byte      | Reserved/Unknown
| 5         | Send Type         | Byte      | What operand/type of data that will be sent
| 6         | Send Size         | Byte      | Number of words 
| 7         | Send Offset       | Byte      |
| 8         | Reserved          | Byte      | Reserved/Unknown
| 9         | Request Type      | Byte      | operand/type requested
| 10        | Request Size      | Byte      |
| 11        | Request Offset    | Byte      |
| 12        | Req Offset Client | Byte      |

__Payload__
Any data after the packet header is the optional payload and the size and type of payload
depends on data in the header and if it's a request or response.

* Strings should be 0 terminated.
* Most everything else should be zero or more words (2 bytes) of data. 
  Can never be more than 254 words (1 byte size) 


### Flags
Bit encoded field

| Value | Name          | Description
| :-    | :-            | :-
| 0     | OK            |
| 0x02  | BIT_OR        | Bitwise OR operation
| 0x04  | BIT_AND       | Bitwise AND operation
| 0x40  | NAK           | Not Acknowledged
| 0x80  | Response      | Packet is a response

### Errors
| Value | Name          | Description
| :-    | :-            | :-
| 0     | OK            |
| 0x01  | Operand Error | Partner does not support selected operand
| 0x02  | Offset Error  | The partner device can not accept this offset address
| 0x04  | Size Error    | Partner thinks the number of requested/sent operands is to big
| 0x10  | Timeout       |

### Operad Types
| Value | Name          | Description
| :-    | :-            | :-
| 0     | Empty         |
| 1     | Flagword      | Flagwords are to be used
| 2     | Inputword     | Inputwords, i.e. physical inputs
| 3     | Outputword    | Outputword, i.e. physical outputs
| 4     | Register      | Registger words
| 11    | String        | Strings




## Responding
There is a timeout for when to expect the response.
It is according to the documentation about 50 millisecods. Unless a response
is received within this time a "timeout fault" will be set in the status flag word.

There should because of this also be 1 outstanding request for each status flag
word index.








