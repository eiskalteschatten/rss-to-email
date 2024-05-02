<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once "config.php";

require "PHPMailer/Exception.php";
require "PHPMailer/PHPMailer.php";
require "PHPMailer/SMTP.php";

$fileDir = dirname(__FILE__);

$oneWeekAgo = new DateTime();
$oneWeekAgo->modify('-1 week');
$lastChecked = file_exists("{$fileDir}/.lastchecked") ? new DateTime(file_get_contents("{$fileDir}/.lastchecked")) : $oneWeekAgo;
$feeds = simplexml_load_file("{$fileDir}/feeds.opml") or die("Unable to find the \"feeds.opml\" file!");

$mail = new PHPMailer;
$mail->isSMTP();
$mail->CharSet = "UTF-8";
$mail->SMTPDebug = 0; // 0 = off (for production use) - 1 = client messages - 2 = client and server messages
$mail->Host = $EMAIL_SMTP_HOST;
$mail->Port = $EMAIL_SMTP_PORT;
$mail->SMTPSecure = 'tls';
$mail->SMTPAuth = true;
$mail->Username = $EMAIL_SMTP_USER;
$mail->Password = $EMAIL_SMTP_PASSWORD;

try {
    $db = new PDO("sqlite:{$fileDir}/feedcache.db");

    $stmt = $db->prepare("
        CREATE TABLE IF NOT EXISTS feeds_sent (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            link TEXT NOT NULL,
            date_sent DATETIME NOT NULL
        )
    ");

    $stmt->execute();
}
catch (PDOException $e) {
    echo $e->getMessage();
}

foreach ($feeds->body->outline as $folder) {
    $folderTitle = (string) $folder['title'];

    if ($DEBUG_MODE) {
        echo "Folder: {$folderTitle}\n";
    }

    foreach ($folder->outline as $feed) {
        $feedTitle = (string) $feed['title'];
        $xmlUrl = (string) $feed['xmlUrl'];
        $htmlUrl = (string) $feed['htmlUrl'];

        if ($DEBUG_MODE) {
            echo "Feed: {$feedTitle}\n";
            echo "XML URL: {$xmlUrl}\n";
            echo "HTML URL: {$htmlUrl}\n";
        }

        $curl_options = array(
            CURLOPT_URL            => $xmlUrl, // set the feed URL
            CURLOPT_RETURNTRANSFER => true,     // return web page
            CURLOPT_HEADER         => false,    // don't return headers
            CURLOPT_FOLLOWLOCATION => true,     // follow redirects
            CURLOPT_ENCODING       => "",       // handle all encodings
            CURLOPT_USERAGENT      => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0", // something like Firefox
            CURLOPT_AUTOREFERER    => true,     // set referer on redirect
            CURLOPT_CONNECTTIMEOUT => 120,      // timeout on connect
            CURLOPT_TIMEOUT        => 120,      // timeout on response
            CURLOPT_MAXREDIRS      => 10,       // stop after 10 redirects
        );

        $curl = curl_init();
        curl_setopt_array($curl, $curl_options);
        $content = curl_exec($curl);

        if (curl_error($curl)) {
            echo curl_error($curl);
        }

        curl_close($curl);

        libxml_use_internal_errors(true);
        $feedXml = simplexml_load_string($content);

        $is_rss = $feedXml !== false && (is_array($feedXml->channel->item) || is_object($feedXml->channel->item)) && count($feedXml->channel->item) > 0;
        $is_rdf = $feedXml !== false && (is_array($feedXml->item) || is_object($feedXml->item)) && count($feedXml->item) > 0;
        $is_atom = $feedXml !== false && (is_array($feedXml->entry) || is_object($feedXml->entry)) && count($feedXml->entry) > 0;

        if ($SEND_EMAILS && !$is_rss && !$is_rdf && !$is_atom) {
            $error = "Feed \"{$xmlUrl}\" could not be loaded!\n";
            $mail->setFrom($EMAIL_SMTP_FROM_EMAIL, "RSS To Email");
            $mail->addAddress($EMAIL_TO, $EMAIL_TO_NAME);
            $mail->Subject = "RSS To Email Could Not Load Feed";
            $mail->msgHTML($error);
            $mail->AltBody = $error;
            $mail->send();
            continue;
        }

        $items = [];

        if ($is_rss) {
            $items = $feedXml->channel->item;
        }
        elseif ($is_rdf) {
            $items = $feedXml->item;
        }
        elseif ($is_atom) {
            $items = $feedXml->entry;
        }

        $is_rss_rdf = $is_rss || $is_rdf;

        foreach ($items as $item) {
            $itemTitle = (string) $item->title;
            $itemTitle = html_entity_decode($itemTitle, ENT_QUOTES, 'UTF-8');
            $plainTextTitle = strip_tags($itemTitle);
            $itemLink = (string) $is_rss_rdf ? $item->link : $item->link['href'];
            $itemDescription = (string) $is_rss_rdf ? $item->description : $item->content;
            $itemPubDateStr = (string) $is_rss_rdf ? $item->pubDate : $item->updated;

            if ($DEBUG_MODE) {
                echo "Title: {$itemTitle}\n";
                echo "Link: {$itemLink}\n";
                echo "Description: {$itemDescription}\n";
                echo "Pub Date: {$itemPubDateStr}\n";
            }

            $itemPubDate = new DateTime($itemPubDateStr);

            if ($itemPubDate >= $lastChecked) {
                try {
                    $stmt = $db->prepare("SELECT * FROM feeds_sent WHERE title = :title AND link = :link");
                    $stmt->bindValue(':title', $plainTextTitle);
                    $stmt->bindValue(':link', $itemLink);
                    $stmt->execute();
                    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    if (count($results) > 0) {
                        continue;
                    }
                }
                catch (PDOException $e) {
                    echo $e->getMessage();
                }

                $subject = "{$itemTitle} :: Folder: {$folderTitle} :: Feed: {$feedTitle}";

                $body = "<html><body>";
                $body .= "<h2><a href=\"{$itemLink}\">{$itemTitle}</a></h2>";
                $body .= "<p>";
                $body .= "<a href=\"{$htmlUrl}\">{$feedTitle}</a>";
                $body .= "&nbsp;&nbsp;∙&nbsp;&nbsp;";
                $body .= "<span style=\"text-transform: uppercase; opacity: .6;\">{$itemPubDate->format('F j, Y H:i:s')}</span>";
                $body .= "</p>";
                $body .= $itemDescription;
                $body .= "<p><a href=\"{$itemLink}\">Read more...</a></p>";
                $body .= "</body></html>";

                if ($DEBUG_MODE) {
                    echo "Subject: {$subject}\n";
                    echo "Body: {$body}\n";
                }

                if (!$SEND_EMAILS) {
                    continue;
                }

                $mail->setFrom($EMAIL_SMTP_FROM_EMAIL, $feedTitle);
                $mail->addAddress($EMAIL_TO, $EMAIL_TO_NAME);
                $mail->Subject = $subject;
                $mail->msgHTML($body);
                $mail->AltBody = 'HTML messaging not supported';

                if (!$mail->send()) {
                    if ($DEBUG_MODE) {
                        echo "Mailer Error: " . $mail->ErrorInfo;
                    }
                }
                else {
                    if ($DEBUG_MODE) {
                        echo "Message sent!";
                    }

                    try {
                        $now = new DateTime();

                        $stmt = $db->prepare("INSERT INTO feeds_sent (title, link, date_sent) VALUES (:title, :link, :dateSent)");
                        $stmt->bindValue(':title', $plainTextTitle);
                        $stmt->bindValue(':link', $itemLink);
                        $stmt->bindValue(':dateSent', $now->format(DateTime::ATOM));
                        $stmt->execute();
                    }
                    catch (PDOException $e) {
                        echo $e->getMessage();
                    }

                    // Sleep for a second so as not to overwhelm the receiving server and (hopefully) avoid being marked as spam
                    sleep(1);
                }
            }
        }
    }

    if ($DEBUG_MODE) {
        echo "\n\n";
    }
}

$now = new DateTime();
file_put_contents("{$fileDir}/.lastchecked", $now->format(DateTime::ATOM));
