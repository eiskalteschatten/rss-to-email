import fs from 'node:fs';
import xmljs from 'xml-js';

import { FEED_CONFIG_FILE } from './constants';

async function importOPML(): Promise<void> {
  const sourceFile = process.argv.slice(2)[0];

  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Your source file ("${sourceFile}") is invalid!`);
  }

  console.log(`Importing from ${sourceFile}...`);

  const opml = await fs.promises.readFile(sourceFile, 'utf8');

  const feedsJson = xmljs.xml2json(opml, {
    spaces: 2,
  });

  // TODO: transform to a more usable structure before saving


  await fs.promises.writeFile(FEED_CONFIG_FILE, feedsJson);

  console.log(`Finished importing to ${FEED_CONFIG_FILE}`);
}

importOPML();
