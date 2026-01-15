document.addEventListener('DOMContentLoaded', () => {
    // Countdown Logic
    const countDownDate = new Date("Jan 16, 2026 12:00:00").getTime();
    const x = setInterval(function () {
        const now = new Date().getTime();
        const distance = countDownDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const daysEl = document.getElementById("days");
        if (daysEl) {
            daysEl.innerHTML = days < 10 ? "0" + days : days;
            document.getElementById("hours").innerHTML = hours < 10 ? "0" + hours : hours;
            document.getElementById("minutes").innerHTML = minutes < 10 ? "0" + minutes : minutes;
            document.getElementById("seconds").innerHTML = seconds < 10 ? "0" + seconds : seconds;
        }

        if (distance < 0) {
            clearInterval(x);
            const countdownEl = document.getElementById("countdown");
            if (countdownEl) {
                countdownEl.innerHTML = "<h2 style='color: var(--primary-red); font-size: 1.5rem;'>🎉 ระบบเปิดให้บริการแล้ว</h2>";
            }
        }
    }, 1000);

    // Chat & Auto-expand Textarea Logic
    const textarea = document.getElementById('userInput');

    textarea.addEventListener('input', function () {
        this.style.height = 'auto'; // Reset height
        this.style.height = (this.scrollHeight) + 'px'; // Set to scroll height
    });

    textarea.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent new line
            sendMessage();
        }
    });

    // Attach Listeners
    document.getElementById('toggleChatBtn').addEventListener('click', toggleChat);
    document.getElementById('closeChatBtn').addEventListener('click', toggleChat);
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
});

function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    const currentDisplay = window.getComputedStyle(chatWindow).display;

    if (currentDisplay === 'none') {
        chatWindow.style.display = 'flex';
        document.getElementById('userInput').focus();
    } else {
        chatWindow.style.display = 'none';
    }
}

function sendSuggestion(text) {
    const input = document.getElementById('userInput');
    input.value = text;
    sendMessage();
}

function addMessage(text, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.innerHTML = text;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// New Typewriter Function for AI messages
function typeWriterMessage(htmlText, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messagesDiv.appendChild(messageDiv);

    // Calculate text length for dynamic speed
    const textLength = htmlText.replace(/<[^>]*>/g, '').length;

    // Speed Calculation:
    // Short (< 50 chars): 40ms (slow & natural)
    // Medium (50-150 chars): 20ms
    // Long (> 150 chars): 5ms (fast)
    let speed = 20;
    if (textLength < 50) speed = 40;
    else if (textLength > 150) speed = 5;

    let i = 0;
    let currentHTML = '';

    function type() {
        if (i < htmlText.length) {
            // Handle HTML Tags (Skip typing, append instantly)
            if (htmlText.charAt(i) === '<') {
                const tagEnd = htmlText.indexOf('>', i);
                if (tagEnd !== -1) {
                    currentHTML += htmlText.substring(i, tagEnd + 1);
                    i = tagEnd + 1;
                    // Recursive call to skip delay for tags
                    type();
                    return;
                }
            }

            // Handle HTML Entities (e.g. &amp;)
            if (htmlText.charAt(i) === '&') {
                const entityEnd = htmlText.indexOf(';', i);
                if (entityEnd !== -1 && entityEnd - i < 10) {
                    currentHTML += htmlText.substring(i, entityEnd + 1);
                    i = entityEnd + 1;
                    messageDiv.innerHTML = currentHTML;
                    setTimeout(type, speed);
                    return;
                }
            }

            currentHTML += htmlText.charAt(i);
            messageDiv.innerHTML = currentHTML;
            i++;
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            setTimeout(type, speed);
        }
    }

    type();
}

function resetTextarea() {
    const textarea = document.getElementById('userInput');
    textarea.value = '';
    textarea.style.height = 'auto'; // Reset size
    textarea.disabled = false;
    textarea.focus();
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    const sendBtn = document.getElementById('sendBtn');

    if (!message) return;

    addMessage(message, 'user');

    input.disabled = true;
    sendBtn.disabled = true;

    const loadingId = 'loading-' + Date.now();
    const messagesDiv = document.getElementById('chatMessages');

    // New Loading Indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('typing-indicator');
    loadingDiv.id = loadingId;
    loadingDiv.innerHTML = `
                <span>✨ AI กำลังคิด</span>
                <div class="typing-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            `;
    messagesDiv.appendChild(loadingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
        // Call API with Retry Logic
        const aiResponseText = await callGeminiAPI(message);

        // Remove loading
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        // Parse Markdown
        const parsedResponse = marked.parse(aiResponseText);

        // Use Typewriter for AI response
        typeWriterMessage(parsedResponse, 'ai');

    } catch (error) {
        console.error('Final Error:', error);
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        // Friendly error message for user
        let errorMsg = 'ขออภัยครับ ระบบ AI ขัดข้องชั่วคราว ลองใหม่อีกครั้งนะครับ';
        if (error.message.includes('API Key is missing')) {
            errorMsg = 'กรุณาใส่ API Key ของคุณเพื่อใช้งาน (ระบบจะถามหา Key เมื่อคุณกดส่งข้อความใหม่)';
        }
        addMessage(errorMsg, 'ai');
    } finally {
        sendBtn.disabled = false;
        resetTextarea();
    }
}

// Helper function for exponential backoff and API Key management
async function callGeminiAPI(userMessage) {

    // 1. Try to get key from code (Preview env) or LocalStorage (Public env)
    let apiKey = "AIzaSyAVnHFCrWdeB1SsUymal-nvENSqvYnPMWw";
    const storedKey = localStorage.getItem('gemini_api_key');

    if (apiKey === "") {
        if (storedKey) {
            apiKey = storedKey;
        } else {
            // 2. Prompt user for key if missing
            const userKey = prompt("กรุณาใส่ Google Gemini API Key ของคุณเพื่อใช้งาน AI Chat (Key จะถูกบันทึกในเครื่องของคุณเท่านั้น):");
            if (userKey && userKey.trim() !== "") {
                apiKey = userKey.trim();
                localStorage.setItem('gemini_api_key', apiKey);
            } else {
                throw new Error("User cancelled API Key prompt");
            }
        }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [{ text: userMessage }]
        }],
        systemInstruction: {
            parts: [{
                text: `คุณคือผู้ช่วย AI ประจำหน้าแจ้งปิดปรับปรุงระบบ (Maintenance Bot) ที่เป็นมิตรและช่วยเหลือได้ดี 
                        ข้อมูลสำคัญ:
                        1. ระบบปิดปรับปรุงตั้งแต่วันที่ 12 มกราคม 2569 เวลา 23:00 น. ถึง 16 มกราคม 2569 เวลา 12.00 น.
                        2. ผู้ใช้ต้องรอก่อนถึงจะค้นหา Token Key ได้ (หลังระบบเปิด)
                        3. ถ้าผู้ใช้ถามเรื่อง Token Key ให้บอกว่า "ใจเย็นๆ นะครับ รอระบบเปิดตอนเที่ยงพรุ่งนี้แล้วจะค้นหาได้แน่นอน"
                        4. ถ้าผู้ใช้เบื่อ ชวนคุยเรื่องตลก หรือเล่าเกร็ดความรู้สั้นๆ สนุกๆ ได้
                        5. ตอบเป็นภาษาไทยเสมอ
                        6. ใช้ Markdown ในการจัดรูปแบบคำตอบให้อ่านง่าย เช่น ตัวหนา (**text**) หรือ รายการ (- item)`
            }]
        }
    };

    let delay = 1000; // Start delay at 1 second
    const maxRetries = 5;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // Handle Invalid Key Specifically
                if (response.status === 400) {
                    localStorage.removeItem('gemini_api_key'); // Clear bad key
                    throw new Error("API Key Invalid or Missing");
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            // Don't retry if it's an API Key issue
            if (error.message.includes("API Key")) throw error;

            console.warn(`Attempt ${i + 1} failed: ${error.message}`);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}
