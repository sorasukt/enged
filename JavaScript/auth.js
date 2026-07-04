/* ════════════════════════════════════════
   ตั้งค่า AUTH0 (Centralized Auth Script)
════════════════════════════════════════ */
const AUTH0_DOMAIN = "litalkeducation.us.auth0.com";
const AUTH0_CLIENT_ID = "PGqozL94LzOwstm4pD39W5kvalYRiK7w";
const GAS_PROFILE_UPDATE_URL = "https://script.google.com/macros/s/AKfycbxz6ZQpBN-JcfA3eY0yaIQobiSTFiXRMl-SDWXLTaQMI5mvBUw81KlU0uC7NwPDkgqD/exec";

let auth0Client = null;
let isAuthenticated = false;
let userProfile = null;
let extractedStudentId = '';
let isAvatarRemoved = false;
let authInitError = null;

/* ════ INIT AUTH0 ════ */
async function initAuth() {
    const withTimeout = (promise, ms, description) => {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`${description} Timeout`)), ms);
        });
        return Promise.race([
            promise.then(val => {
                clearTimeout(timeoutId);
                return val;
            }),
            timeoutPromise
        ]);
    };

    try {
        await withTimeout(configureAuth0(), 8000, 'ConfigureAuth0');

        const query = window.location.search;
        if (query.includes("state=") && (query.includes("code=") || query.includes("error="))) {
            await withTimeout(auth0Client.handleRedirectCallback(), 15000, 'HandleRedirect');
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        await withTimeout(updateAuthUI(), 8000, 'UpdateAuthUI');
    } catch (error) {
        console.warn("Auth0 Init/Timeout Error:", error);
        authInitError = error;
        fallbackAuthUI();
    }
}

async function ensureAuth0Sdk() {
    if (window.auth0 && typeof window.auth0.createAuth0Client === 'function') return;

    // SDK จาก CDN โหลดไม่สำเร็จ (เช่น เครือข่ายหลุด, SRI hash ไม่ตรง, ตัวบล็อกสคริปต์)
    // ลองโหลดซ้ำอีกครั้งแบบ dynamic
    await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.js';
        s.async = true;
        s.onload = resolve;
        s.onerror = () => reject(new Error('โหลด Auth0 SDK ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้าเว็บ'));
        document.head.appendChild(s);
    });

    if (!(window.auth0 && typeof window.auth0.createAuth0Client === 'function')) {
        throw new Error('ไม่พบตัวแปร auth0 (Auth0 SDK ไม่ถูกโหลด) กรุณารีเฟรชหน้าเว็บ');
    }
}

async function configureAuth0() {
    await ensureAuth0Sdk();
    auth0Client = await auth0.createAuth0Client({
        domain: AUTH0_DOMAIN,
        clientId: AUTH0_CLIENT_ID,
        cacheLocation: 'localstorage',
        useRefreshTokens: true,
        authorizationParams: {
            redirect_uri: window.location.origin + window.location.pathname
        }
    });
}

async function loginUser() {
    if (!auth0Client) {
        if (!window.isSecureContext) {
            alert("ระบบยืนยันตัวตน (Auth0) ไม่สามารถทำงานบน HTTP บนมือถือได้เนื่องจากข้อจำกัดด้านความปลอดภัยของเบราว์เซอร์\n\nกรุณาทดสอบผ่านการเชื่อมต่อแบบปลอดภัย (HTTPS) เช่น ลิงก์ GitHub Pages หรือผ่าน tunneling (เช่น ngrok)");
        } else {
            alert("ระบบขัดข้อง: " + (authInitError ? authInitError.message : "ไม่สามารถเริ่มต้นระบบล็อกอินได้") + "\nกรุณารีเฟรชหน้าเว็บ");
        }
        return;
    }
    try {
        await auth0Client.loginWithRedirect();
    } catch (error) {
    }
}

async function logoutUser() {
    if (!auth0Client) return;
    setCookie('att_name', '', -1);
    await auth0Client.logout({
        logoutParams: { returnTo: window.location.origin + window.location.pathname }
    });
}

/* ════ AUTH UI ════ */
async function updateAuthUI() {
    const authArea = document.getElementById('authHeaderArea');
    const drawerAuth = document.getElementById('drawerAuthArea');

    try {
        isAuthenticated = await auth0Client.isAuthenticated();
        if (isAuthenticated) {
            userProfile = await auth0Client.getUser();
            
            const regex = /^sb(\d+)@lru\.ac\.th$/i;
            const match = (userProfile.email || '').match(regex);
            extractedStudentId = match ? match[1] : '';

            const displayName = getCookie('att_name') || userProfile.name || userProfile.nickname || 'นักศึกษา';
            const avatarUrl = userProfile.picture || 'https://s3.ap-southeast-1.amazonaws.com/files.stnetradio.com/logo/ENGEDLOGO.ico';

            if (authArea) {
                authArea.innerHTML = `
                    <div class="user-dropdown-container">
                        <button class="user-profile-btn" onclick="toggleUserDropdown(event)">
                            <img src="${avatarUrl}" alt="Avatar" class="user-avatar-mini">
                            <span class="user-name-mini">${authEscHtml(displayName)}</span>
                            <i class="fa-solid fa-chevron-down dropdown-arrow"></i>
                        </button>
                        <div class="user-dropdown-menu" id="userDropdownMenu">
                            <div class="user-dropdown-header">
                                <img src="${avatarUrl}" alt="Avatar" class="user-avatar-large">
                                <div class="user-info-text">
                                    <div class="user-name-full">${authEscHtml(displayName)}</div>
                                    <div class="user-email-full">${authEscHtml(userProfile.email)}</div>
                                </div>
                            </div>
                            <div class="dropdown-divider"></div>
                            <button class="dropdown-item" onclick="openProfileModal()">
                                <i class="fa-solid fa-user-gear"></i>แก้ไขข้อมูลส่วนตัว
                            </button>
                            <button class="dropdown-item logout" onclick="logoutUser()">
                                <i class="fa-solid fa-arrow-right-from-bracket"></i>ออกจากระบบ
                            </button>
                        </div>
                    </div>
                `;
            }

            if (drawerAuth) {
                drawerAuth.innerHTML = `
                    <img src="${avatarUrl}" alt="Avatar" class="drawer-avatar">
                    <div class="drawer-username">${authEscHtml(displayName)}</div>
                    <div class="drawer-email">${authEscHtml(userProfile.email)}</div>
                    <button class="drawer-auth-btn secondary" onclick="openProfileModal()">
                        <i class="fa-solid fa-user-gear"></i>แก้ไขข้อมูลส่วนตัว
                    </button>
                    <button class="drawer-auth-btn logout" onclick="logoutUser()">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>ออกจากระบบ
                    </button>
                `;
            }

            // Dispatch event for page-specific logic
            document.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isAuthenticated: true, userProfile, extractedStudentId, displayName }
            }));

        } else {
            fallbackAuthUI();
        }
    } catch (error) {
        fallbackAuthUI(true);
    }
}

function fallbackAuthUI(isError = false) {
    const authArea = document.getElementById('authHeaderArea');
    const drawerAuth = document.getElementById('drawerAuthArea');
    
    if (authArea) {
        authArea.innerHTML = `
            <button class="login-header-btn" onclick="loginUser()">
                <i class="fa-solid fa-arrow-right-to-bracket"></i> เข้าสู่ระบบ${!isError ? 'ด้วย LRU Mail' : ''}
            </button>
        `;
    }

    if (drawerAuth) {
        drawerAuth.innerHTML = `
            ${!isError ? '<div style="font-size:12px;color:var(--ink-50);margin-bottom:12px;">กรุณาเข้าสู่ระบบเพื่อใช้งานเมนูเต็มรูปแบบ</div>' : ''}
            <button class="drawer-auth-btn primary" onclick="loginUser()">
                <i class="fa-solid fa-arrow-right-to-bracket"></i>เข้าสู่ระบบ${!isError ? 'ด้วย LRU Mail' : ''}
            </button>
        `;
    }
    
    document.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { isAuthenticated: false }
    }));
}

/* ════ DROPDOWN & MENU ════ */
function toggleUserDropdown(event) {
    event.stopPropagation();
    const menu = document.getElementById('userDropdownMenu');
    const btn = document.querySelector('.user-profile-btn');
    if (!menu || !btn) return;
    const isShown = menu.classList.contains('show');
    closeDropdowns();
    if (!isShown) {
        menu.classList.add('show');
        btn.classList.add('open');
    }
}

function closeDropdowns() {
    const menu = document.getElementById('userDropdownMenu');
    const btn = document.querySelector('.user-profile-btn');
    if (menu) menu.classList.remove('show');
    if (btn) btn.classList.remove('open');
}

document.addEventListener('click', () => {
    closeDropdowns();
});

function toggleMobileMenu(event) {
    if (event) event.stopPropagation();
    const drawer = document.getElementById('mobileMenuDrawer');
    if (!drawer) return;
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
        drawer.classList.remove('open');
        setTimeout(() => {
            drawer.style.display = 'none';
        }, 250);
    } else {
        drawer.style.display = 'flex';
        drawer.offsetHeight;
        drawer.classList.add('open');
    }
}

/* ════ PROFILE MODAL ════ */
function openProfileModal() {
    closeDropdowns();
    isAvatarRemoved = false;
    const errorMsgEl = document.getElementById('profileModalAvatarError');
    if (errorMsgEl) {
        errorMsgEl.style.display = 'none';
        errorMsgEl.textContent = '';
    }
    const modal = document.getElementById('profileModal');
    const avatar = document.getElementById('profileModalAvatar');
    const email = document.getElementById('profileModalEmail');
    const inputName = document.getElementById('profileInputName');
    const inputId = document.getElementById('profileInputId');

    if (modal && userProfile) {
        avatar.src = userProfile.picture || 'https://s3.ap-southeast-1.amazonaws.com/files.stnetradio.com/logo/ENGEDLOGO.ico';
        email.textContent = userProfile.email || '—';
        inputId.value = extractedStudentId || '—';
        
        const savedName = getCookie('att_name') || userProfile.name || userProfile.nickname || '';
        if (inputName) inputName.value = savedName;

        modal.classList.add('visible');
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.classList.remove('visible');
}

async function saveProfileData() {
    const saveBtn = document.querySelector('.profile-btn.save');
    if (!saveBtn) return;
    const origBtnText = saveBtn.innerHTML;
    
    const inputName = document.getElementById('profileInputName');
    const fileInput = document.getElementById('profileUploadInput');
    
    const nameVal = inputName ? inputName.value.trim() : '';
    if (!nameVal) {
        alert('กรุณากรอกชื่อ-นามสกุล');
        return;
    }

    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';
    saveBtn.disabled = true;

    try {
        let imageBase64 = null;
        let imageMimeType = null;
        let imageFileName = null;

        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            imageMimeType = file.type;
            imageFileName = file.name;
            
            imageBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        } else if (isAvatarRemoved) {
            imageBase64 = 'DELETE';
        }

        if (!auth0Client) {
            throw new Error('ระบบยืนยันตัวตนยังไม่พร้อม กรุณารีเฟรชหน้าเว็บแล้วลองใหม่');
        }

        let token;
        try {
            token = await auth0Client.getTokenSilently();
        } catch (tokenErr) {
            throw new Error('เซสชันหมดอายุ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่');
        }

        // ส่ง access_token ใน body เพราะ Google Apps Script ไม่รองรับ
        // Authorization header (จะทำให้เกิด CORS preflight แล้ว fetch ล้มเหลว)
        const payload = {
            access_token: token,
            name: nameVal,
            imageBase64: imageBase64,
            imageMimeType: imageMimeType,
            imageFileName: imageFileName
        };

        const res = await fetch(GAS_PROFILE_UPDATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`เซิร์ฟเวอร์ตอบกลับผิดพลาด (${res.status})`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setCookie('att_name', nameVal, 30);
        if (userProfile) {
            userProfile.name = nameVal;
            if (data.picture) userProfile.picture = data.picture;
        }
        
        updateAuthUI();
        closeProfileModal();
        
        // Show toast or alert
        if (typeof toast === 'function') {
            toast('อัปเดตโปรไฟล์สำเร็จแล้ว');
        } else if (typeof authToast === 'function') {
            authToast('อัปเดตโปรไฟล์สำเร็จแล้ว');
        } else {
            alert('อัปเดตโปรไฟล์สำเร็จแล้ว');
        }
        
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์: ' + err.message);
    } finally {
        saveBtn.innerHTML = origBtnText;
        saveBtn.disabled = false;
    }
}

function previewProfileImage(event) {
    const file = event.target.files[0];
    if (file) {
        const errorMsgEl = document.getElementById('profileModalAvatarError');
        if (errorMsgEl) {
            errorMsgEl.style.display = 'none';
            errorMsgEl.textContent = '';
        }
        if (file.size > 2 * 1024 * 1024) {
            if (errorMsgEl) {
                errorMsgEl.textContent = 'ขนาดไฟล์เกิน 2MB';
                errorMsgEl.style.display = 'block';
            } else {
                alert('ขนาดไฟล์เกิน 2MB');
            }
            event.target.value = '';
            return;
        }
        isAvatarRemoved = false;
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profileModalAvatar').src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
}

function removeProfileImage() {
    const avatar = document.getElementById('profileModalAvatar');
    const fileInput = document.getElementById('profileUploadInput');
    if (avatar) {
        avatar.src = 'https://s3.ap-southeast-1.amazonaws.com/files.stnetradio.com/logo/ENGEDLOGO.ico';
    }
    if (fileInput) {
        fileInput.value = '';
    }
    isAvatarRemoved = true;
    const errorMsgEl = document.getElementById('profileModalAvatarError');
    if (errorMsgEl) {
        errorMsgEl.style.display = 'none';
        errorMsgEl.textContent = '';
    }
}

/* ════ UTILS ════ */
function setCookie(name, value, days) {
    const exp = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${exp};path=/;SameSite=Strict`;
}

function getCookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
}

function authEscHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Optional Auth Toast for profile update
let _authToastTimer;
function authToast(msg) {
    const t = document.getElementById('copyToast');
    const txt = document.getElementById('copyToastText');
    if (t && txt) {
        txt.textContent = msg;
        t.classList.add('show');
        clearTimeout(_authToastTimer);
        _authToastTimer = setTimeout(() => t.classList.remove('show'), 2000);
    } else {
        alert(msg);
    }
}
