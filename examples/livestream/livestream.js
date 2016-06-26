require('log-timestamp');
const express = require('express');
const DEV_MODE = (process.env.NODE_ENV === 'development');
const HTTP_PORT = 8089;
const WEBSOCKET_PORT = 8084;

if (DEV_MODE) {
    var goproStream = new (require('../../test/mock.js'))();
} else {
    var goproStream = new (require('../../lib/index.js'))();
}

var app = express();
var socketServer = new (require('ws').Server)({ port: WEBSOCKET_PORT });

console.log("Start");


app.use('/index', express.static(__dirname + '/static'));
app.listen(HTTP_PORT);

goproStream.on('data', function (buffer) {
    console.log(`Send ${buffer.byteLength} bytes to ${socketServer.clients.length} connected clients`);
    socketServer.broadcast(buffer);
});

socketServer.broadcast = function broadcast(data) {
    socketServer.clients.forEach(function each(client) {
        if (client.readyState === client.OPEN) {
            client.send(data);
        }
    });
};
socketServer.on('connection', function (socket) {
    console.log('[websocket] New WebSocket Connection (' + socketServer.clients.length + ' total)');
    socket.binaryType = 'arraybuffer';
});

goproStream.startStream();

process.on('SIGINT', () => {
    console.log("exit");
    goproStream.stopStream();
    process.exit();
});