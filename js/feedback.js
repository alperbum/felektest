/**
 * Felek Mangalbaşı — Geri bildirim formu istemcisi
 * ---------------------------------------------------------------------------
 * Sunucuda (IIS / PleskWin) PHP çalışma ortamı bulunmadığı için
 * form mesajları doğrudan Telegram Bot API'sine iletilir.
 *
 * Durum renkleri css/style.css'teki .feedback-status.is-* sınıfları
 * üzerinden yönetilir.
 */
(function () {
    'use strict';

    var TG_TOKEN = (function() {
        var p = 'ODcyMTg4NjM0NzpBQUhXVHFmVXQ5QW5mSmJtSVpHZVFWa2x0SXJTUTlibzZPNA==';
        return typeof atob !== 'undefined' ? atob(p) : Buffer.from(p, 'base64').toString('utf8');
    })();
    var TG_CHAT_ID = '1585282829';
    var ENDPOINT = 'https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage';
    var MSG_LIMIT = 2000;

    var form = document.getElementById('feedback-form');
    if (!form) return;

    var nameInput = document.getElementById('feedback-name');
    var msgInput = document.getElementById('feedback-msg');
    var charCount = document.getElementById('feedback-char-count');
    var status = document.getElementById('feedback-status');
    var btn = document.getElementById('feedback-submit');

    /** Sözlükten çeviri okur; sözlük yoksa anahtarı döndürür (menu.html ile aynı desen). */
    function t(key) {
        var lang = localStorage.getItem('siteLang') || 'tr';
        if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key]) {
            return translations[lang][key];
        }
        return key;
    }

    function escapeHtml(text) {
        return (text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function setStatus(kind, message) {
        if (!status) return;
        status.classList.remove('is-pending', 'is-success', 'is-error');
        status.classList.add('is-' + kind);
        status.textContent = message;
    }

    if (msgInput && charCount) {
        msgInput.addEventListener('input', function () {
            charCount.textContent = (MSG_LIMIT - msgInput.value.length) + ' / ' + MSG_LIMIT;
        });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var name = nameInput ? nameInput.value.trim() : '';
        var message = msgInput ? msgInput.value.trim() : '';

        if (!message) return;

        if (btn) {
            btn.disabled = true;
            btn.textContent = t('feedback_sending');
        }
        setStatus('pending', '');

        var escapedName = escapeHtml(name);
        var escapedMsg = escapeHtml(message);
        var textMsg = "<b>Felek Mangalbaşı - Yeni Geri Bildirim</b>\n\n";
        if (escapedName) {
            textMsg += "👤 <b>Ad:</b> " + escapedName + "\n";
        }
        textMsg += "💬 <b>Mesaj:</b>\n" + escapedMsg;

        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TG_CHAT_ID,
                text: textMsg,
                parse_mode: 'HTML'
            })
        })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (data) {
                if (!data || data.ok !== true) throw new Error(data && data.description ? data.description : 'ok=false');
                setStatus('success', t('feedback_success'));
                form.reset();
                if (charCount) charCount.textContent = MSG_LIMIT + ' / ' + MSG_LIMIT;
            })
            .catch(function (err) {
                setStatus('error', t('feedback_error'));
                if (window.console && console.error) console.error('Geri bildirim gönderilemedi:', err);
            })
            .then(function () {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = t('feedback_btn');
                }
            });
    });
})();
