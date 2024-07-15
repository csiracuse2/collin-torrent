'use strict';

import * as dgram from 'dgram';
import * as buffer from 'buffer';
import { parse as urlParse } from 'url';
import * as crypto from 'crypto';
import * as torrentParser from './torrent-parser.js';
import * as util from './util.js';

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
      const ANNOUNCE_REQ = buildAnnounceReq(CONN_RESP.connectionId, TORRENT);
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

function buildAnnounceReq(connId, torrent, port=6881) {
  const BUF = Buffer.allocUnsafe(98);

  connId.copy(BUF, 0);

  buf.writeUInt32BE(1, 8);

  crypto.randomBytes(4).copy(BUF, 12);

  torrentParser.infoHash(torrent).copy(BUF, 16);

  util.genId().copy(BUF, 36);

  Buffer.alloc(8).copy(BUF, 56);
  
  torrentParser.size(torrent).copy(BUF, 64);

  Buffer.alloc(8).copy(BUF, 72);

  BUF.writeUInt32BE(0, 80);

  BUF.writeUInt32BE(0, 80);

  crypto.randomBytes(4).copy(BUF, 88);

  BUF.writeInt32BE(-1, 92);

  BUF.writeUInt16BE(port, 96)

  return BUF;
}

function parseAnnounceResp(resp) {
  function group(iterable, groupSize) {
    let groups = [];
    for(let i = 0; i < iterable.length; i += groupSize) {
        groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE,
    peers: group(resp.slice(20), 6).map(address => {return {
        ip: address.slice(0, 4).join('.'),
        port: address.readUint16BE(4)
        }
    })
  }
}