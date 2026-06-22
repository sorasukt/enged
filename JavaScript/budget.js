
        const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbynESsU9hxZ-MfZo2hSodAb7KsYvoWhhfLJnUcR_X5Qpmkxx5VQlmKUg1dNQbrAmtcN/exec';

        /* ─── Custom Dropdown ─── */
        const trigger = document.getElementById('selectTrigger');
        const dropdown = document.getElementById('customDropdown');
        const trigText = document.getElementById('triggerText');
        const realSelect = document.getElementById('category');

        function openDropdown() { trigger.classList.add('open'); dropdown.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); }
        function closeDropdown() { trigger.classList.remove('open'); dropdown.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); }

        trigger.addEventListener('click', () => { trigger.classList.contains('open') ? closeDropdown() : openDropdown(); });
        trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.classList.contains('open') ? closeDropdown() : openDropdown(); } if (e.key === 'Escape') closeDropdown(); });

        document.querySelectorAll('.dropdown-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const val = opt.dataset.value;
                const label = opt.querySelector('span:first-of-type').textContent;
                document.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                trigText.textContent = label;
                trigger.classList.add('has-value');
                realSelect.value = val;
                closeDropdown();
            });
        });

        document.addEventListener('click', e => { if (!document.getElementById('selectWrap').contains(e.target)) closeDropdown(); });

        /* ─── Calculate ─── */
        function calculateTotal() {
            const qty = parseFloat(document.getElementById('qty').value) || 0;
            const price = parseFloat(document.getElementById('price').value) || 0;
            const total = qty * price;
            document.getElementById('total').value = total > 0 ? total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
        }

        /* ─── File ─── */
        function formatFileSize(bytes) {
            if (bytes === 0) return "0 Bytes";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
        }

        function onFileChange(input) {
            const card = document.getElementById('fileSelectedCard');
            const zone = document.getElementById('fileZone');
            
            if (input.files.length > 0) {
                const file = input.files[0];
                const isImg = file.type.startsWith('image/');
                
                document.getElementById('fileCardName').textContent = file.name;
                document.getElementById('fileCardSize').textContent = formatFileSize(file.size);
                document.querySelector('#fileCardIcon i').className = isImg ? 'fa-regular fa-image' : 'fa-regular fa-file-pdf';
                
                card.classList.add('show');
                zone.style.display = 'none';
            } else {
                removeFile();
            }
        }

        function removeFile() {
            document.getElementById('file').value = "";
            document.getElementById('fileSelectedCard').classList.remove('show');
            document.getElementById('fileZone').style.display = 'block';
        }

        const fileZone = document.getElementById('fileZone');
        fileZone.addEventListener('dragover', e => { e.preventDefault(); fileZone.classList.add('drag-over'); });
        fileZone.addEventListener('dragleave', () => fileZone.classList.remove('drag-over'));
        fileZone.addEventListener('drop', e => { 
            e.preventDefault(); 
            fileZone.classList.remove('drag-over'); 
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                document.getElementById('file').files = e.dataTransfer.files;
                onFileChange(document.getElementById('file'));
            }
        });

        /* ─── Submit ─── */
        document.getElementById('budgetForm').addEventListener('submit', async e => {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            const status = document.getElementById('statusMessage');
            btn.disabled = true;
            btn.innerHTML = '<div class="loader-mini"></div><span>กำลังบันทึก...</span>';
            status.className = 'status-msg';
            const fileInput = document.getElementById('file');
            let fileBase64 = null, fileName = null, fileMimeType = null;
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                fileName = file.name;
                fileMimeType = file.type;
                fileBase64 = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = ev => resolve(ev.target.result);
                    reader.readAsDataURL(file);
                });
            }
            const payload = { date: document.getElementById('date').value, category: document.getElementById('category').value, details: document.getElementById('details').value, qty: document.getElementById('qty').value, price: document.getElementById('price').value, note: document.getElementById('note').value, fileName, fileMimeType, fileBase64 };
            try {
                const res = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) });
                const result = await res.json();
                if (result.status === 'success') {
                    status.innerHTML = '<i class="fa-solid fa-circle-check"></i> บันทึกข้อมูลและอัปโหลดไฟล์สำเร็จ';
                    status.className = 'status-msg success';
                    document.getElementById('budgetForm').reset();
                    document.getElementById('total').value = '';
                    trigText.textContent = 'กรุณาเลือกหมวดเงิน';
                    trigger.classList.remove('has-value');
                    document.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('selected'));
                    removeFile();
                } else { throw new Error(result.message); }
            } catch (err) {
                status.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> เกิดข้อผิดพลาด: ' + err.message;
                status.className = 'status-msg error';
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i><span>บันทึกข้อมูล</span>';
            }
        });

        /* ─── Auth0 Integration ─── */
        const AUTH0_DOMAIN = "litalkeducation.us.auth0.com";
        const AUTH0_CLIENT_ID = "PGqozL94LzOwstm4pD39W5kvalYRiK7w";
        const ALLOWED_EMAIL = "sb6740102220@lru.ac.th";
        let auth0Client = null;
        let userProfile = null;
        let isAuthenticated = false;
        let extractedStudentId = '';
        let isAvatarRemoved = false;

        function escHtml(str) {
            const d = document.createElement('div');
            d.textContent = str || '';
            return d.innerHTML;
        }

        function getCookie(name) {
            const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
            return v ? decodeURIComponent(v.pop()) : '';
        }

        function setCookie(name, value, days) {
            const d = new Date();
            d.setTime(d.getTime() + (days * 86400000));
            document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/';
        }

        function toast(text) {
            const t = document.getElementById('copyToast');
            const txt = document.getElementById('copyToastText');
            if (!t || !txt) return;
            txt.textContent = text;
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 2500);
        }

        function toggleUserDropdown(event) {
            event.stopPropagation();
            const menu = document.getElementById('userDropdownMenu');
            const btn = document.querySelector('.user-profile-btn');
            if (!menu) return;
            const isOpen = menu.classList.contains('show');
            if (isOpen) {
                menu.classList.remove('show');
                if (btn) btn.classList.remove('open');
            } else {
                menu.classList.add('show');
                if (btn) btn.classList.add('open');
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
                setTimeout(() => { drawer.style.display = 'none'; }, 250);
            } else {
                drawer.style.display = 'flex';
                drawer.offsetHeight;
                drawer.classList.add('open');
            }
        }

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

                const regex = /^sb(\d+)@lru\.ac\.th$/i;
                const match = (userProfile.email || '').match(regex);
                extractedStudentId = match ? match[1] : '';
                inputId.value = extractedStudentId || '—';

                const savedName = getCookie('att_name') || userProfile.name || userProfile.nickname || '';
                inputName.value = savedName;

                modal.classList.add('visible');
            }
        }

        function closeProfileModal() {
            const modal = document.getElementById('profileModal');
            if (modal) modal.classList.remove('visible');
        }

        const GAS_PROFILE_UPDATE_URL = "https://script.google.com/macros/s/AKfycbxz6ZQpBN-JcfA3eY0yaIQobiSTFiXRMl-SDWXLTaQMI5mvBUw81KlU0uC7NwPDkgqD/exec";

        async function saveProfileData() {
            const saveBtn = document.querySelector('.profile-btn.save');
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

                // ดึง Token ของผู้ใช้ปัจจุบันเพื่อยืนยันตัวตน
                const token = await auth0Client.getTokenSilently();



                const payload = {
                    access_token: token,
                    name: nameVal,
                    imageBase64: imageBase64,
                    imageMimeType: imageMimeType,
                    imageFileName: imageFileName
                };

                const res = await fetch(GAS_PROFILE_UPDATE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (data.error) throw new Error(data.error);

                setCookie('att_name', nameVal, 30);
                if (userProfile) {
                    userProfile.name = nameVal;
                    if (data.picture) userProfile.picture = data.picture;
                }

                updateAuthUI();
                closeProfileModal();
                toast('อัปเดตโปรไฟล์สำเร็จแล้ว');

            } catch (err) {
                console.error(err);
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
                reader.onload = function (e) {
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

        function updateAuthUI() {
            const authArea = document.getElementById('authHeaderArea');
            const drawerAuth = document.getElementById('drawerAuthArea');
            if (!authArea || !userProfile) return;

            const displayName = getCookie('att_name') || userProfile.name || userProfile.nickname || 'ผู้ดูแลระบบ';
            const avatarUrl = userProfile.picture || 'https://s3.ap-southeast-1.amazonaws.com/files.stnetradio.com/logo/ENGEDLOGO.ico';

            authArea.innerHTML = `
                <div class="user-dropdown-container">
                    <button class="user-profile-btn" onclick="toggleUserDropdown(event)">
                        <img src="${avatarUrl}" alt="Avatar" class="user-avatar-mini">
                        <span class="user-name-mini">${escHtml(displayName)}</span>
                        <i class="fa-solid fa-chevron-down dropdown-arrow"></i>
                    </button>
                    <div class="user-dropdown-menu" id="userDropdownMenu">
                        <div class="user-dropdown-header">
                            <img src="${avatarUrl}" alt="Avatar" class="user-avatar-large">
                            <div class="user-info-text">
                                <div class="user-name-full">${escHtml(displayName)}</div>
                                <div class="user-email-full">${escHtml(userProfile.email)}</div>
                            </div>
                        </div>
                        <div class="dd-divider"></div>
                        <button class="dd-item" onclick="openProfileModal()">
                            <i class="fa-solid fa-user-gear"></i>แก้ไขข้อมูลส่วนตัว
                        </button>
                        <button class="dd-item logout" onclick="logoutUser()">
                            <i class="fa-solid fa-arrow-right-from-bracket"></i>ออกจากระบบ
                        </button>
                    </div>
                </div>
            `;

            if (drawerAuth) {
                drawerAuth.innerHTML = `
                    <img src="${avatarUrl}" alt="Avatar" class="drawer-avatar">
                    <div class="drawer-username">${escHtml(displayName)}</div>
                    <div class="drawer-email">${escHtml(userProfile.email)}</div>
                    <button class="drawer-auth-btn secondary" onclick="openProfileModal()">
                        <i class="fa-solid fa-user-gear"></i>แก้ไขข้อมูลส่วนตัว
                    </button>
                    <button class="drawer-auth-btn logout" onclick="logoutUser()">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>ออกจากระบบ
                    </button>
                `;
            }
        }

        async function initAuth() {
            try {
                auth0Client = await auth0.createAuth0Client({
                    domain: AUTH0_DOMAIN,
                    clientId: AUTH0_CLIENT_ID,
                    cacheLocation: 'localstorage',
                    useRefreshTokens: true,
                    authorizationParams: {
                        redirect_uri: window.location.origin + window.location.pathname
                    }
                });
                const query = window.location.search;
                if (query.includes("state=") && (query.includes("code=") || query.includes("error="))) {
                    await auth0Client.handleRedirectCallback();
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
                isAuthenticated = await auth0Client.isAuthenticated();
                if (isAuthenticated) {
                    userProfile = await auth0Client.getUser();
                    if (userProfile.email === ALLOWED_EMAIL) {
                        showScreen('appScreen');
                        updateAuthUI();
                    } else {
                        document.getElementById('currentEmail').textContent = userProfile.email;
                        showScreen('deniedScreen');
                    }
                } else {
                    showScreen('authScreen');
                }
            } catch (err) {
                console.error("Auth0 init error:", err);
                showScreen('authScreen');
            }
        }

        function showScreen(screenId) {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('deniedScreen').style.display = 'none';
            document.getElementById('appScreen').style.display = 'none';
            if (screenId === 'appScreen') {
                document.getElementById('loginPage').classList.remove('show');
                document.getElementById('mainApp').classList.add('show');
                document.getElementById('appScreen').style.display = 'block';
            } else {
                document.getElementById('mainApp').classList.remove('show');
                document.getElementById('loginPage').classList.add('show');
                document.getElementById(screenId).style.display = 'block';
            }
        }

        async function loginUser() {
            if (auth0Client) await auth0Client.loginWithRedirect();
        }

        async function logoutUser() {
            if (auth0Client) {
                document.cookie = 'att_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                await auth0Client.logout({
                    logoutParams: { returnTo: window.location.origin + window.location.pathname }
                });
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            initAuth();
        });
    