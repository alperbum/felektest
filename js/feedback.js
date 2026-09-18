/**
 * Felek Mangalbaşı — Geri bildirim formu istemcisi
 * ---------------------------------------------------------------------------
 * Güvenlik notu: Telegram bot token'ı ARTIK İSTEMCİDE DEĞİL. Token sunucu
 * tarafında (api/feedback.php, ortam değişkeni) tutulur; bu dosya yalnızca
 * aynı kaynaktaki uç noktaya POST eder.
 *
 * Eskiden bu kod Telegram Bot API'sine doğrudan çağrı yapıyordu ve token
 * sayfa kaynağında düz metin olarak duruyordu; token'ı okuyan herkes
 * işletmenin Telegram hesabına mesaj gönderebiliyordu.
 *
 * Durum renkleri artık satır içi stil değil, css/style.css'teki
 * .feedback-status.is-* sınıfları üzerinden verilir.
 */
(function () {
    'use strict';

    var ENDPOINT = 'api/feedback.php';
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

        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, message: message })
        })
            .then(function (res) {
                // PHP kapalıysa/404 dönerse gövde JSON olmaz; bu yüzden önce
                // HTTP durumuna bakıp JSON çözümlemesini ayrı yakalıyoruz.
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (data) {
                if (!data || data.ok !== true) throw new Error('ok=false');
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
