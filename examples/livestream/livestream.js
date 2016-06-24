require('log-timestamp');
var GoproStream = require('../../lib/index.js');
var express = require('express');
var fs = require('fs');

var HTTP_PORT = 8089;
var WEBSOCKET_PORT = 8084;

console.log("Start");

var app = express();
var goproStream = new GoproStream();
var socketServer = new (require('ws').Server)({ port: WEBSOCKET_PORT });


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