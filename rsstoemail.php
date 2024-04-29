<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once "config.php";

require "PHPMailer/Exception.php";
require "PHPMailer/PHPMailer.php";
require "PHPMailer/SMTP.php";

$oneWeekAgo = new DateTime();
$oneWeekAgo->modify('-1 week');
$lastChecked = file_exists(".lastchecked") ? new DateTime(file_get_contents(".lastchecked")) : $oneWeekAgo;
$feeds = simplexml_load_file("feeds.opml") or die("Unable to find the \"feeds.opml\" file!");

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
            CURLOPT_USERAGENT      => "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:18.0) Gecko/20100101 Firefox/18.0", // something like Firefox
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
        $rss = simplexml_load_string($content);

        if ($rss === false) {
            $error = "Feed \"{$xmlUrl}\" could not be loaded!\n";
            $mail->setFrom($EMAIL_SMTP_FROM_EMAIL, "RSS To Email");
            $mail->addAddress($EMAIL_TO, $EMAIL_TO_NAME);
            $mail->Subject = "RSS To Email Could Not Load Feed";
            $mail->msgHTML($error);
            $mail->AltBody = $error;
            $mail->send();
            continue;
        }

        foreach ($rss->channel->item as $item) {
            $itemTitle = (string) $item->title;
            $itemTitle = html_entity_decode($itemTitle, ENT_QUOTES, 'UTF-8');
            $itemLink = (string) $item->link;
            $itemDescription = (string) $item->description;
            $itemPubDateStr = (string) $item->pubDate;

            $itemPubDate = new DateTime($itemPubDateStr);

            if ($itemPubDate >= $lastChecked) {
                if ($DEBUG_MODE) {
                    echo "Title: {$itemTitle}\n";
                    echo "Link: {$itemLink}\n";
                    echo "Description: {$itemDescription}\n";
                    echo "Pub Date: {$itemPubDateStr}\n";
                }

                $subject = "{$itemTitle} :: Folder: {$folderTitle} :: Feed: {$feedTitle}";

                $body = "<html><body>";
                $body .= "<h1><a href=\"{$itemLink}\">{$itemTitle}</a></h1>";
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

                    // Sleep for a second so as not to overwhelm the receiving server and (hopefully) avoid being marked as spam
                    sleep(1);
                }
            }
        }
    }

    echo "\n\n";
}

$now = new DateTime();
file_put_contents(".lastchecked", $now->format(DateTime::ATOM));
