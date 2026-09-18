<?php
/**
 * Felek Mangalbaşı — Geri bildirim uç noktası (Telegram köprüsü)
 * ---------------------------------------------------------------------------
 * Token ASLA bu dosyada veya istemcide tutulmaz. Sıralama:
 *
 *   1) Ortam değişkeni  : TG_BOT_TOKEN / TG_CHAT_ID
 *      - IIS + PHP FastCGI: web.config <fastCgi><applicationSettings>
 *        <environmentVariables> bloğu (bkz. web.config içindeki örnek)
 *      - Linux/Apache:     SetEnv veya gerçek ortam değişkeni
 *   2) api/config.php   : git'e girmeyen yerel yapılandırma (bkz. api/config.example.php)
 *
 * İkisi de yoksa uç nokta 503 "not_configured" döner; istemci kullanıcıya
 * genel hata mesajını gösterir. Sessizce başarısız olmaz.
 *
 * Yanıtlar her zaman JSON: {"ok":true} veya {"ok":false,"error":"..."}
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
// CORS bilinçli olarak YOK: form aynı kaynaktan POST eder, tarayıcı tarafında
// cross-origin erişime gerek yoktur. Eski "Access-Control-Allow-Origin: *"
// satırı, herhangi bir sitenin bu uç noktayı kullanmasına izin veriyordu.

const RL_WINDOW = 600;   // saniye
const RL_MAX    = 5;     // pencere başına en fazla istek (IP başına)
const MSG_MAX   = 2000;
const NAME_MAX  = 100;

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Ortam değişkeni → sabit → boş dizesi sırasıyla okur. */
function cfg(string $key): string
{
    $val = getenv($key);
    if (is_string($val) && $val !== '') {
        return $val;
    }
    if (defined($key)) {
        $const = constant($key);
        if (is_string($const) && $const !== '') {
            return $const;
        }
    }
    return '';
}

/** Çok baytlı güvenli kırpma (mbstring zorunlu değil). */
function clip(string $s, int $max): string
{
    if (function_exists('mb_substr')) {
        return mb_substr($s, 0, $max, 'UTF-8');
    }
    // mbstring yoksa: karakter ortasında kesmemek için geçersiz UTF-8 kuyruğunu at
    $cut = substr($s, 0, $max * 4);
    $valid = @iconv('UTF-8', 'UTF-8//IGNORE', $cut);
    return $valid === false ? substr($cut, 0, $max) : $valid;
}

/** IP başına kayan pencere hız sınırı. Dosya tabanlı; kütüphane gerektirmez. */
function is_rate_limited(string $ip): bool
{
    $dir = sys_get_temp_dir() . '/felek_feedback_rl';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return false; // hız sınırı "best effort"; depolama yoksa formu kilitleme
    }

    // Fırsatçı temizlik: süresi geçmiş sayaç dosyalarını ara sıra sil
    if (random_int(1, 100) === 1 && is_dir($dir)) {
        foreach ((array) glob($dir . '/*.json') as $stale) {
            if (@filemtime($stale) < time() - RL_WINDOW * 2) {
                @unlink($stale);
            }
        }
    }

    $file = $dir . '/' . sha1($ip) . '.json';
    $fp = @fopen($file, 'c+');
    if ($fp === false) {
        return false;
    }
    @flock($fp, LOCK_EX);
    $now = time();
    $data = json_decode((string) stream_get_contents($fp), true);
    if (!is_array($data) || !isset($data['start'], $data['n']) || ($now - (int) $data['start']) > RL_WINDOW) {
        $data = ['start' => $now, 'n' => 0];
    }
    $data['n'] = (int) $data['n'] + 1;
    $limited = $data['n'] > RL_MAX;
    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, (string) json_encode($data));
    fflush($fp);
    @flock($fp, LOCK_UN);
    fclose($fp);
    return $limited;
}

/** Telegram Bot API'ye mesaj gönderir. Token asla loglanmaz/yanıtlanmaz. */
function tg_send(string $token, string $chatId, string $text): array
{
    $url = 'https://api.telegram.org/bot' . $token . '/sendMessage';
    $payload = (string) json_encode(
        ['chat_id' => $chatId, 'text' => $text, 'parse_mode' => 'HTML'],
        JSON_UNESCAPED_UNICODE
    );

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT        => 10,
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $err  = curl_error($ch);
        curl_close($ch);
        if ($body === false) {
            return ['ok' => false, 'transport' => $err !== '' ? $err : 'curl_error'];
        }
        $json = json_decode((string) $body, true);
        return [
            'ok'        => $code >= 200 && $code < 300 && is_array($json) && ($json['ok'] ?? false) === true,
            'transport' => is_array($json) ? (string) ($json['description'] ?? '') : 'invalid_json',
        ];
    }

    // curl yoksa akış bağlamı (allow_url_fopen gerekir)
    $ctx = stream_context_create(['http' => [
        'header'        => "Content-Type: application/json\r\n",
        'method'        => 'POST',
        'content'       => $payload,
        'timeout'       => 10,
        'ignore_errors' => true,
    ]]);
    $body = @file_get_contents($url, false, $ctx);
    if ($body === false) {
        return ['ok' => false, 'transport' => 'stream_error'];
    }
    $json = json_decode((string) $body, true);
    return [
        'ok'        => is_array($json) && ($json['ok'] ?? false) === true,
        'transport' => is_array($json) ? (string) ($json['description'] ?? '') : 'invalid_json',
    ];
}

/* -------------------------------------------------------------------------
   1) Yapılandırma
   ------------------------------------------------------------------------- */
$localConfig = __DIR__ . '/config.php';
if (is_file($localConfig)) {
    require_once $localConfig;
}

$token  = cfg('TG_BOT_TOKEN');
$chatId = cfg('TG_CHAT_ID');

/* -------------------------------------------------------------------------
   2) Yöntem ve kaynak doğrulama
   ------------------------------------------------------------------------- */
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    respond(204, []);
}
if ($method !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

const ALLOWED_HOSTS = [
    'www.felekmangalbasi.com',
    'felekmangalbasi.com',
    'localhost',
    '127.0.0.1',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $originHost = parse_url($origin, PHP_URL_HOST);
    if (!is_string($originHost) || !in_array(strtolower($originHost), ALLOWED_HOSTS, true)) {
        respond(403, ['ok' => false, 'error' => 'origin_not_allowed']);
    }
}

if ($token === '' || $chatId === '') {
    error_log('[felek/feedback] TG_BOT_TOKEN veya TG_CHAT_ID tanimli degil; istek reddedildi.');
    respond(503, ['ok' => false, 'error' => 'not_configured']);
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
if (is_rate_limited($ip)) {
    header('Retry-After: ' . RL_WINDOW);
    respond(429, ['ok' => false, 'error' => 'rate_limited']);
}

/* -------------------------------------------------------------------------
   3) Girdi doğrulama
   ------------------------------------------------------------------------- */
$raw = (string) file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
    respond(400, ['ok' => false, 'error' => 'invalid_json']);
}

$name    = clip(trim((string) ($input['name'] ?? '')), NAME_MAX);
$message = clip(trim((string) ($input['message'] ?? '')), MSG_MAX);

if ($message === '') {
    respond(400, ['ok' => false, 'error' => 'message_required']);
}

/* -------------------------------------------------------------------------
   4) Gönderim
   ------------------------------------------------------------------------- */
$escapedName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$escapedMsg  = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

$text = "<b>Felek Mangalbaşı - Yeni Geri Bildirim</b>\n\n";
if ($escapedName !== '') {
    $text .= $escapedName . "\n";
}
$text .= $escapedMsg;

$result = tg_send($token, $chatId, $text);

if (($result['ok'] ?? false) === true) {
    respond(200, ['ok' => true]);
}

// Ayrıntı sunucu logunda kalır, istemciye sızdırılmaz.
error_log('[felek/feedback] Telegram gonderimi basarisiz: ' . (string) ($result['transport'] ?? 'bilinmeyen'));
respond(502, ['ok' => false, 'error' => 'upstream_failed']);
