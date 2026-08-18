<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
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

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Geçerli bir dosya yüklenmedi."]);
    exit;
}

$file = $_FILES['file'];
$folder = isset($_POST['folder']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['folder']) : 'items';
if (empty($folder)) {
    $folder = 'items';
}

$uploadDir = __DIR__ . '/../images/' . $folder . '/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, ['webp', 'jpg', 'jpeg', 'png', 'gif'])) {
    $ext = 'webp';
}

$fileName = time() . '_' . substr(md5(uniqid(mt_rand(), true)), 0, 8) . '.' . $ext;
$targetPath = $uploadDir . $fileName;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = !empty($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'www.felekmangalbasi.com';
    $publicUrl = $protocol . $host . '/images/' . $folder . '/' . $fileName;

    echo json_encode([
        "ok" => true,
        "url" => $publicUrl,
        "fileName" => $fileName,
        "folder" => $folder
    ]);
} else {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Dosya sunucuya kaydedilemedi. images klasörü yazma izinlerini kontrol edin."]);
}
