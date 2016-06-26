'use strict';

const fs = require('fs');
const GoproStream = require('../lib/index.js');
const DEFAULT_INPUT_FILE = __dirname + '/video_input_mpegts.ts';
const PACKET_SIZE_IN_BYTES = 1328;

class GoproMock extends GoproStream {
    constructor(input_file = DEFAULT_INPUT_FILE) {
        super();
        var self = this;
        self.filename = input_file;
    }

    startStream() {
        var self = this;

        fs.readFile(self.filename, (err, fileArray) => {
            if (err) throw err;
            let currentPosition = 0;
            self.readingThread = setInterval(() => {
                let chunk = fileArray.slice(currentPosition, currentPosition + PACKET_SIZE_IN_BYTES);
                //fs.writeFile(__dirname + '/video_chunk_' + currentPosition + '.ts', chunk, function (err) {
                //    if (err) {
                //        return console.log(err);
                //    }
                //}); 
                console.log(`Read from position ${currentPosition}`);
                self._processTsPacket(chunk);
                currentPosition += PACKET_SIZE_IN_BYTES;
                if (currentPosition > fileArray.buffer.byteLength - PACKET_SIZE_IN_BYTES) {
                    currentPosition = 0;
                }
            }, 500);
        });
    }

    stopStream() {
        var self = this;
        if (self.stream) {
            self.stream.close();
        }
        if (self.readingThread) {
            self.readingThread.clearInterval();
        }
    }
}

module.exports = GoproMock;

