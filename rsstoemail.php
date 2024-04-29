<?php

require_once "config.php";

$feeds = simplexml_load_file("feeds.opml") or die("Unable to find the \"feeds.opml\" file!");

foreach ($feeds->body->outline as $folder) {
    echo "Folder: {$folder['title']}\n";

    foreach ($folder->outline as $feed) {
        echo "Feed: {$feed['title']}\n";
        echo "XML URL: {$feed['xmlUrl']}\n";
        echo "HTML URL: {$feed['htmlUrl']}\n";
    }

    echo "\n\n";
}
