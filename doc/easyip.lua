-- easyip.lua is free software: you can redistribute it and/or modify
-- it under the terms of the GNU Lesser General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- easyip.lua is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU General Public License for more details.
--
-- You should have received a copy of the GNU General Public License
-- along with mqtt.lua.  If not, see <http://www.gnu.org/licenses/>.
--
-- Copyright © 2015 Peter Magnusson.
-- All rights reserved.
--

-- Wireshark Dissector for EasyIP
do
    --create new dissector
    EASYPROTO = Proto("EasyIP", "Easy IP PLC Communication protocol")
    --wlocal bitw = require("bit")
    local f = EASYPROTO.fields

    f.flags = ProtoField.uint8("easyip.flags", "Flags")
    f.flags_or = ProtoField.uint8("easyip.flags.or", "OR", base.DEC, nil, 0x02)
    f.flags_and = ProtoField.uint8("easyip.flags.and", "AND", base.DEC, nil, 0x04)
    f.flags_nack = ProtoField.uint8("easyip.flags.nack", "NO_ACK", base.DEC, nil, 0x40)
    f.flags_response = ProtoField.uint8("easyip.flags.response", "RESPONSE", base.DEC, nil, 0x80)

    f.error = ProtoField.uint8("easyip.error", "Error Code")
    f.counter = ProtoField.uint16("easyip.counter", "Packet Counter")
    f.index = ProtoField.uint16("easyip.index", "Index", base.DEC)

    f.spare1 = ProtoField.uint8("easyip.spare1", "Spare1")
    f.sendType = ProtoField.uint8("easyip.sendType", "Send Type", base.DEC)
    f.sendSize = ProtoField.uint16("easyip.sendSize", "Send Size", base.DEC)
    f.sendOffset = ProtoField.uint16("easyip.sendOffset", "Send Offset", base.DEC)

    f.spare2 = ProtoField.uint8("easyip.spare2", "Spare2")
    f.reqType = ProtoField.uint8("easyip.reqType", "Request Type", base.DEC)
    f.reqSize = ProtoField.uint16("easyip.reqSize", "Request Size", base.DEC)
    f.reqOffsetServer = ProtoField.uint16("easyip.reqOffsetServer", "Server Request Offset", base.DEC)
    f.reqOffsetClient = ProtoField.uint16("easyip.reqOffsetClient", "Client Request Offset", base.DEC)


    f.payload_data = ProtoField.bytes("easyip.payload", "Payload Data")

    function EASYPROTO.dissector(buffer, pinfo, tree)
        pinfo.cols.protocol = "EasyIP"
        local operands = {}
        operands[0] = "Empty"
        operands[1] = "Flagword"
        operands[2] = "Inputword"
        operands[3] = "Outputword"
        operands[4] = "Register"
        operands[11] = "String"

        local subtree = tree:add(EASYPROTO, buffer())
        local offset = 0

        --flags
        local flags = buffer(offset, 1)
        local flags_subtree = subtree:add(f.flags, flags)
        flags_subtree:add(f.flags_or, flags)
        flags_subtree:add(f.flags_and, flags)
        flags_subtree:add(f.flags_nack, flags)
        flags_subtree:add(f.flags_response, flags)
        offset = offset + 1
    


        --error
        subtree:add(f.error, buffer(offset,1))
        offset = offset + 1

        --counter
        subtree:add_le(f.counter, buffer(offset, 2))
        offset = offset + 2
        
        --index
        subtree:add_le(f.index, buffer(offset, 2))
        offset = offset + 2

        
        local value = 0
        --send
        subtree:add(f.spare1, buffer(offset, 1))
        offset = offset + 1
        value = buffer(offset, 1)
        --local x = operands[value+1]
        subtree:add(f.sendType, value):append_text(" (" .. operands[value:uint()] .. ")")
        offset = offset +1
        subtree:add_le(f.sendSize, buffer(offset, 2))
        offset = offset + 2
        subtree:add_le(f.sendOffset, buffer(offset, 2))
        offset = offset + 2


        --request
        subtree:add(f.spare2, buffer(offset, 1))
        offset = offset +1
        value = buffer(offset, 1)
        subtree:add(f.reqType, value):append_text(" (" .. operands[value:uint()] .. ")") 
        offset = offset +1
        subtree:add_le(f.reqSize, buffer(offset, 2))
        offset = offset + 2
        subtree:add_le(f.reqOffsetServer, buffer(offset, 2))
        offset = offset + 2
        subtree:add_le(f.reqOffsetClient, buffer(offset, 2))
        offset = offset + 2

        -- payload
        --TODO: parse payload somewhat more intelligent
        local payload_subtree = subtree:add("Payload", nil)
        payload_subtree:add(f.payload_data, buffer(offset, buffer:len()-offset))

    end

    -- Register the dissector
    udp_table = DissectorTable.get("udp.port")
    udp_table:add(995, EASYPROTO)
end