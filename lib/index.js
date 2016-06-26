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

        self.transmuxer.on('data', (segment) => {
            self.emit('data', segment.data.buffer);
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
        while (ts_packet_chunk_start < buffer.length) {
            if (buffer[ts_packet_chunk_start] === 0x47) {
                let packet_header = new DataView(buffer.buffer, ts_packet_chunk_start, 4).getUint32(0);
                //if (packet_header & 0x800000) {
                //    console.error("[TS] Transport Error Indicator (TEI)");
                //    continue;
                //}
                let pid = (packet_header & 0x1fff00) >> 8;
                if (self.buffer_ts_packets.length > 0 && pid === 0x0) {
                    self.transmuxer.push(self.buffer_ts_packets);
                    self.transmuxer.flush();
                    self.buffer_ts_packets = new Buffer(0);
                }
                if (pid !== 0x1011 && pid !== 0x1100) {
                    console.log("PID 0x" + pid.toString(16) + " PUSI " + ((packet_header & 0x400000) >> 22).toString(16) + " AFC 0x" + ((packet_header & 0x30) >> 4).toString(16));
                }
                self.buffer_ts_packets = Buffer.concat([self.buffer_ts_packets, buffer.slice(ts_packet_chunk_start, ts_packet_chunk_start + chunk_size)]);
                ts_packet_chunk_start += chunk_size;
            } else {
                break;
            }
        }
    }
}

module.exports = GoproStream;
