"use strict";

const isDevMode = (process.env.NODE_ENV === 'development');
const fs = require('fs');
const OUTPUT_FILE = __dirname + '/gopro.mp4'

if (isDevMode) {
    var goproStream = new (require('../test/mock.js'))();
} else {
    var goproStream = new (require('../lib/index.js'))();
}

var outputStream = fs.createWriteStream(OUTPUT_FILE);

goproStream.on('data', function (buffer) {
    outputStream.write(new Buffer(buffer));
    console.log(`Write ${buffer.byteLength} bytes to ${OUTPUT_FILE}`);
});
goproStream.startStream();

console.log("Start camera (ctrl+c to stop)");

process.on('SIGINT', () => {
    console.log("exit");
    outputStream.end();
    goproStream.stopStream();
    process.exit();
});