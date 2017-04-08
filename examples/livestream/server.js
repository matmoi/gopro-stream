"use strict";

const PORT = 8080;

require('log-timestamp');
const express = require('express');
var app = express();
var expressWs = require('express-ws')(app);

console.log('[server] start');

app.use('/', express.static(__dirname + '/static'));
app.listen(PORT);

app.ws('/', (ws, req) => {
});

var clientsWss = expressWs.getWss('/');
clientsWss.on('connection', (ws) => {
    console.log('[server] new client');
});

app.ws('/publish', (ws, req) => {
    ws.on('message', (msg) => {
        clientsWss.clients.forEach((client) => {
            client.send(msg);
        });
    });
});
var gatewayWss = expressWs.getWss('/publish');
gatewayWss.on('connection', (ws) => {
    console.log('[server] new gateway');
});
