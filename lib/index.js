'use strict';

const muxjs = require('mux.js');
const GoPro = require('goproh4');
const dgram = require('dgram');
const EventEmitter = require('events').EventEmitter;

class GoproStream extends EventEmitter {
    constructor() {
        super();
        var self = this;

        self.transmuxer = new muxjs.mp4.Transmuxer();
        self.buffer_ts_packets = new Buffer(0);

        self.transmuxer.on('data', (event) => {
            let segment = new Uint8Array(event.initSegment.byteLength + event.data.byteLength);
            segment.set(event.initSegment); 
            segment.set(event.data,event.initSegment.byteLength)
            self.emit('data', segment.buffer);
        });
    }

    startStream() {
        var self = this;
        self.cam = new GoPro.Camera();
        self.port = 8554;
        self.stream = dgram.createSocket('udp4');
        self.stream.on('listening', () => {
            let address = self.stream.address();
            self.cam.restartStream();
        });
        self.stream.on('message', (msg, rinfo) => {
            self._processTsPacket(msg);
        });
        self.stream.bind(self.port);
    }

    stopStream() {
        var self = this;
        self.stream.close();
        self.cam.stopStream();
    }

    _processTsPacket(buffer, offset = 12, chunk_size = 188) {
        var self = this;
        let ts_packet_chunk_start = offset;
        let ts_packet_chunk_end = offset;
        while (ts_packet_chunk_end < buffer.length) {
            if (buffer[ts_packet_chunk_end] === 0x47) {
                let packet_header = ((buffer[ts_packet_chunk_end+3]) |
                    (buffer[ts_packet_chunk_end+2] << 8) |
                    (buffer[ts_packet_chunk_end+1] << 16) |
                    (buffer[ts_packet_chunk_end] << 24));

                let pid = (packet_header & 0x1fff00) >> 8;
                if (self.buffer_ts_packets.length > 0 && pid === 0x0) { // PAT received, flush current buffer
                    if (ts_packet_chunk_end - ts_packet_chunk_start > 0) {
                        self.buffer_ts_packets = Buffer.concat([self.buffer_ts_packets, buffer.slice(ts_packet_chunk_start, ts_packet_chunk_end)]);
                    }
                    self.transmuxer.push(self.buffer_ts_packets);
                    self.transmuxer.flush();
                    self.buffer_ts_packets = new Buffer(0);
                    ts_packet_chunk_start = ts_packet_chunk_end
                }
                if (pid !== 0x1011 && pid !== 0x1100) {
                    console.log("PID 0x" + pid.toString(16) + " PUSI " + ((packet_header & 0x400000) >> 22).toString(16) + " AFC 0x" + ((packet_header & 0x30) >> 4).toString(16));
                }
                ts_packet_chunk_end += chunk_size;
            } else {
                break;
            }
        }
        if (ts_packet_chunk_end - ts_packet_chunk_start > 0) {
            self.buffer_ts_packets = Buffer.concat([self.buffer_ts_packets, buffer.slice(ts_packet_chunk_start, ts_packet_chunk_end)]);
        }
    }
}

module.exports = GoproStream;
