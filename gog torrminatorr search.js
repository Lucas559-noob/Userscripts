// ==UserScript==
// @name         GOG + GOGDB → Torrminatorr Search
// @namespace    https://github.com/Lucas559-noob/Userscripts
// @version      1.1
// @description  Adds a Torrminatorr search button on GOG.com and GOGDB game pages
// @author       Lucas559-noob
// @match        https://www.gog.com/game/*
// @match        https://www.gog.com/*/game/*
// @match        https://www.gogdb.org/product/*
// @icon         https://forum.torrminatorr.com/styles/torrminatorr/theme/images/site_logo.png
// @license      GPL-3.0-or-later
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const DEBUG = false;
    function log(...args) {
        if (DEBUG) console.log('[GOG→Torrminatorr]', ...args);
    }

    // Logo oficial do Torrminatorr
    const TORRMINATORR_LOGO_URL = 'https://forum.torrminatorr.com/styles/torrminatorr/theme/images/site_logo.png';

    function createSearchButton(title) {
        const keywords = encodeURIComponent(title);
        const fixedParams = 'terms=all&author=&fid%5B%5D=13&sc=1&sf=titleonly&sr=topics&sk=t&sd=d&st=0&ch=300&t=0&submit=Search';
        const searchUrl = `https://forum.torrminatorr.com/search.php?keywords=${keywords}&${fixedParams}`;

        const btn = document.createElement('a');
        btn.id = 'torrminatorr-btn';
        btn.href = searchUrl;
        btn.target = '_blank';
        btn.className = 'button button--big';
        btn.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0 24px;
            height: 48px;
            background: #2d2d2d;  /* tom escuro, combina com o fórum */
            color: white;
            border: 1px solid #444;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: background 0.2s, border-color 0.2s;
            white-space: nowrap;
        `;
        btn.addEventListener('mouseenter', () => {
            btn.style.background = '#3d3d3d';
            btn.style.borderColor = '#666';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = '#2d2d2d';
            btn.style.borderColor = '#444';
        });

        // Adiciona a logo
        const img = document.createElement('img');
        img.src = TORRMINATORR_LOGO_URL;
        img.style.cssText = 'height: 28px; width: auto; object-fit: contain; vertical-align: middle;';
        img.alt = '';
        // Fallback se a imagem falhar
        img.addEventListener('error', function() {
            img.style.display = 'none';
            const span = document.createElement('span');
            span.textContent = '🔍';
            span.style.fontSize = '18px';
            btn.prepend(span);
        });

        btn.appendChild(img);
        btn.appendChild(document.createTextNode(' Search on Torrminatorr'));

        return btn;
    }

    // ==========================================
    // GOG.COM
    // ==========================================
    function initGog() {
        log('Initializing GOG.com...');
        function insertButtonGog() {
            if (document.getElementById('torrminatorr-btn')) return;

            const buyNowBtn = document.querySelector('.buy-now-button');
            const titleEl = document.querySelector('h1.productcard-basics__title');
            if (!titleEl) {
                log('Title not found.');
                return;
            }
            const title = titleEl.textContent.trim();
            const btn = createSearchButton(title);

            if (buyNowBtn) {
                buyNowBtn.insertAdjacentElement('afterend', btn);
                log('Inserted after Buy now.');
                return;
            }

            const container = document.querySelector('.product-actions-body');
            if (container) {
                const mainDecider = container.querySelector('[main-button-decider]');
                if (mainDecider) {
                    mainDecider.appendChild(btn);
                } else {
                    container.appendChild(btn);
                }
                log('Inserted via fallback.');
            } else {
                log('Action container not found, retrying in 500ms.');
                setTimeout(insertButtonGog, 500);
            }
        }

        const observer = new MutationObserver((_, obs) => {
            if (document.querySelector('.buy-now-button') || document.querySelector('.product-actions-body')) {
                obs.disconnect();
                insertButtonGog();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        insertButtonGog();
        setTimeout(() => {
            if (!document.getElementById('torrminatorr-btn')) observer.disconnect();
        }, 8000);
    }

    // ==========================================
    // GOGDB.ORG
    // ==========================================
    function initGogdb() {
        log('Initializing GOGDB...');
        function insertButtonGogdb() {
            if (document.getElementById('torrminatorr-btn')) return;

            const storeBtn = document.getElementById('store-button');
            if (!storeBtn) {
                log('Store button not found, retrying in 500ms.');
                setTimeout(insertButtonGogdb, 500);
                return;
            }

            const titleEl = document.querySelector('h1.product-title');
            if (!titleEl) {
                log('Title not found (h1.product-title).');
                const href = storeBtn.getAttribute('href');
                const match = href && href.match(/\/game\/([^/?]+)/);
                if (match) {
                    const slug = decodeURIComponent(match[1]).replace(/_/g, ' ');
                    const btn = createSearchButton(slug);
                    storeBtn.insertAdjacentElement('afterend', btn);
                    log('Inserted with title extracted from URL.');
                    return;
                }
                log('Failed to obtain title.');
                return;
            }

            const title = titleEl.textContent.trim();
            const btn = createSearchButton(title);
            storeBtn.insertAdjacentElement('afterend', btn);
            log('Inserted after Store Page.');
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', insertButtonGogdb);
        } else {
            insertButtonGogdb();
        }
    }

    const host = window.location.hostname;
    const isGogHost = host === 'gog.com' || host.endsWith('.gog.com');
    const isGogdbHost = host === 'gogdb.org' || host.endsWith('.gogdb.org');
    if (isGogHost) {
        initGog();
    } else if (isGogdbHost) {
        initGogdb();
    }
})();
