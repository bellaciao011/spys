<?php
// Acesso principal na raiz — serve o login Stalkea
$index = __DIR__ . '/index.html';
if (is_file($index)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($index);
    exit;
}
http_response_code(404);
echo 'Not found';
