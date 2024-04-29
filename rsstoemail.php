<?php
require_once "config.php";

$feeds = simplexml_load_file("feeds.opml") or die("Unable to find the \"feeds.opml\" file!");

foreach ($feeds->body->outline as $folder) {
    $folderTitle = (string) $folder['title'];
    echo "Folder: {$folderTitle}\n";

    foreach ($folder->outline as $feed) {
        $feedTitle = (string) $feed['title'];
        echo "Feed: {$feedTitle}\n";
        $xmlUrl = (string) $feed['xmlUrl'];
        echo "XML URL: {$xmlUrl}\n";
        $htmlUrl = (string) $feed['htmlUrl'];
        echo "HTML URL: {$htmlUrl}\n";

        $rss = simplexml_load_file($xmlUrl);

        if ($rss === false) {
            // TODO: email the error
            echo "Feed \"${xmlUrl}\" could not be loaded!\n";
            continue;
        }

        var_dump($rss);
    }

    echo "\n\n";
}
