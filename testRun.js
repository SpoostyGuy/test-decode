var fs = require('fs');
var parser = require('mpeg2ts-parser')();
var m2ts = fs.createReadStream('./test.ts', { encoding: null });

function readBitsFromBuffer(buffer, bitOffset, bitCount) {
    if (bitCount < 1 || bitCount > 32) {
      throw new Error('Bit count must be between 1 and 32');
    }
  
    let byteOffset = Math.floor(bitOffset / 8);
    let bitPositionInByte = bitOffset % 8;
    let result = 0;
    let bitsRead = 0;
  
    while (bitsRead < bitCount) {
      // If we've read to the end of the buffer, break
      if (byteOffset >= buffer.length) {
        break;
      }
  
      // Read current byte
      const currentByte = buffer[byteOffset];
      
      // Calculate how many bits we can read from the current byte
      const remainingBitsInByte = 8 - bitPositionInByte;
      const bitsToReadNow = Math.min(remainingBitsInByte, bitCount - bitsRead);
      
      // Extract bits from the current byte - THIS WAS THE ISSUE
      // We need to shift by the correct amount based on bit position and mask only what we want
      const mask = (1 << bitsToReadNow) - 1;
      const value = (currentByte >> (8 - bitPositionInByte - bitsToReadNow)) & mask;
      
      // Add the bits to our result
      result = (result << bitsToReadNow) | value;
      
      // Update our offsets
      bitPositionInByte += bitsToReadNow;
      if (bitPositionInByte >= 8) {
        byteOffset++;
        bitPositionInByte = 0;
      }
      
      bitsRead += bitsToReadNow;
    }
  
    return {
      value: result,
      newBitOffset: byteOffset * 8 + bitPositionInByte
    };
  }
      
var organizedStreamOfData = []
parser.on('data', function(data) {
    if (data.payload != undefined) {
        if (data.payload[0] == 0 && data.payload[1] == 0 && data.payload[2] == 1) {
            var index = 3
            var dataWork = {
                stream_id: data.payload.readUint8(index).toString(2).padStart(8, '0'),
                packetLen: data.payload.readUint16LE(index+1)
            }
            index += 3
            var generalData = (data.payload.readUint8(index).toString(2).padStart(8, '0')) + (data.payload.readUint8(index+1).toString(2).padStart(8, '0'))
            index += 2
            if (generalData.substring(0, 2) == '10') {
                generalData = generalData.split('')
              
                dataWork['PES_scrambling_control'] = [Number(generalData[3]), Number(generalData[4])]
                dataWork['data_alignment_indicator'] = Number(generalData[5])
                dataWork['copyright'] = Number(generalData[6])
                dataWork['original_or_copy'] = Number(generalData[7])
                dataWork['PTS_DTS_flags'] = generalData[8] + generalData[9]
                dataWork['ESCR_flag'] = Number(generalData[10])
                dataWork['ES_rate_flag'] = Number(generalData[11])
                dataWork['DSM_trick_mode_flag'] = Number(generalData[12])
                dataWork['additional_copy_info_flag'] = Number(generalData[13])
                dataWork['PES_CRC_flag'] = Number(generalData[14])
                dataWork['PES_extension_flag'] = Number(generalData[15])
                dataWork["HeaderDataLength"] = data.payload.readUint8(index)
                var bytesRead = 3
                if (dataWork['PTS_DTS_flags'] == '10') {
                    bytesRead += 5            
                }
                if (dataWork['PTS_DTS_flags'] == '11') {
                    bytesRead += 10
                }
                if (dataWork['PES_extension_flag'] == 1) {
                    console.log('extension')
                }
                bytesRead += dataWork["HeaderDataLength"]-(bytesRead-3)
                var newData = data.payload.slice(bytesRead+7)
                console.log(readBitsFromBuffer(newData, 0, 32))
                if (newData[0] == 0 && newData[1] == 0 && newData[2] == 1) {
                    console.log(readBitsFromBuffer(newData, 0, 32))
                    console.log((0x000001 << 8) | 0x00)
                }

            }
        }
    }

    /* example
    { transport_error_indicator: 0,
      payload_unit_start_indicator: 0,
      transport_priority: 0,
      pid: 511,
      transport_scrambling_control: 0,
      adaptation_field_control: 2,
      continuity_counter: 0,
      adaptation_field:
       { adaptation_field_length: 183,
         discontinuity_indicator: 0,
         random_access_indicator: 0,
         elementary_stream_priority_indicator: 0,
         pcr_flag: 1,
         opcr_flag: 0,
         splicing_point_flag: 0,
         transport_private_data_flag: 0,
         adaptation_field_extension_flag: 0,
         program_clock_reference_base: 4827203194,
         program_clock_reference_extension: 95 } }
    */
});

m2ts.pipe(parser);
