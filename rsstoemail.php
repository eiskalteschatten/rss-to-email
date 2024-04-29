<?php
require_once "config.php";

$twoWeeksAgo = new DateTime();
$twoWeeksAgo->modify('-2 weeks');
$lastChecked = file_exists(".lastchecked") ? new DateTime(file_get_contents(".lastchecked")) : $twoWeeksAgo;
$feeds = simplexml_load_file("feeds.opml") or die("Unable to find the \"feeds.opml\" file!");

foreach ($feeds->body->outline as $folder) {
    $folderTitle = (string) $folder['title'];
    echo "Folder: {$folderTitle}\n";

    foreach ($folder->outline as $feed) {
        $feedTitle = (string) $feed['title'];
        $xmlUrl = (string) $feed['xmlUrl'];
        $htmlUrl = (string) $feed['htmlUrl'];
        echo "Feed: {$feedTitle}\n";
        echo "XML URL: {$xmlUrl}\n";
        echo "HTML URL: {$htmlUrl}\n";

        $rss = simplexml_load_file($xmlUrl);

        if ($rss === false) {
            // TODO: email the error
            echo "Feed \"{$xmlUrl}\" could not be loaded!\n";
            continue;
        }

        foreach ($rss->channel->item as $item) {
            $itemTitle = (string) $item->title;
            $itemLink = (string) $item->link;
            $itemDescription = (string) $item->description;
            $itemPubDateStr = (string) $item->pubDate;

            $itemPubDate = new DateTime($itemPubDateStr);

            if ($itemPubDate >= $lastChecked) {
                echo "Title: {$itemTitle}\n";
                echo "Link: {$itemLink}\n";
                echo "Description: {$itemDescription}\n";
                echo "Pub Date: {$itemPubDateStr}\n";
            }
        }
    }

    echo "\n\n";
}

$now = new DateTime();
file_put_contents(".lastchecked", $now->format(DateTime::ATOM));
