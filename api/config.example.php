<?php
/**
 * Felek Mangalbaşı — yerel geri bildirim yapılandırması (ÖRNEK)
 * ---------------------------------------------------------------------------
 * KULLANIM:
 *   1) cp api/config.example.php api/config.php
 *   2) Gerçek değerleri yazın.
 *
 * api/config.php .gitignore içindedir; depoya GİRMEZ ve api/config.example.php
 * asla gerçek token içermez.
 *
 * Öncelik: ortam değişkeni (TG_BOT_TOKEN / TG_CHAT_ID) > bu dosya.
 * Bu dosyayı sunucuya yüklüyorsanız FTP ile değil, tercihen elle/panel
 * üzerinden bırakın; deploy_ftp.py bu dosyayı KASITLI olarak yüklemez.
 *
 * DİKKAT: Eski token git geçmişinde açıkta olduğu için BotFather > /revoke
 * ile yenilenmelidir.
 */

define('TG_BOT_TOKEN', 'BURAYA_BOTFATHER_TOKEN');
define('TG_CHAT_ID', 'BURAYA_CHAT_ID');
