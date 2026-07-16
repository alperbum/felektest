<?php
header("Content-Type: application/json; charset=UTF-8");

// Telegram Bot Bilgileri
// TODO: Bu alanları kendi Telegram bilgilerinizle doldurun
define('TG_BOT_TOKEN', '8721886347:AAHWTqfUt9AnfJbmIZGeQVkltIrSQ9bo6O4');
define('TG_CHAT_ID', '1585282829');

// CORS Ayarları
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "Method not allowed"]);
    exit;
}

// Gelen JSON verisini oku
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

$name = isset($input['name']) ? trim($input['name']) : '';
$message = isset($input['message']) ? trim($input['message']) : '';

if (empty($message)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Message is required"]);
    exit;
}

// Telegram mesaj metnini oluştur
$sanitizedName = htmlspecialchars(substr($name, 0, 100), ENT_QUOTES, 'UTF-8');
$sanitizedMsg = htmlspecialchars(substr($message, 0, 2000), ENT_QUOTES, 'UTF-8');

$text = "📋 <b>Felek Mangalbaşı – Yeni Geri Bildirim</b>\n\n";
if (!empty($sanitizedName)) {
    $text .= "👤 Ad: " . $sanitizedName . "\n";
}
$text .= "💬 Mesaj:\n" . $sanitizedMsg;

// Telegram API isteği
$url = "https://api.telegram.org/bot" . TG_BOT_TOKEN . "/sendMessage";
$data = [
    'chat_id' => TG_CHAT_ID,
    'text' => $text,
    'parse_mode' => 'HTML'
];

$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true
    ]
];

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);

if ($result === FALSE) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Failed to connect to Telegram"]);
    exit;
}

$response = json_decode($result, true);

if (isset($response['ok']) && $response['ok'] === true) {
    echo json_encode(["ok" => true]);
} else {
    http_response_code(502);
    echo json_encode(["ok" => false, "error" => $response['description'] ?? "Failed to send message"]);
}
