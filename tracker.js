'use strict';

import * as dgram from 'dgram';
import * as buffer from 'buffer';
import { parse as urlParse } from 'url';
import * as crypto from 'crypto';

export function getPeers(torrent, callback) {
  const SOCKET = dgram.createSocket('udp4');
  const ANNOUNCE_URL = Buffer.from(torrent.announce).toString('utf8');

  //console.log(ANNOUNCE_URL);

  // 1. send connect request
  udpSend(SOCKET, buildConnReq(), ANNOUNCE_URL);

  SOCKET.on('message', RESPONSE => {
    if (respType(RESPONSE) === 'connect') {
      // 2. receive and parse connect response
      const CONN_RESP = parseConnResp(RESPONSE);
      // 3. send announce request
      const ANNOUNCE_REQ = buildAnnounceReq(CONN_RESP.connectionId);
      udpSend(SOCKET, ANNOUNCE_REQ, ANNOUNCE_URL);
    } else if (respType(RESPONSE) === 'announce') {
      // 4. parse announce response
      const ANNOUNCE_RESP = parseAnnounceResp(RESPONSE);
      // 5. pass peers to callback
      callback(ANNOUNCE_RESP.peers);
    }
  });
};

function udpSend(socket, message, rawUrl, callback=()=>{}) {
    
  const URL = urlParse(rawUrl);
  //console.log(rawUrl);
  console.log(URL);
  socket.send(message, 0, message.length, URL.port, URL.host, callback);
}

function respType(resp) {
  console.log(resp);
}

function buildConnReq() {
  const buf = Buffer.alloc(16);

  buf.writeUInt32BE(0x417, 0);
  buf.writeUInt32BE(0x27101980, 4);

  buf.writeUInt32BE(0, 8);

  crypto.randomBytes(4).copy(buf, 12);

  return buf;
}

function parseConnResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId:resp.readUInt32BE(4),
    connectionId: resp.slice(8)
  }
}

function buildAnnounceReq(connId) {
  // ...
}

function parseAnnounceResp(resp) {
  // ...
}