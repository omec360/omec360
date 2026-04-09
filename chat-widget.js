// ===================================================
// OMEC AI Chat Widget – Powered by Google Gemini
// ===================================================
// כדי להפעיל: החלף את GEMINI_API_KEY במפתח האמיתי שלך
// קבל מפתח חינם בכתובת: aistudio.google.com
// ===================================================

const GEMINI_API_KEY = 'AIzaSyBcvP3rZVBzi4SPeV41z88BxDIWPx1uzEE';

const SYSTEM_PROMPT = `
אתה עוזר וירטואלי של עומק – O.M.E.C Studio, חברה לתוכניות חינוך ייחודיות לבתי ספר.
המייסדים הם אור בן-מלך ומיכאלי גבעתי – שחקנים ואנשי חינוך עם מעל עשור ניסיון בעבודה עם נוער.

תפקידך: לענות בעברית על שאלות של נציגי בתי ספר (מנהלים, מורים, רכזים) ולעזור להם להבין איזו תוכנית מתאימה להם.
תמיד ענה בעברית. היה ידידותי, מקצועי ותמציתי. בסוף כל תשובה, הצע להם לתאם פגישת ייעוץ ללא עלות.

הנה המידע על כל התוכניות:

---
תוכנית 1: עומק 360 – "שפה. מצלמה. השפעה."
- סוג: תוכנית דגל שנתית
- אישור: מאושרת משרד החינוך – מערכת גפ"ן
- היקף: 30 מפגשים שנתיים
- מבנה: 3 מודולים – תיאטרון, קולנוע, דיגיטל
- תוצרים: 3 תוצרים פומביים לאורך השנה
- מה מפתחים: ביטחון עצמי, נוכחות מול קהל, שפה קולנועית, אחריות דיגיטלית
- מתאים ל: כל קבוצת גיל בחטיבה ותיכון, בתי ספר שרוצים תוכנית שנתית מקיפה

---
תוכנית 2: AI Visual Storytelling – "סיפור. דימוי. יצירה."
- סוג: תוכנית חדשנות וביטוי
- היקף: 24–30 מפגשים, 90 דקות כל שיעור
- שיטה: Project Based Learning (PBL)
- תוצר סופי: סרט קצר (45–90 שניות) מוקרן בטקס סיום בית ספרי חגיגי
- מבנה: 6 מודולים – כתיבת תסריט, שפה קולנועית, כתיבת פרומפטים ל-AI, סטוריבורד, יצירת וידאו ב-AI, עריכה סופית
- כלים: Midjourney, DALL-E, Runway, Pika, Premiere/CapCut
- מה מפתחים: אוריינות AI, ביטוי עצמי, יצירתיות, Storytelling
- מתאים ל: בתי ספר שרוצים תוכנית חדשנית עם טכנולוגיה

---
תוכנית 3: קורס דיבייט – "לחשוב. לדבר. לשכנע."
- קהל יעד: תלמידי חטיבת ביניים ותיכון (ז'–י"ב)
- מבנה: 7 יחידות
- השראה: NSDA (ארה"ב) ו-WSDC (בינלאומי)
- תוצר: טורניר דיבייט פנימי עם תעודות הצטיינות
- מה מפתחים: חשיבה ביקורתית, נאום, בניית טיעון, שכנוע, עבודת צוות
- מתאים ל: בתי ספר שרוצים לפתח חשיבה ביקורתית ודיבור בפומבי

---
תוכנית 4: מסלול מנהיגות והפקה בית-ספרית – "להוביל. להפיק. לשנות."
- קהל יעד: מועצת תלמידים
- היקף: 4 שעות שבועיות, שנת לימודים מלאה (~30 שבועות), סה"כ כ-120 שעות
- מבנה שנתי: 4 אירועים מובנים (2 אירועי ביניים + 2 אירועי עומק)
- תוצרים: תיק פרויקט דיגיטלי, דוח מסכם, מצגת להנהלה
- מה מפתחים: ניהול פרויקטים, בניית תקציב, עבודת צוות, קבלת החלטות תחת לחץ, אחריות ציבורית
- מתאים ל: בתי ספר שרוצים להעצים את מועצת התלמידים

---
יצירת קשר:
- WhatsApp: 054-987-8180
- אימייל: todaactt@gmail.com
- לפגישת ייעוץ חינם: דרך טופס הצור קשר באתר

כאשר שואלים איזו תוכנית מתאימה, שאל שאלות כמו: כמה תלמידים? איזה גיל? מה המטרה המרכזית?
`;

const conversationHistory = [];

function createChatWidget() {
    const widget = document.createElement('div');
    widget.id = 'omec-chat-widget';
    widget.innerHTML = `
        <!-- Chat Button -->
        <button id="chat-toggle" onclick="toggleChat()" aria-label="פתח צ'אט עוזר עומק" aria-expanded="false"
            style="position:fixed;bottom:24px;right:24px;z-index:1000;width:60px;height:60px;border-radius:50%;background:#775a19;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(119,90,25,0.4);display:flex;align-items:center;justify-content:center;transition:transform 0.2s;"
            onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                <line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="13" y2="14"/>
            </svg>
        </button>
        <div id="chat-badge" style="position:fixed;bottom:74px;right:20px;z-index:1000;background:#775a19;color:#fff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:20px;font-family:'Assistant',sans-serif;letter-spacing:0.05em;pointer-events:none;">AI</div>

        <!-- Chat Modal -->
        <div id="chat-modal" style="display:none;position:fixed;bottom:100px;right:24px;z-index:999;width:360px;max-width:calc(100vw - 48px);background:#111113;border:1px solid rgba(244,192,37,0.3);border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.6);font-family:'Assistant',sans-serif;direction:rtl;">
            <!-- Header -->
            <div style="background:#775a19;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;border-radius:50%;background:#fff;color:#775a19;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;">ע</div>
                    <div>
                        <div style="font-weight:800;font-size:15px;color:#fff;">עוזר עומק</div>
                        <div style="font-size:11px;color:#333;">מבוסס AI · זמין 24/7</div>
                    </div>
                </div>
                <button onclick="toggleChat()" aria-label="סגור צ'אט" style="background:none;border:none;cursor:pointer;font-size:22px;color:#fff;line-height:1;">×</button>
            </div>

            <!-- Messages -->
            <div id="chat-messages" style="height:320px;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;">
                <div class="bot-msg" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px 14px 14px 4px;padding:12px 14px;font-size:14px;line-height:1.6;color:#e5e5e5;max-width:85%;align-self:flex-start;">
                    שלום! אני העוזר הדיגיטלי של עומק 👋<br><br>
                    אשמח לעזור לך להבין איזו תוכנית מתאימה לבית הספר שלך. ספר לי קצת – על איזה גיל מדובר ומה המטרה שלכם?
                </div>
            </div>

            <!-- Input -->
            <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,0.1);display:flex;gap:8px;align-items:flex-end;">
                <textarea id="chat-input" placeholder="כתוב שאלה..." rows="1"
                    style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:10px 14px;color:#fff;font-family:'Assistant',sans-serif;font-size:14px;resize:none;outline:none;direction:rtl;line-height:1.5;"
                    onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage();}"
                    oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px'"></textarea>
                <button onclick="sendMessage()" id="send-btn"
                    style="background:#775a19;border:none;border-radius:10px;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity 0.2s;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                </button>
            </div>
            <div style="text-align:center;padding:8px;font-size:10px;color:#555;">מבוסס Gemini 2.0 AI</div>
        </div>
    `;
    document.body.appendChild(widget);
}

function toggleChat() {
    const modal = document.getElementById('chat-modal');
    const badge = document.getElementById('chat-badge');
    const isOpen = modal.style.display !== 'none';
    modal.style.display = isOpen ? 'none' : 'block';
    const toggleBtn = document.getElementById('chat-toggle');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(!isOpen));
    if (badge) badge.style.display = isOpen ? 'block' : 'none';
    if (!isOpen) {
        setTimeout(() => document.getElementById('chat-input')?.focus(), 100);
    }
}

function addMessage(text, isUser) {
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.style.cssText = isUser
        ? 'background:#775a19;color:#fff;border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:14px;line-height:1.6;max-width:85%;align-self:flex-end;font-weight:600;'
        : 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px 14px 14px 4px;padding:12px 14px;font-size:14px;line-height:1.6;color:#e5e5e5;max-width:85%;align-self:flex-start;';
    msg.innerText = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
}

function addTypingIndicator() {
    const container = document.getElementById('chat-messages');
    const typing = document.createElement('div');
    typing.id = 'typing-indicator';
    typing.style.cssText = 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:12px 16px;font-size:13px;color:#888;align-self:flex-start;';
    typing.innerText = '...';
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
    document.getElementById('typing-indicator')?.remove();
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    addMessage(text, true);
    conversationHistory.push({ role: 'user', parts: [{ text }] });

    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        addMessage('כדי להפעיל את העוזר הדיגיטלי, יש להוסיף מפתח API. לפגישת ייעוץ – WhatsApp: 054-987-8180', false);
        return;
    }

    addTypingIndicator();
    document.getElementById('send-btn').style.opacity = '0.5';

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    contents: conversationHistory,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
                })
            }
        );
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'אירעה שגיאה, נסה שוב.';
        removeTypingIndicator();
        addMessage(reply, false);
        conversationHistory.push({ role: 'model', parts: [{ text: reply }] });
    } catch {
        removeTypingIndicator();
        addMessage('אירעה שגיאה בחיבור. אפשר ליצור קשר ישירות ב-WhatsApp: 054-987-8180', false);
    }

    document.getElementById('send-btn').style.opacity = '1';
}

document.addEventListener('DOMContentLoaded', createChatWidget);
