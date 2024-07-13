'use strict';

import * as fs from 'fs';
import bencode from 'bencode';
import * as tracker from './tracker.js';

const TORRENT = bencode.decode(fs.readFileSync('puppy.torrent'));

tracker.getPeers(TORRENT, peers => {
  console.log('list of peers: ', peers);
});