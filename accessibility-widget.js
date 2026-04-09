// ===================================================
// OMEC Accessibility Widget – תקן ישראלי 5568 / WCAG 2.0 AA
// ===================================================

const A11Y_CLASSES = ['a11y-contrast', 'a11y-grayscale', 'a11y-underline-links', 'a11y-readable-font', 'a11y-no-animations'];
const A11Y_STORAGE_KEY = 'omec-a11y-prefs';

function loadA11yPrefs() {
    try {
        const prefs = JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY) || '{}');
        A11Y_CLASSES.forEach(cls => {
            if (prefs[cls]) document.body.classList.add(cls);
        });
        if (prefs.fontSize) {
            document.documentElement.style.fontSize = prefs.fontSize;
        }
        A11Y_CLASSES.forEach(cls => {
            const btn = document.getElementById('a11y-btn-' + cls);
            if (btn && prefs[cls]) btn.setAttribute('aria-pressed', 'true');
        });
    } catch (e) {}
}

function saveA11yPrefs() {
    try {
        const prefs = {};
        A11Y_CLASSES.forEach(cls => {
            prefs[cls] = document.body.classList.contains(cls);
        });
        prefs.fontSize = document.documentElement.style.fontSize || '';
        localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {}
}

function toggleA11yClass(cls) {
    document.body.classList.toggle(cls);
    const btn = document.getElementById('a11y-btn-' + cls);
    if (btn) {
        const isActive = document.body.classList.contains(cls);
        btn.setAttribute('aria-pressed', String(isActive));
        btn.style.background = isActive ? 'rgba(119,90,25,0.15)' : 'rgba(255,255,255,0.05)';
        btn.style.borderColor = isActive ? '#775a19' : 'rgba(255,255,255,0.1)';
        btn.style.color = isActive ? '#dab36a' : '#e5e5e5';
    }
    saveA11yPrefs();
}

function changeFontSize(delta) {
    const current = parseFloat(document.documentElement.style.fontSize) || 16;
    const next = Math.min(Math.max(current + delta, 12), 26);
    document.documentElement.style.fontSize = next + 'px';
    const display = document.getElementById('a11y-font-size-val');
    if (display) display.textContent = Math.round((next / 16) * 100) + '%';
    saveA11yPrefs();
}

function resetA11y() {
    A11Y_CLASSES.forEach(cls => {
        document.body.classList.remove(cls);
        const btn = document.getElementById('a11y-btn-' + cls);
        if (btn) {
            btn.setAttribute('aria-pressed', 'false');
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.borderColor = 'rgba(255,255,255,0.1)';
            btn.style.color = '#e5e5e5';
        }
    });
    document.documentElement.style.fontSize = '16px';
    const display = document.getElementById('a11y-font-size-val');
    if (display) display.textContent = '100%';
    saveA11yPrefs();
}

function toggleA11yPanel() {
    const panel = document.getElementById('a11y-panel');
    const btn = document.getElementById('a11y-toggle-btn');
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
    btn.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) {
        panel.querySelector('button').focus();
    }
}

function createA11yWidget() {
    const widget = document.createElement('div');
    widget.id = 'a11y-widget';
    widget.innerHTML = `
        <!-- Accessibility Toggle Button -->
        <button id="a11y-toggle-btn"
            aria-label="כלי נגישות – פתח/סגור תפריט"
            aria-expanded="false"
            aria-haspopup="dialog"
            onclick="toggleA11yPanel()"
            style="position:fixed;bottom:90px;left:24px;z-index:1001;width:50px;height:50px;border-radius:50%;background:#0057b8;border:2px solid #fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,87,184,0.5);transition:transform 0.2s;"
            onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white" aria-hidden="true" focusable="false">
                <circle cx="12" cy="4" r="2"/>
                <path d="M12 7c-1.1 0-2 .9-2 2v4l-2 4h2l1-2h2l1 2h2l-2-4V9c0-1.1-.9-2-2-2z"/>
                <path d="M8.5 14.5c-.8 1.4-1.5 3-1.5 5h2c0-1.5.5-3 1.3-4.3L8.5 14.5z"/>
                <path d="M15.5 14.5l-1.8 0.7C14.5 16.5 15 18 15 19.5h2c0-2-.7-3.6-1.5-5z"/>
            </svg>
        </button>

        <!-- Accessibility Panel -->
        <div id="a11y-panel"
            role="dialog"
            aria-label="כלי נגישות"
            aria-modal="false"
            style="display:none;position:fixed;bottom:150px;left:24px;z-index:1001;width:280px;background:#111113;border:1px solid rgba(255,255,255,0.15);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.7);font-family:'Assistant',sans-serif;direction:rtl;">

            <!-- Panel Header -->
            <div style="background:#0057b8;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true"><circle cx="12" cy="4" r="2"/><path d="M12 7c-1.1 0-2 .9-2 2v4l-2 4h2l1-2h2l1 2h2l-2-4V9c0-1.1-.9-2-2-2z"/></svg>
                    <span style="font-weight:800;font-size:14px;color:#fff;">כלי נגישות</span>
                </div>
                <button onclick="toggleA11yPanel()" aria-label="סגור כלי נגישות"
                    style="background:none;border:none;cursor:pointer;color:#fff;font-size:20px;line-height:1;padding:0;">×</button>
            </div>

            <!-- Font Size -->
            <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <div style="font-size:11px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">גודל טקסט</div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <button onclick="changeFontSize(-2)" aria-label="הקטן טקסט"
                        style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#e5e5e5;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;">−</button>
                    <span id="a11y-font-size-val" style="flex:1;text-align:center;font-weight:800;font-size:14px;color:#dab36a;">100%</span>
                    <button onclick="changeFontSize(2)" aria-label="הגדל טקסט"
                        style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#e5e5e5;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;">+</button>
                </div>
            </div>

            <!-- Toggle Options -->
            <div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px;">
                <div style="font-size:11px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">אפשרויות תצוגה</div>

                <button id="a11y-btn-a11y-contrast" role="switch" aria-pressed="false"
                    onclick="toggleA11yClass('a11y-contrast')"
                    style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#e5e5e5;cursor:pointer;text-align:right;width:100%;font-family:'Assistant',sans-serif;font-size:13px;font-weight:600;transition:all 0.2s;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M12 2a10 10 0 010 20z" fill="currentColor" stroke="none"/></svg>
                    ניגודיות גבוהה
                </button>

                <button id="a11y-btn-a11y-grayscale" role="switch" aria-pressed="false"
                    onclick="toggleA11yClass('a11y-grayscale')"
                    style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#e5e5e5;cursor:pointer;text-align:right;width:100%;font-family:'Assistant',sans-serif;font-size:13px;font-weight:600;transition:all 0.2s;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
                    גווני אפור
                </button>

                <button id="a11y-btn-a11y-underline-links" role="switch" aria-pressed="false"
                    onclick="toggleA11yClass('a11y-underline-links')"
                    style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#e5e5e5;cursor:pointer;text-align:right;width:100%;font-family:'Assistant',sans-serif;font-size:13px;font-weight:600;transition:all 0.2s;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                    הדגשת קישורים
                </button>

                <button id="a11y-btn-a11y-readable-font" role="switch" aria-pressed="false"
                    onclick="toggleA11yClass('a11y-readable-font')"
                    style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#e5e5e5;cursor:pointer;text-align:right;width:100%;font-family:'Assistant',sans-serif;font-size:13px;font-weight:600;transition:all 0.2s;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                    גופן קריא (Arial)
                </button>

                <button id="a11y-btn-a11y-no-animations" role="switch" aria-pressed="false"
                    onclick="toggleA11yClass('a11y-no-animations')"
                    style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#e5e5e5;cursor:pointer;text-align:right;width:100%;font-family:'Assistant',sans-serif;font-size:13px;font-weight:600;transition:all 0.2s;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="3" x2="19" y2="21"/></svg>
                    עצור אנימציות
                </button>
            </div>

            <!-- Footer -->
            <div style="padding:10px 16px 14px;border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <button onclick="resetA11y()" aria-label="איפוס כל הגדרות הנגישות"
                    style="padding:8px 14px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#aaa;cursor:pointer;font-family:'Assistant',sans-serif;font-size:12px;font-weight:700;">
                    איפוס הכל
                </button>
                <a href="accessibility.html"
                    style="padding:8px 14px;border-radius:8px;background:rgba(0,87,184,0.2);border:1px solid rgba(0,87,184,0.4);color:#6ab0ff;font-family:'Assistant',sans-serif;font-size:12px;font-weight:700;text-decoration:none;">
                    הצהרת נגישות
                </a>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    // Close panel on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const panel = document.getElementById('a11y-panel');
            if (panel && panel.style.display !== 'none') {
                toggleA11yPanel();
                document.getElementById('a11y-toggle-btn').focus();
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    createA11yWidget();
    loadA11yPrefs();
    // Update font size display after load
    const current = parseFloat(document.documentElement.style.fontSize) || 16;
    const display = document.getElementById('a11y-font-size-val');
    if (display) display.textContent = Math.round((current / 16) * 100) + '%';
});
