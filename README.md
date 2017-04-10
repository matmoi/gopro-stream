# gopro-stream

gopro-stream provides a library to capture and convert a media stream from GoPro Hero's camera preview

## Example 1 - dump stream to file
Check `./examples/gopro2file.js`. The program simply use goprostream to retrieve fMP4 segments and dump them in a `.mp4` file.

## Example 2 - livestream
gopro-stream allows you to live stream your GoPro Hero.

![Alt text](doc/architecture.png?raw=true "Overview")

GoPro Hero4 Silver introduced the possibility to preview the camera's stream over wifi, even while capturing. Preview is a mpegts format stream containing 2 tracks (+1 unknown) for audio and video. Video stream is encoded with h264 (Main), has a resolution of 432x240 and a framerate of 30 i/s. Audio stream is encoded using aac at 127 kb/s.

Our solution as shown above consists of three distinct components :
- __gateway__ is responsible for retrieving GoPro's camera preview, transmuxing it from mpegts to fragmented MP4, and pass it on the server.
- __server__ is used as a broadcaster, it receives stream from the gateway and transmit it to all connected clients via websockets.
- __clients__ are endpoints connected to the server via http requests. As such, received fragmented MP4 segments are rendered in a web browser using [MSE](http://www.w3.org/TR/media-source/) (no plugin required).

To run the app in a local environment, use :

```
npm start
```

It runs both server and gateway from the same machine (which must be connected to the GoPro beforehand). Then, open a web browser at the addess [http://127.0.0.1:8080](http://127.0.0.1:8080). Ideally, gateway and server would run on distinct machines as shown in the diagram.

### gateway

> Requirements
>> gateway must have two connection interfaces. One is required to connect to GoPro camera through wifi, the other is needed to forward stream to the server. It could be a cellular connection for mobile phones for instance, or a wired connection for computers.

- connected to GoPro via wifi
- rely on [goproh4](https://github.com/citolen/goproh4) npm package to control camera (notably start preview command)
- receive stream from GoPro on an incoming udp link using [dgram](https://nodejs.org/api/dgram.html)
- transmux stream using [mux.js](https://github.com/videojs/mux.js) npm package

### server

Simply an express http server delivering a simple http web page to display the fragmented MP4 packets as they arrive. Also a websocket server broadcasting incoming packets from the gatewy towards clients.

### clients

Initiate a connection to the websocket server, get fMP4 chunks and append them to MediaSource buffer.