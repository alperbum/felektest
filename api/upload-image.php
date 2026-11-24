<?php
header("Content-Type: application/json; charset=UTF-8");

// CORS: Yalnizca izin verilen kaynaklar
$allowedOrigins = [
    'https://www.felekmangalbasi.com',
    'https://felekmangalbasi.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Vary: Origin");
}
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "Method not allowed"]);
    exit;
}

// Yetkilendirme: Ortam degiskeni veya api/config.php uzerinden UPLOAD_API_TOKEN zorunlu
$configPath = __DIR__ . '/config.php';
if (is_file($configPath)) {
    require_once $configPath;
}
$expectedToken = getenv('UPLOAD_API_TOKEN');
if (!$expectedToken && defined('UPLOAD_API_TOKEN')) {
    $expectedToken = UPLOAD_API_TOKEN;
}
if (!$expectedToken) {
    http_response_code(503);
    echo json_encode(["ok" => false, "error" => "Upload endpoint yapilandirilmamis (UPLOAD_API_TOKEN eksik)."]);
    exit;
}

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
$providedToken = '';
if (preg_match('/^Bearer\s+(.+)$/i', trim($authHeader), $m)) {
    $providedToken = trim($m[1]);
}
if ($providedToken === '' || !hash_equals($expectedToken, $providedToken)) {
    http_response_code(401);
    echo json_encode(["ok" => false, "error" => "Yetkisiz istek."]);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Gecerli bir dosya yuklenmedi."]);
    exit;
}

$file = $_FILES['file'];

// Boyut siniri: 5 MB
$maxBytes = 5 * 1024 * 1024;
if ($file['size'] <= 0 || $file['size'] > $maxBytes) {
    http_response_code(413);
    echo json_encode(["ok" => false, "error" => "Dosya boyutu 5 MB sinirini asiyor."]);
    exit;
}

// Gercek MIME ve gorsel icerik dogrulamasi
$allowedMimes = [
    'image/webp' => 'webp',
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/gif'  => 'gif',
];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$detectedMime = $finfo->file($file['tmp_name']);
if (!isset($allowedMimes[$detectedMime]) || @getimagesize($file['tmp_name']) === false) {
    http_response_code(415);
    echo json_encode(["ok" => false, "error" => "Yalnizca gecerli WebP, JPEG, PNG veya GIF gorselleri yuklenebilir."]);
    exit;
}

$folder = isset($_POST['folder']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['folder']) : 'items';
if ($folder === '') {
    $folder = 'items';
}

$uploadDir = __DIR__ . '/../images/' . $folder . '/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$ext = $allowedMimes[$detectedMime];
$fileName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$targetPath = $uploadDir . $fileName;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $publicUrl = 'https://www.felekmangalbasi.com/images/' . $folder . '/' . $fileName;
    echo json_encode([
        "ok" => true,
        "url" => $publicUrl,
        "fileName" => $fileName,
        "folder" => $folder
    ]);
} else {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Dosya sunucuya kaydedilemedi."]);
}
