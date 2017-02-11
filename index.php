<?php
header('Content-type: application/json');
$url = $_REQUEST['text'];
if (strpos($url, 'disq.us/p')) {
    $msgid = substr($url, strpos($url, 'disq.us/p') + 10);
    $msgid = base_convert($msgid, 36, 10);
} else {
    $msgid = substr($url, strpos($url, 'comment-') + 8);
}
$apikey = 'YOUR-API-KEY-HERE'
$res = json_decode(file_get_contents('https://disqus.com/api/3.0/posts/details.json?api_key='.$apikey.'&post='.$msgid));
$response = new stdClass();
$response->response_type = "in_channel";
$attachment = new stdClass();
$attachment->fallback = $res->response->raw_message;
$attachment->author_name = $res->response->author->username;
$attachment->author_icon = $res->response->author->avatar->small->permalink;
$attachment->text = $res->response->raw_message;
$attachment->color = "#2E9FFF";
$attachment->footer = "via Disqus";
$attachment->footer_icon = "https://a.disquscdn.com/dotcom/d-2407bda/img/brand/disqus-social-icon-white-blue.png";
$response->attachments = array($attachment);
echo(json_encode($response));
?>
