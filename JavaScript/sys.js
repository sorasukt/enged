
        /* ════ CONFIG ════ */
        const GAS_URL = "https://script.google.com/macros/s/AKfycbxNif4pv3SL70z-xSRNHoU1fwvAEOwp7QmgqQZbH7yITzeWycZPKcbb0cSCu7g2TJiWog/exec";

        /* ════ AUTH0 CONFIG ════ */
        const AUTH0_DOMAIN = "litalkeducation.us.auth0.com";
        const AUTH0_CLIENT_ID = "PGqozL94LzOwstm4pD39W5kvalYRiK7w";

        let auth0Client = null;
        let isAuthenticated = false;
        let userProfile = null;
        let extractedStudentId = null;

        let _sid = '', _act = '', _monitorTimer;

        /* ════ LOADING SCREEN ════ */
        function lsUpdate(text, state = 'spin') {
            const dot = document.getElementById('lsDot');
            const txt = document.getElementById('lsText');
            txt.textContent = text;
            dot.className = 'ls-status-dot ' + state;
        }

        function lsProgress(pct) {
            document.getElementById('lsBar').style.width = pct + '%';
        }

        /* ════ INIT ════ */
        document.addEventListener('DOMContentLoaded', async () => {
            lsUpdate('กำลังเชื่อมต่อระบบ...', 'spin');
            lsProgress(15);

            // Parallel loading of Auth0 configuration and activities data
            const auth0Promise = (async () => {
                try {
                    await configureAuth0();
                    const query = window.location.search;
                    if (query.includes("state=") && (query.includes("code=") || query.includes("error="))) {
                        await auth0Client.handleRedirectCallback();
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                    await updateAuthUI();
                } catch (authError) {
                    console.error("Auth0 Init Error:", authError);
                    const authArea = document.getElementById('authHeaderArea');
                    if (authArea) {
                        authArea.innerHTML = `
                            <button class="login-header-btn" onclick="loginUser()">
                                <i class="fa-solid fa-arrow-right-to-bracket"></i> เข้าสู่ระบบ
                            </button>
                        `;
                    }
                    showStudentIdInput(true);
                }
            })();

            const activitiesPromise = (async () => {
                try {
                    const activities = await fetchActivitiesData();
                    populateActivities(activities);
                } catch (e) {
                    console.error("Activities Load Error:", e);
                    showConfigAlert(`เชื่อมต่อล้มเหลว: ${e.message}`);
                }
            })();

            // Wait for both tasks to complete concurrently
            await Promise.all([auth0Promise, activitiesPromise]);

            lsProgress(100);
            lsUpdate('พร้อมใช้งาน', 'ok');

            await delay(200);

            const ls = document.getElementById('loadScreen');
            if (ls) {
                ls.classList.add('fade-out');
                document.body.classList.add('visible');
                ls.addEventListener('animationend', () => ls.remove(), { once: true });
            } else {
                document.body.classList.add('visible');
            }

            setTimeout(() => {
                const infoModal = document.getElementById('infoModal');
                if (infoModal) infoModal.classList.add('visible');
            }, 300);

            const p = new URLSearchParams(location.search);
            const act = p.get('ActiviteCode') || p.get('a') || p.get('name') || p.get('activity');
            let sid = p.get('ID') || p.get('s') || p.get('id');

            if (isAuthenticated && extractedStudentId) {
                sid = extractedStudentId;
            }

            if (act && sid) {
                document.getElementById('studentId').value = sid;
                onIdInput(document.getElementById('studentId'));
                document.getElementById('triggerText').textContent = act;
                document.getElementById('selectTrigger').classList.add('has-value');
                document.getElementById('activitySelect').value = act;
                _act = act; _sid = sid;
                setTimeout(() => performSearch(sid, act), 800);
            }
        });

        /* ════ AUTH0 FUNCTIONS ════ */
        async function configureAuth0() {
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
            if (!auth0Client) return;
            try {
                await auth0Client.loginWithRedirect();
            } catch (error) {
                console.error("Login Error:", error);
            }
        }

        async function logoutUser() {
            if (!auth0Client) return;
            await auth0Client.logout({
                logoutParams: { returnTo: window.location.origin + window.location.pathname }
            });
        }

        async function updateAuthUI() {
            const authArea = document.getElementById('authHeaderArea');
            const drawerAuth = document.getElementById('drawerAuthArea');
            if (!authArea) return;

            try {
                isAuthenticated = await auth0Client.isAuthenticated();
                if (isAuthenticated) {
                    userProfile = await auth0Client.getUser();
                    
                    const displayName = getCookie('att_name') || userProfile.name || userProfile.nickname || 'นักศึกษา';
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

                    verifyUserEmail(userProfile.email);
                } else {
                    const loginBtnHtml = `
                        <button class="login-header-btn" onclick="loginUser()">
                            <i class="fa-solid fa-arrow-right-to-bracket"></i> เข้าสู่ระบบด้วย LRU Mail
                        </button>
                    `;
                    authArea.innerHTML = loginBtnHtml;

                    if (drawerAuth) {
                        drawerAuth.innerHTML = `
                            <div style="font-size:12px;color:var(--ink-50);margin-bottom:12px;">กรุณาเข้าสู่ระบบเพื่อใช้งานเมนูเต็มรูปแบบ</div>
                            <button class="drawer-auth-btn primary" onclick="loginUser()">
                                <i class="fa-solid fa-arrow-right-to-bracket"></i>เข้าสู่ระบบด้วย LRU Mail
                            </button>
                        `;
                    }

                    showStudentIdInput(true);
                }
            } catch (error) {
                console.error("Error updating Auth UI:", error);
                const fallbackLogin = `
                    <button class="login-header-btn" onclick="loginUser()">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i> เข้าสู่ระบบ
                    </button>
                `;
                authArea.innerHTML = fallbackLogin;

                if (drawerAuth) {
                    drawerAuth.innerHTML = `
                        <button class="drawer-auth-btn primary" onclick="loginUser()">
                            <i class="fa-solid fa-arrow-right-to-bracket"></i>เข้าสู่ระบบ
                        </button>
                    `;
                }

                showStudentIdInput(true);
            }
        }

        function verifyUserEmail(email) {
            const regex = /^sb(\d+)@lru\.ac\.th$/i;
            const match = email.match(regex);

            if (match) {
                extractedStudentId = match[1];
                const studentIdInput = document.getElementById('studentId');
                studentIdInput.value = extractedStudentId;
                onIdInput(studentIdInput);
                showStudentIdInput(false);
            } else {
                showStudentIdInput(true);
            }
        }

        function showStudentIdInput(show) {
            const studentIdField = document.getElementById('studentIdField');
            if (studentIdField) {
                if (show) {
                    studentIdField.classList.remove('hidden');
                } else {
                    studentIdField.classList.add('hidden');
                }
            }
        }

        /* ════ DROPDOWN & PROFILE FUNCTIONS ════ */
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

        function openProfileModal() {
            closeDropdowns();
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
                }

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
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('profileModalAvatar').src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        }

        /* ════ COOKIE HELPERS ════ */
        function setCookie(name, value, days) {
            const exp = new Date(Date.now() + days * 864e5).toUTCString();
            document.cookie = `${name}=${encodeURIComponent(value)};expires=${exp};path=/;SameSite=Strict`;
        }

        function getCookie(name) {
            const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
            return m ? decodeURIComponent(m[1]) : '';
        }

        async function fetchActivitiesData() {
            const r = await fetch(`${GAS_URL}?action=getActivities`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const ct = r.headers.get('content-type') || '';
            if (!ct.includes('application/json')) throw new Error('ได้รับ HTML แทน JSON');
            const data = await r.json();
            if (!Array.isArray(data)) throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
            return data;
        }

        function populateActivities(data) {
            const dropdown = document.getElementById('customDropdown');
            const realSel = document.getElementById('activitySelect');

            if (!data.length) {
                dropdown.innerHTML = '<div class="dropdown-empty">ไม่พบรายการกิจกรรม</div>';
                return;
            }

            dropdown.innerHTML = '';
            realSel.innerHTML = '<option value="" disabled selected></option>';

            data.forEach(act => {
                const div = document.createElement('div');
                div.className = 'dropdown-opt';
                div.dataset.value = act;
                div.innerHTML = `<span class="dropdown-opt-text">${escHtml(act)}</span><i class="fa-solid fa-check dd-check"></i>`;
                div.onclick = () => selectOption(act, act);
                dropdown.appendChild(div);

                const opt = document.createElement('option');
                opt.value = act; opt.text = act;
                realSel.appendChild(opt);
            });

            if (document.getElementById('triggerText').textContent.includes('กำลังโหลด')) {
                document.getElementById('triggerText').textContent = 'กรุณาเลือกกิจกรรม';
            }
        }

        function closeModal() { document.getElementById('infoModal').classList.remove('visible'); }

        function showConfigAlert(msg) {
            document.getElementById('alertMsg').textContent = msg;
            document.getElementById('configAlert').classList.add('show');
        }

        /* ════ ID INPUT ════ */
        function onIdInput(el) {
            el.value = el.value.replace(/[^0-9]/g, '');
            const len = el.value.length;
            document.getElementById('idCounter').textContent = `${len} / 10`;
            document.getElementById('idCounter').className = 'field-label-right' + (len === 10 ? ' complete' : '');

            const bar = document.getElementById('idBar');
            bar.style.width = `${len * 10}%`;
            bar.style.background = len === 10 ? '#16a34a' : len >= 6 ? 'var(--accent)' : 'var(--ink-30)';

            el.classList.toggle('complete', len === 10);
            el.classList.remove('invalid');
            refreshSearchBtn();
        }

        /* ════ DROPDOWN ════ */
        function toggleDropdown() {
            document.getElementById('selectTrigger').classList.contains('open') ? closeDropdown() : openDropdown();
        }

        function openDropdown() {
            document.getElementById('selectTrigger').classList.add('open');
            document.getElementById('customDropdown').classList.add('open');
        }

        function closeDropdown() {
            document.getElementById('selectTrigger').classList.remove('open');
            document.getElementById('customDropdown').classList.remove('open');
        }

        function handleSelectKey(e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
            if (e.key === 'Escape') closeDropdown();
        }

        document.addEventListener('click', e => {
            if (!document.getElementById('selectWrap').contains(e.target)) closeDropdown();
        });

        function selectOption(value, label) {
            document.getElementById('activitySelect').value = value;
            document.getElementById('triggerText').textContent = label;
            document.getElementById('selectTrigger').classList.add('has-value');
            document.querySelectorAll('.dropdown-opt').forEach(o => o.classList.remove('selected'));
            document.querySelector(`.dropdown-opt[data-value="${CSS.escape(value)}"]`)?.classList.add('selected');
            closeDropdown();
            _act = value;
            refreshSearchBtn();
        }

        function refreshSearchBtn() {
            const ok = !!document.getElementById('activitySelect').value
                && document.getElementById('studentId').value.length === 10;
            document.getElementById('searchBtn').disabled = !ok;
        }

        /* ════ SEARCH ════ */
        function searchData() {
            const act = document.getElementById('activitySelect').value;
            const sid = document.getElementById('studentId').value.trim();
            if (!act) { shake('selectTrigger'); return; }
            if (sid.length !== 10) { shake('studentId'); return; }
            performSearch(sid, act);
        }

        function shake(id) {
            const el = document.getElementById(id);
            el.classList.add('invalid');
            setTimeout(() => el.classList.remove('invalid'), 1800);
        }

        function performSearch(sid, act) {
            _sid = sid; _act = act;
            if (_monitorTimer) clearInterval(_monitorTimer);

            document.getElementById('formCard').classList.add('dimmed');
            document.getElementById('searchBtn').disabled = true;
            document.getElementById('searchBtn').innerHTML = '<div class="loader-mini"></div><span>กำลังค้นหา...</span>';

            hide('pendingCard'); hide('errorCard'); hide('resultArea');
            show('processCard');

            setPs(1, 'active'); setPs(2, 'idle'); setPs(3, 'idle');

            setTimeout(() => {
                setPs(1, 'done', 'ข้อมูลถูกต้อง พร้อมค้นหา');
                setPs(2, 'active');

                fetch(`${GAS_URL}?action=search&id=${encodeURIComponent(sid)}&criteria=${encodeURIComponent(act)}`)
                    .then(async r => {
                        if (!r.ok) throw new Error(r.status === 404 ? '404 — URL ผิด หรือยังไม่ได้ Deploy' : `HTTP ${r.status}`);
                        const ct = r.headers.get('content-type') || '';
                        if (!ct.includes('application/json')) throw new Error('ได้รับ HTML แทน JSON');
                        return r.json();
                    })
                    .then(data => {
                        setPs(2, 'done', 'รับข้อมูลสำเร็จ');
                        setPs(3, 'active');
                        setTimeout(() => {
                            setPs(3, 'done', 'พร้อมแสดงผล');
                            setTimeout(() => {
                                hide('processCard');
                                showResult(data);
                            }, 300);
                        }, 400);
                    })
                    .catch(e => {
                        setPs(2, 'error', e.message);
                        setTimeout(() => { hide('processCard'); showError(e); }, 500);
                    })
                    .finally(() => {
                        document.getElementById('searchBtn').innerHTML = '<i class="fa-solid fa-magnifying-glass"></i><span>ค้นหาข้อมูล</span>';
                        refreshSearchBtn();
                        document.getElementById('formCard').classList.remove('dimmed');
                    });
            }, 500);
        }

        /* ════ PROCESS STEPS ════ */
        function setPs(n, state, desc) {
            const el = document.getElementById('ps-' + n);
            const dot = el.querySelector('.ps-dot');
            const dEl = document.getElementById('psd-' + n);
            el.className = 'ps-item ' + state;
            const icons = { active: 'fa-ellipsis', done: 'fa-check', error: 'fa-xmark', idle: '' };
            dot.innerHTML = state === 'idle'
                ? `<span style="font-size:9px;font-weight:700;color:var(--ink-30)">${n}</span>`
                : `<i class="fa-solid ${icons[state]}"></i><div class="ps-ring"></div>`;
            if (desc && dEl) dEl.textContent = desc;
        }

        /* ════ SHOW RESULT / ERROR ════ */
        function showResult(data) {
            if (!data?.found) {
                document.getElementById('errorDetail').textContent = 'ไม่พบข้อมูลสำหรับรหัสนักศึกษานี้ในกิจกรรมที่เลือก';
                document.getElementById('technicalError').style.display = 'none';
                document.getElementById('deployHint').classList.add('hidden');
                show('errorCard'); return;
            }

            const activities = data?.data?.activities || [];

            if (activities.length > 0 && activities[0].code === 'กำลังดำเนินการ') {
                show('pendingCard'); return;
            }

            document.getElementById('resActivity').textContent = data.data?.activityName || '—';
            document.getElementById('resName').textContent = data.data?.name || '—';
            document.getElementById('resId').textContent = data.data?.studentId || '—';
            document.getElementById('resGroup').textContent = data.data?.group || '—';

            let html = '';
            activities.forEach((item, i) => {
                if (item.code || item.token) {

                    /* ดัก Bug กรณีไม่มี code หรือ token ส่งมา จะได้ไม่สร้างปุ่มว่างๆ */
                    let pills = '';
                    if (item.code) {
                        pills += `<div class="code-pill" onclick="copyText('${escHtml(item.code)}','รหัสกิจกรรม',this)">
                            <i class="fa-solid fa-hashtag"></i>
                            <span>${escHtml(item.code)}</span>
                            <i class="fa-regular fa-copy copy-icon"></i>
                          </div>`;
                    }
                    if (item.token) {
                        pills += `<div class="token-pill" onclick="copyText('${escHtml(item.token)}','Token Key',this)">
                            <i class="fa-solid fa-key"></i>
                            <span>${escHtml(item.token)}</span>
                            <i class="fa-regular fa-copy copy-icon"></i>
                          </div>`;
                    }

                    html += `
            <div class="token-card">
                <div class="token-card-head">รายการที่ ${i + 1}</div>
                <div class="token-card-body">
                    ${pills}
                </div>
            </div>`;
                }
            });

            document.getElementById('activitiesList').innerHTML = html || '<div style="font-size:12.5px;color:var(--ink-50);padding:4px 0">ไม่พบรายการ Token</div>';
            document.getElementById('shareBtn').style.display = 'flex';

            document.getElementById('searchSection').classList.add('hidden');
            show('resultArea');
        }

        function showError(e) {
            document.getElementById('errorDetail').textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
            const tech = document.getElementById('technicalError');
            tech.textContent = 'Technical: ' + e.message;
            tech.style.display = 'block';
            document.getElementById('deployHint').classList.toggle('hidden', !e.message.includes('404') && !e.message.includes('HTML'));
            show('errorCard');
        }

        function resetAll() {
            if (_monitorTimer) clearInterval(_monitorTimer);
            ['processCard', 'pendingCard', 'errorCard', 'resultArea'].forEach(hide);
            document.getElementById('monitoringBadge').classList.remove('show');
            document.getElementById('btnEnableNotify').style.display = '';
            document.getElementById('shareBtn').style.display = 'none';

            document.getElementById('searchSection').classList.remove('hidden');

            if (isAuthenticated && extractedStudentId) {
                document.getElementById('studentId').value = extractedStudentId;
                onIdInput(document.getElementById('studentId'));
            } else {
                document.getElementById('studentId').value = '';
                document.getElementById('idCounter').textContent = '0 / 10';
                document.getElementById('idCounter').className = 'field-label-right';

                /* แก้ Bug สีของ progress bar ค้างตอน reset */
                document.getElementById('idBar').style.width = '0';
                document.getElementById('idBar').style.background = 'var(--ink-30)';
                document.getElementById('studentId').classList.remove('complete', 'invalid');
            }
            refreshSearchBtn();

            if (window.history.pushState) {
                window.history.pushState({}, '', location.pathname);
            }
        }

        /* ════ COPY ════ */
        let _toastTimer;

        function copyText(txt, label, el) {
            if (!txt) return;
            navigator.clipboard.writeText(txt).then(() => {
                const icon = el?.querySelector('.copy-icon');
                if (icon) { icon.className = 'fa-solid fa-check copy-icon'; setTimeout(() => icon.className = 'fa-regular fa-copy copy-icon', 2000); }
                toast(`คัดลอก${label}แล้ว`);
            });
        }

        function toast(msg) {
            const el = document.getElementById('copyToast');
            document.getElementById('copyToastText').textContent = msg;
            el.classList.add('show');
            clearTimeout(_toastTimer);
            _toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
        }

        function copyResultLink() {
            const url = `${location.protocol}//${location.host}${location.pathname}?ActiviteCode=${encodeURIComponent(_act)}&ID=${encodeURIComponent(_sid)}`;
            navigator.clipboard.writeText(url).then(() => {
                const btn = document.getElementById('shareBtn');
                const orig = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i>คัดลอกแล้ว';
                setTimeout(() => btn.innerHTML = orig, 2000);
            });
        }

        /* ════ NOTIFICATIONS ════ */
        function enableNotification() {
            if (!('Notification' in window)) { alert('บราวเซอร์ไม่รองรับการแจ้งเตือน'); return; }
            Notification.requestPermission().then(p => {
                if (p === 'granted') startMonitoring();
                else alert('กรุณาอนุญาตการแจ้งเตือนในเบราว์เซอร์');
            });
        }

        function startMonitoring() {
            document.getElementById('btnEnableNotify').style.display = 'none';
            document.getElementById('monitoringBadge').classList.add('show');
            _monitorTimer = setInterval(() => {
                fetch(`${GAS_URL}?action=search&id=${encodeURIComponent(_sid)}&criteria=${encodeURIComponent(_act)}`)
                    .then(r => r.json())
                    .then(d => {
                        if (d?.found && d.data?.activities?.[0]?.code !== 'กำลังดำเนินการ') {
                            new Notification('Token มาแล้ว!', { body: 'คลิกเพื่อดูรหัสกิจกรรม', icon: 'https://s3.ap-southeast-1.amazonaws.com/files.stnetradio.com/logo/ENGEDLOGO.ico' });
                            clearInterval(_monitorTimer);
                            hide('pendingCard');
                            showResult(d);
                        }
                    });
            }, 60000);
        }

        /* ════ HELPERS ════ */
        function show(id) { document.getElementById(id).classList.remove('hidden'); }
        function hide(id) { document.getElementById(id).classList.add('hidden'); }
        function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
        function escHtml(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    