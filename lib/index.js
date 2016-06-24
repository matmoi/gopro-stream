'use strict';

require('log-timestamp');
const muxjs = require('mux.js');
const GoPro = require('goproh4');
const dgram = require('dgram');
const EventEmitter = require('events').EventEmitter;

class GoproStream extends EventEmitter {
    constructor() {
        super();
        var self = this;

        self.cam = new GoPro.Camera();
        self.port = 8554;
        self.stream = dgram.createSocket('udp4');
        self.transmuxer = new muxjs.mp4.Transmuxer();
        self.buffer = new Buffer(0);

        self.stream.on('message', (msg, rinfo) => {
            let ts_packet_chunk_start = 12;
            while (ts_packet_chunk_start < msg.length) {
                if (msg[ts_packet_chunk_start] === 0x47) {
                    let packet_header = new DataView(msg.buffer, ts_packet_chunk_start, 4).getUint32(0);
                    //if (packet_header & 0x800000) {
                    //    console.error("[TS] Transport Error Indicator (TEI)");
                    //    continue;
                    //}
                    let pid = (packet_header & 0x1fff00) >> 8;
                    //if (pid !== 0x1011 && pid !== 0x1100) {
                    //    console.log("PID 0x" + pid.toString(16) + " PUSI " + ((packet_header & 0x400000) >> 22).toString(16) + " AFC 0x" + ((packet_header & 0x30) >> 4).toString(16));
                    //}
                    if (self.buffer.length > 0 && pid === 0x0) {
                        self.transmuxer.push(this.buffer);
                        self.transmuxer.flush();
                        self.buffer = new Buffer(0);
                    }
                    self.buffer = Buffer.concat([self.buffer, msg.slice(ts_packet_chunk_start, ts_packet_chunk_start + 188)]);
                    ts_packet_chunk_start += 188;
                } else {
                    break;
                }
            }
        });

        self.transmuxer.on('data', function (segment) {
            self.emit('data', segment.data.buffer);
        });
    }

    startStream() {
      var self = this;
      self.stream.on('listening', () => {
          let address = self.stream.address();
          self.cam.restartStream();
      });
      self.stream.bind(self.port);
    }

    stopStream() {
      var self = this;
      self.stream.close();
      self.cam.stopStream();
    }
}

module.exports = GoproStream;
