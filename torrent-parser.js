'use strict';

import * as fs from 'fs';
import * as bencode from 'bencode';

export function open(filepath) {
  return bencode.decode(fs.readFileSync(filepath));
};

export function size(torrent) {
  // ...
};

export function infoHash(torrent) {
  // ...
};