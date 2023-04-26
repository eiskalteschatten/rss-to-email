import fs from 'node:fs';
import xmljs from 'xml-js';

import { FEED_CONFIG_FILE } from './constants';

class ImportExportFeeds {
  private feedConfigFile: string;

  constructor(private sourceFile: string) {}

  async importOPML(): Promise<void> {
    if (!this.sourceFileExists()) {
      throw new Error(`Your source file ("${this.sourceFile}") is invalid!`);
    }

    const feedsJson = xmljs.xml2json(this.sourceFile, {
      spaces: 2,
    });

    await fs.promises.writeFile(FEED_CONFIG_FILE, feedsJson);
  }

  private sourceFileExists(): boolean {
    return fs.existsSync(this.sourceFile);
  }
}

export default ImportExportFeeds;
