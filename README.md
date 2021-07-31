# Klasse.io
![Preview](https://github.com/viandwi24/klasse-io-client/blob/master/static/screenshots/0.png?raw=true)
[![](https://img.shields.io/github/issues/devoverid/forum?style=flat-square)](https://img.shields.io/github/issues/devoverid/forum?style=flat-square) ![](https://img.shields.io/github/stars/devoverid/forum?style=flat-square)
![](https://img.shields.io/github/forks/devoverid/forum?style=flat-square) [](http://makeapullrequest.com) [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square)](https://GitHub.com/Naereen/StrapDown.js/graphs/commit-activity) [![GitHub Followers](https://img.shields.io/github/followers/viandwi24.svg?style=flat-square&label=Follow&maxAge=2592000)](https://github.com/viandwi24?tab=followers)

## What is Klasse.io?
A group video call with a mix of rpg games. Make the group atmosphere more interactive.
WebRTC based Video Stream with Peer connection. Then Signaling by WebSocket. With Client Built on NuxtJS as well as NodeJS server.

## Features
#### Video Group Call
![Preview](https://github.com/viandwi24/klasse-io-client/blob/master/static/screenshots/4.png?raw=true)
Video call build with WebRTC. For now, for handle all client connected we use Peer Connection with Mesh Topology.<br>
For complete documentation you can read in : 
  - https://webrtc.org
  - https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API

#### Video Call Limitation
![Preview](https://github.com/viandwi24/klasse-io-client/blob/master/static/screenshots/5.png?raw=true)
We are limited by the radius, players can only communicate within a predetermined radius like a drawn circle. This helps to isolate only players who are near us can communicate with us.
<br>
With exceptions, in the future we will create interactive features such as public rooms that will automatically remove this radius. or in a private room which will automatically also make private communication around the marked room.

#### Tile Based Game
![Preview](https://github.com/viandwi24/klasse-io-client/blob/master/static/screenshots/6.png?raw=true)
Since game maps are tile based, you can design with popular tile base map applications like "Tiled - Tile Map Maker".
<br>
Some simple tiles can be used such as the Draw Tile by Layer feature, then add a collision object with a rectangle shape.
<br>
You can read complete in :
  - Tiled - Tile Map Editor (https://www.mapeditor.org/)
  - Example Map : https://github.com/viandwi24/klasse-io-client/blob/master/static/map/demo3/demo3.json

#### Interactive Game
![Preview](https://github.com/viandwi24/klasse-io-client/blob/master/static/screenshots/1.png?raw=true)
we will soon create interactive features such as interactive boards, or projector screens for share screens, public and private rooms and other features.

#### and other features that will be in the future 
You can help in this open source project!

## Build Setup
This client requires a server in the form of Signaling Server and Peer server, you can found in :
  - Klasse-io Signaling Server (https://github.com/viandwi24/klasse-io-server)
  - Peer Server - (https://www.npmjs.com/package/peer)

```bash
# install dependencies
$ yarn install

# serve with hot reload at localhost:3000
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn nuxt generate
$ yarn start

# generate static project
$ yarn generate
```
