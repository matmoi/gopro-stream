var fs = require('fs');
var GoproStream = require('../lib/index.js');

var outputStream = fs.createWriteStream("gopro.mp4");

var goproStream = new GoproStream();
goproStream.on('data', function (buffer) {
    outputStream.write(new Buffer(buffer));
});
goproStream.startStream();

console.log("Start camera (ctrl+c to stop)");

process.on('SIGINT', () => {
    console.log("exit");
    outputStream.end();
    goproStream.stopStream();
    process.exit();
});