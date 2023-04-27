import fs from 'node:fs';
import xmljs from 'xml-js';

import { FEED_FILE } from './constants';
import { Feed, FeedCategory, OPML } from './interfaces';

function transform(feedsJson: string): FeedCategory[] {
  try {
    const parsedFeeds = JSON.parse(feedsJson) as OPML;
    const { elements } = parsedFeeds;
    const allFeeds: FeedCategory[] = [];

    for (const elementLayer1 of elements) {
      for (const elementLayer2 of elementLayer1.elements) {
        for (const elementLayer3 of elementLayer2.elements) {
          const category = elementLayer3.attributes;
          const feeds = elementLayer3.elements;
          const categoryFeeds: Feed[] = [];

          if (!category) {
            continue;
          }

          for (const feed of feeds) {
            const { attributes } = feed;

            if (!attributes || !attributes.title || !attributes.xmlUrl || !attributes.htmlUrl) {
              console.error(`Invalid feed for ${JSON.stringify(attributes)}! Skipping...`);
              continue;
            }

            categoryFeeds.push({
              title: attributes.title.trim(),
              xmlUrl: attributes.xmlUrl,
              htmlUrl: attributes.htmlUrl,
            });
          }

          allFeeds.push({
            title: category.title.trim() || 'Uncategorized',
            feeds: categoryFeeds,
          });
        }
      }
    }

    return allFeeds;
  }
  catch (error) {
    throw error;
  }
}

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

  const transformedFeeds = transform(feedsJson);
  await fs.promises.writeFile(FEED_FILE, JSON.stringify(transformedFeeds));

  console.log(`Finished importing to ${FEED_FILE}`);
}

importOPML();
