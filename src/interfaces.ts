import { Item } from 'rss-parser';

export interface FeedCategory {
  title: string;
  feeds: Feed[];
}

export interface Feed {
  title: string;
  xmlUrl: string;
  htmlUrl: string;
}

interface OPMLElement {
  type: string;
  name?: string;
  text?: string;
  attributes?: {
    version?: string;
    type?: string;
    text?: string;
    title?: string;
    xmlUrl?: string;
    htmlUrl?: string;
  };
  elements?: OPMLElement[];
}

export interface OPML {
  declaration: {
    attributes: {
      version: string;
      encoding: string;
    };
  };
  elements: OPMLElement[];
}

export interface FeedData {
  categoryTitle: string;
  item: Item;
}

export interface FeedCacheItem {
  guid: string;
  pubDate: string;
  link: string;
}
