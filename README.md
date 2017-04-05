# gopro-stream

gopro-stream allows you to live stream your GoPro Hero

![Alt text](doc/architecture.png?raw=true "Overview")

GoPro Hero4 Silver introduced the possibility to preview the camera's stream over wifi, even while capturing. Preview is a mpegts format stream containing 2 tracks (+1 unknown) for audio and video. Video stream is encoded with h264 (Main), has a resolution of 432x240 and a framerate of 30 i/s. Audio stream is encoded using aac at 127 kb/s.

Our solution as shown above consists of three distinct components :
- _gateway_ is responsible for retrieving the preview from the GoPro, transmuxing the stream from mpegts to fragmented MP4, and pass it on the server.
- _server_ is used as a broadcaster, it receives the stream from the gateway and transmit it to all connected clients via websockets.
- _clients_ are endpoints connected to the server via http requests. As such, the received fragmented MP4 segments are rendered using [MSE](http://www.w3.org/TR/media-source/) (no plugin required).

gateway

connected to the GoPro via wifi
use [goproh4](https://github.com/citolen/goproh4) npm package to control the GoPro (notably start preview command)
receive the stream from the GoPro on an udp link using [dgram](https://nodejs.org/api/dgram.html)
transmux the stream using [mux.js](https://github.com/videojs/mux.js) npm package

server

Simply an express http server delivering a simple http web page to display the fragmented MP4 packets as they arrive. Also a websocket server broadcasting incoming packets from the gatewy towards clients.

clients

Initiate a connection to the websocket server, get and display audio/video stream