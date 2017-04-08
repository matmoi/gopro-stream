"use strict";

require('log-timestamp');
const SERVER_ADRESS = 'ws://127.0.0.1:8080/publish';
const DEV_MODE = (process.env.NODE_ENV === 'development');
if (DEV_MODE) {
    var goproStream = new (require('../../test/mock.js'))();
} else {
    var goproStream = new (require('../../lib/index.js'))();
}

const ws = require('ws')(SERVER_ADRESS);

console.log('Start gateway');

goproStream.on('data', (buffer) => {
    console.log(`Send ${buffer.byteLength} bytes to server`);
    ws.send(buffer);
});

ws.on('open', () => {
    console.log(`Connected to ${SERVER_ADRESS}`);
    goproStream.startStream();
});

ws.on('close', () => {
    console.log(`Disconnected from ${SERVER_ADRESS}`);
    goproStream.stopStream();    
});

process.on('SIGINT', () => {
    console.log("exit");
    goproStream.stopStream();
    process.exit();
});