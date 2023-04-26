import fs from 'node:fs';
import xmljs from 'xml-js';

import { FEED_CONFIG_FILE } from './constants';

async function importOPML(): Promise<void> {
  const sourceFile = process.argv.slice(2)[0];

  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Your source file ("${sourceFile}") is invalid!`);
  }

  const feedsJson = xmljs.xml2json(sourceFile, {
    spaces: 2,
  });

  await fs.promises.writeFile(FEED_CONFIG_FILE, feedsJson);
}

importOPML();
