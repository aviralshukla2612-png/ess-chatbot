<?php
/**
 * Indian Geo-IP DLT SMS Relay Proxy (Drop onto any Indian PHP host e.g. Hostinger Mumbai)
 * Forwards requests from overseas VPS (e.g. Contabo 95.111.242.173) to allsmssolution.in
 * where direct non-Indian IPs are dropped by NetMagic's India-only firewall.
 *
 * Set DLT_SMS_URI=https://your-indian-domain.com/indian-sms-relay.php in .env
 */

header('Content-Type: application/json; charset=utf-8');

$UPSTREAM = 'https://allsmssolution.in/sms-panel/api/http/index.php';
$params = array_merge($_GET, $_POST);

if (empty($params['apikey']) || empty($params['username']) || strtoupper(trim($params['username'])) !== 'EMPEROR') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized relay request']);
    exit;
}

$ch = curl_init();
$query = http_build_query($params);
curl_setopt_array($ch, [
    CURLOPT_URL            => $UPSTREAM . '?' . $query,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 8,
    CURLOPT_CONNECTTIMEOUT => 4,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => 0,
    CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; EmperorNexusRelay/1.0)',
]);

$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

if ($body === false) {
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'Relay error: ' . $err]);
    exit;
}

http_response_code($code ?: 200);
echo $body;
