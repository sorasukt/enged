
        /* ════════════════════════════════════════
           ตั้งค่าระบบหลัก (Google Apps Script)
        ════════════════════════════════════════ */
        const TARGET_LAT = 17.5393285;
        const TARGET_LNG = 101.7193514;
        const MAX_DISTANCE_METERS = 100;
        const GAS_URL = "https://script.google.com/macros/s/AKfycbyUeKvVrU6Ut0S8hEFuWzCtBi4epI_PPrK-HW3QOWwe2OyhBkWQ8qUJGwpCDL8UKVRS/exec";

        // isAuthenticated และ extractedStudentId ประกาศใน auth.js แล้ว (global scope ร่วมกัน)
        let SCHEDULE = [];

        // แสดง loginPage เบื้องต้น (pre-auth state) พร้อมกัน fallback ซ่อน loadScreen
        document.addEventListener('DOMContentLoaded', () => {
            // ถ้าไม่มี skip/test mode ให้แสดง loginPage นอกจาก loadScreen
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('test') !== 'true' && urlParams.get('skip') !== 'true') {
                // auth0 จะเป็นคนซ่อน loadscreen แต่ให้บังคับซ่อนไว้เป็น safety fallback 5 วินาที
                setTimeout(() => hideLoadScreen(), 5000);
            }
        });

        document.addEventListener('authStateChanged', (e) => {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('test') === 'true') {
                isAuthenticated = true;
                verifyUserEmail('sb55555@lru.ac.th', 'นักศึกษาทดสอบ');
                return;
            }

            isAuthenticated = e.detail.isAuthenticated;
            
            if (isAuthenticated) {
                extractedStudentId = e.detail.extractedStudentId;
                verifyUserEmail(e.detail.userProfile.email, e.detail.displayName);
            } else {
                showAuthScreen();
            }
        });

        function verifyUserEmail(email, displayName = '') {
            const regex = /^sb(\d+)@lru\.ac\.th$/i;
            const match = email.match(regex);

            if (match) {
                extractedStudentId = match[1];
                const studentIdInput = document.getElementById('studentId');
                studentIdInput.value = extractedStudentId;
                studentIdInput.readOnly = true;
                studentIdInput.placeholder = 'กำลังโหลด...';
                const fieldHint = studentIdInput.nextElementSibling;
                if (fieldHint) {
                    fieldHint.innerHTML = '<i class="fa-solid fa-lock"></i>ดึงอัตโนมัติจากอีเมล';
                }
                document.getElementById('userEmailDisplay').textContent = "ล็อกอินด้วย: " + email;

                if (displayName) document.getElementById('name').value = displayName;

                showLoginPage(false);
                showMainApp(true);
                updateStatusUI();
                hideLoadScreen();
            } else {
                document.getElementById('invalidEmailDisplay').textContent = email;
                showInvalidEmail();
            }
        }



        let _toastTimer;
        function toast(msg) {
            const el = document.getElementById('copyToast');
            const toastText = document.getElementById('copyToastText');
            if (toastText) toastText.textContent = msg;
            if (el) {
                el.classList.add('show');
                clearTimeout(_toastTimer);
                _toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
            }
        }

        function escHtml(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

        /* ────────────────────────────────────────
           จัดการการแสดงหน้า
        ──────────────────────────────────────── */
        function showLoginPage(show) {
            const el = document.getElementById('loginPage');
            if (show) { el.classList.add('show'); }
            else { el.classList.remove('show'); }
        }

        function showMainApp(show) {
            const el = document.getElementById('mainApp');
            if (show) { el.classList.add('show'); }
            else { el.classList.remove('show'); }
        }

        function showAuthScreen() {
            document.getElementById('authScreen').style.display = 'block';
            document.getElementById('invalidEmailScreen').style.display = 'none';
            showLoginPage(true);
            showMainApp(false);
            hideLoadScreen();
        }

        function showInvalidEmail() {
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('invalidEmailScreen').style.display = 'block';
            showLoginPage(true);
            showMainApp(false);
            hideLoadScreen();
        }

        function hideLoadScreen() {
            const ls = document.getElementById('loadScreen');
            if (!ls || ls.style.display === 'none') return;
            if (!ls.classList.contains('fade-out')) {
                ls.classList.add('fade-out');
                // Fallback: บังคับซ่อนหลัง 500ms ถึงแม้ animationend ไม่ fire
                const forceHide = setTimeout(() => { ls.style.display = 'none'; }, 500);
                ls.addEventListener('animationend', () => {
                    clearTimeout(forceHide);
                    ls.style.display = 'none';
                }, { once: true });
            }
        }

        /* Show content within main app */
        function showScreen(screenId) {
            document.getElementById('closedScreen').classList.remove('show');
            document.getElementById('formContents').style.display = 'none';

            if (screenId === 'formContents') {
                document.getElementById('formContents').style.display = 'block';
            } else {
                document.getElementById(screenId).classList.add('show');
            }
        }

        /* ────────────────────────────────────────
           HELPERS & SCHEDULE
        ──────────────────────────────────────── */
        function parseGMT7(str) {
            const [date, time] = str.split(' ');
            const [y, mo, d] = date.split('-').map(Number);
            const [h, m] = time.split(':').map(Number);
            return new Date(y, mo - 1, d, h, m, 0).getTime();
        }
        function fmtTime(tsMs) {
            return new Date(tsMs).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false }) + ' น.';
        }
        function fmtDate(tsMs) {
            return new Intl.DateTimeFormat('th-TH', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(tsMs));
        }

        function slotStatus(slot) {
            const now = new Date().getTime();
            const open = parseGMT7(slot.open);
            const close = parseGMT7(slot.close);
            if (now >= open && now < close) return 'active';
            if (now < open) return 'upcoming';
            return 'closed';
        }

        function anySlotActive() { return SCHEDULE.some(s => slotStatus(s) === 'active'); }

        function renderSchedule() {
            const body = document.getElementById('scheduleBody');
            if (!body) return;
            if (SCHEDULE.length === 0) {
                body.innerHTML = `<div style="padding: 16px 18px; font-size: 13px; color: var(--ink-50); text-align: center;">ไม่มีตารางเวลาในระบบ</div>`;
                return;
            }
            body.innerHTML = SCHEDULE.map(slot => {
                const st = slotStatus(slot);
                const open = parseGMT7(slot.open);
                const close = parseGMT7(slot.close);
                const rowClass = st === 'active' ? 'active-slot' : st === 'upcoming' ? 'upcoming-slot' : 'closed-slot';
                const badgeClass = st === 'active' ? 'badge-open' : st === 'upcoming' ? 'badge-upcoming' : 'badge-closed';
                const badgeText = st === 'active' ? 'เปิดอยู่' : st === 'upcoming' ? 'กำลังจะเปิด' : 'ปิดแล้ว';
                return `
        <div class="schedule-row ${rowClass}">
            <div class="schedule-row-dot"></div>
            <div class="schedule-row-info">
                <div class="schedule-row-name">${slot.name}</div>
                <div class="schedule-row-time">${fmtDate(open)} &nbsp;·&nbsp; ${fmtTime(open)} – ${fmtTime(close)}</div>
            </div>
            <span class="schedule-row-badge ${badgeClass}">${badgeText}</span>
        </div>`;
            }).join('');
        }

        let _wasOpen = null;
        function updateStatusUI() {
            if (!isAuthenticated || !extractedStudentId) return;

            const isOpen = anySlotActive();
            const headerBadgeText = document.getElementById('headerBadgeText');
            const headerDot = document.getElementById('headerDot');

            if (isOpen) {
                showScreen('formContents');
                const active = SCHEDULE.find(s => slotStatus(s) === 'active');
                const closeTs = parseGMT7(active.close);
                document.getElementById('sbText').textContent = `เปิดถึง ${fmtTime(closeTs)} — กรุณากรอกข้อมูลให้ครบถ้วน`;
                document.getElementById('submitBtn').disabled = false;

                headerDot.style.background = '#16a34a';
                headerDot.style.animation = 'blink 2.4s ease infinite';
                headerBadgeText.textContent = 'ระบบเปิด';
                _wasOpen = true;
            } else {
                if (_wasOpen === true) {
                    document.getElementById('processOverlay').classList.remove('visible');
                }
                const upcoming = SCHEDULE.filter(s => slotStatus(s) === 'upcoming').sort((a, b) => parseGMT7(a.open) - parseGMT7(b.open));
                if (upcoming.length > 0) {
                    const next = upcoming[0];
                    const nextOpen = parseGMT7(next.open);
                    document.getElementById('closedTitle').textContent = 'ยังไม่ถึงเวลา';
                    document.getElementById('closedSub').textContent = 'ระบบยังไม่เปิดรับในขณะนี้ กรุณารอจนถึงเวลาที่กำหนด';
                    const nextBox = document.getElementById('nextSlotBox');
                    nextBox.style.display = 'flex';
                    document.getElementById('nextSlotName').textContent = next.name;
                    document.getElementById('nextSlotTime').textContent = `${fmtDate(nextOpen)} เวลา ${fmtTime(nextOpen)}`;
                } else {
                    const allClosed = SCHEDULE.length > 0 && SCHEDULE.every(s => slotStatus(s) === 'closed');
                    document.getElementById('closedTitle').textContent = allClosed ? 'หมดเวลากรอกข้อมูล' : 'ระบบปิดรับบันทึก';
                    document.getElementById('closedSub').textContent = 'ระบบปิดรับบันทึกการเข้าร่วมแล้วในขณะนี้';
                    const nextBox = document.getElementById('nextSlotBox');
                    nextBox.style.display = 'none';
                }
                showScreen('closedScreen');
                document.getElementById('submitBtn').disabled = true;

                headerDot.style.background = '#9ca3af';
                headerDot.style.animation = 'none';
                headerBadgeText.textContent = 'ระบบปิด';
                _wasOpen = false;
            }
        }

        function updateClock() {
            const el = document.getElementById('liveClock');
            if (el) el.textContent = new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' น.';
        }

        /* ────────────────────────────────────────
           COOKIES
        ──────────────────────────────────────── */
        const COOKIE_DAYS = 30;
        function setCookie(name, value, days) { const exp = new Date(Date.now() + days * 864e5).toUTCString(); document.cookie = `${name}=${encodeURIComponent(value)};expires=${exp};path=/;SameSite=Strict`; }
        function getCookie(name) { const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; }

        /* ────────────────────────────────────────
           INIT FLOW
        ──────────────────────────────────────── */
        /* ────────────────────────────────────────
           SKIP LOGIN (global — ต้องเรียกได้จาก inline onclick)
        ──────────────────────────────────────── */
        function skipLogin() {
            // ใช้ flag พิเศษแทน extractedStudentId เพื่อให้ updateStatusUI ทำงาน
            isAuthenticated = true;
            extractedStudentId = 'GUEST';
            
            const studentIdInput = document.getElementById('studentId');
            studentIdInput.value = '';
            studentIdInput.readOnly = false;
            studentIdInput.placeholder = 'กรอกรหัสนักศึกษา เช่น 6610111222';
            
            const fieldHint = studentIdInput.nextElementSibling;
            if (fieldHint) {
                fieldHint.innerHTML = '<i class="fa-solid fa-pen"></i>กรอกรหัสนักศึกษาด้วยตนเอง';
            }

            document.getElementById('userEmailDisplay').textContent = 'โหมดใช้งานโดยไม่เข้าสู่ระบบ';

            showLoginPage(false);
            showMainApp(true);
            updateStatusUI();
            hideLoadScreen();
        }

        window.addEventListener('load', () => {
            updateClock();

            // 1. ซิงค์ตารางเวลา (Non-blocking)
            fetch(GAS_URL)
                .then(r => r.json())
                .then(result => {
                    if (result.status === 'success') {
                        SCHEDULE = result.data;
                        renderSchedule();
                        // อัพเดต UI ทันทีที่ตารางเวลาโหลดเสร็จ
                        if (isAuthenticated && extractedStudentId) updateStatusUI();
                    }
                })
                .catch(e => console.warn('Schedule sync error:', e));

            renderSchedule();

            // 2. Auth0
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('test') === 'true') {
                isAuthenticated = true;
                verifyUserEmail('sb55555@lru.ac.th');
            } else if (urlParams.get('skip') === 'true') {
                skipLogin();
            } else {
                initAuth();
            }

            // 3. Real-time loop
            setInterval(() => {
                updateClock();
                renderSchedule();
                if (isAuthenticated && extractedStudentId) {
                    updateStatusUI();
                }
            }, 1000);
        });

        /* ────────────────────────────────────────
           PROCESS OVERLAY & SUBMIT
        ──────────────────────────────────────── */
        function openOverlay() {
            [1, 2, 3, 4].forEach(n => setStep(n, 'idle'));
            document.getElementById('processResult').className = 'process-result';
            document.getElementById('processResult').innerHTML = '';
            document.getElementById('processClose').classList.remove('show');
            document.getElementById('processClose').innerHTML = '<i class="fa-solid fa-check"></i><span>ตกลง</span>';
            document.getElementById('processOverlay').classList.add('visible');
        }
        function closeOverlay() { document.getElementById('processOverlay').classList.remove('visible'); updateStatusUI(); }
        function setStep(n, state, descText) {
            const el = document.getElementById('step-' + n);
            const dot = el.querySelector('.step-dot');
            const desc = document.getElementById('desc-' + n);
            el.className = 'step-item' + (state !== 'idle' ? ' ' + state : '');
            const icons = { active: 'fa-ellipsis', done: 'fa-check', error: 'fa-xmark' };
            dot.innerHTML = state === 'idle' ? `<span style="font-size:9px;font-weight:700;color:var(--ink-30)">${n}</span>` : `<i class="fa-solid ${icons[state]}"></i><div class="step-ring"></div>`;
            if (descText) desc.textContent = descText;
        }
        function showResult(msg, type) {
            const el = document.getElementById('processResult');
            const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
            el.className = 'process-result ' + type;
            el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${msg}</span>`;
            const btn = document.getElementById('processClose');
            btn.classList.add('show');
            if (type === 'error') btn.innerHTML = '<i class="fa-solid fa-rotate-left"></i><span>ลองใหม่</span>';
        }

        function startAttendanceProcess() {
            // GUEST mode: ต้องการชื่อแต่ไม่มี studentId จริง
            const isGuest = (extractedStudentId === 'GUEST');
            if (!anySlotActive() || (!extractedStudentId)) return;

            const studentIdVal = document.getElementById('studentId').value.trim();
            if (isGuest && !studentIdVal) {
                const el = document.getElementById('studentId');
                el.style.borderColor = '#dc2626';
                el.style.boxShadow = '0 0 0 3px rgba(220,38,38,.15)';
                setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 2000);
                toast('กรุณากรอกรหัสนักศึกษา');
                return;
            }

            const name = document.getElementById('name').value.trim();
            if (!name) {
                const el = document.getElementById('name');
                el.style.borderColor = '#dc2626';
                el.style.boxShadow = '0 0 0 3px rgba(220,38,38,.15)';
                setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 2000);
                toast('กรุณากรอกชื่อ–นามสกุล');
                return;
            }

            document.getElementById('submitBtn').disabled = true;
            setCookie('att_name', name, COOKIE_DAYS);
            openOverlay();

            setStep(1, 'active');
            setTimeout(() => {
                setStep(1, 'done', 'ข้อมูลถูกต้องและครบถ้วน');
                setStep(2, 'active');

                if (!('geolocation' in navigator)) {
                    setStep(2, 'error', 'เบราว์เซอร์นี้ไม่รองรับ GPS');
                    showResult('อุปกรณ์ไม่รองรับการระบุตำแหน่ง', 'error');
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    pos => onGotPosition(pos, isGuest ? studentIdVal : extractedStudentId, name),
                    err => {
                        const msgs = { 1: 'ปฏิเสธสิทธิ์ Location — กรุณาเปิดสิทธิ์แล้วลองใหม่', 2: 'รับสัญญาณ GPS ไม่ได้ในขณะนี้', 3: 'หมดเวลาค้นหาตำแหน่ง — กรุณาลองใหม่' };
                        setStep(2, 'error', msgs[err.code] ?? 'ไม่สามารถระบุตำแหน่งได้');
                        showResult(msgs[err.code] ?? 'เกิดข้อผิดพลาด GPS', 'error');
                    }, { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                );
            }, 600);
        }

        function onGotPosition(position, studentId, name) {
            const { latitude: lat, longitude: lng } = position.coords;
            setStep(2, 'done', `พิกัด ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            setStep(3, 'active');

            setTimeout(() => {
                const dist = haversine(lat, lng, TARGET_LAT, TARGET_LNG);
                if (dist > MAX_DISTANCE_METERS) {
                    setStep(3, 'error', `ระยะห่าง ${Math.round(dist)} ม. — เกินรัศมีที่กำหนด`);
                    showResult(`ตำแหน่งอยู่ห่างจากสถานที่ ${Math.round(dist)} ม. (อนุญาตไม่เกิน ${MAX_DISTANCE_METERS} ม.)`, 'error');
                    return;
                }

                setStep(3, 'done', `ระยะห่าง ${Math.round(dist)} ม. — อยู่ในพื้นที่กิจกรรม`);
                setStep(4, 'active');

                fetch(GAS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ studentId, name, lat, lng, distance: Math.round(dist) })
                }).then(r => r.json()).then(result => {
                    if (result.status === 'success') {
                        setStep(4, 'done', 'บันทึกข้อมูลเรียบร้อยแล้ว');
                        showResult('บันทึกการเข้าร่วมกิจกรรมสำเร็จ', 'success');
                        document.getElementById('name').value = '';
                    } else {
                        setStep(4, 'error', 'เซิร์ฟเวอร์ตอบกลับผิดพลาด');
                        showResult('เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: ' + result.message, 'error');
                    }
                }).catch(() => {
                    setStep(4, 'error', 'ไม่สามารถเชื่อมต่อได้');
                    showResult('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่', 'error');
                });
            }, 500);
        }

        function haversine(lat1, lon1, lat2, lon2) {
            const R = 6_371_000;
            const rad = v => v * Math.PI / 180;
            const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        /* ────────────────────────────────────────
           GPS ACCORDION & TABS (UX Redesign Helper)
           ──────────────────────────────────────── */
        function toggleGPSGuide(event) {
            if (event) event.preventDefault();
            const content = document.getElementById('gpsGuideContent');
            const chevron = document.getElementById('gpsChevron');
            if (content.style.maxHeight === '0px' || content.style.maxHeight === '' || !content.style.maxHeight) {
                content.style.maxHeight = content.scrollHeight + 'px';
                chevron.classList.add('rotated');
            } else {
                content.style.maxHeight = '0px';
                chevron.classList.remove('rotated');
            }
        }

        function switchGPSTab(event, tabId) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            const buttons = document.querySelectorAll('.gps-tab-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            if (event && event.currentTarget) {
                event.currentTarget.classList.add('active');
            }
            const panes = document.querySelectorAll('.gps-pane');
            panes.forEach(pane => pane.classList.remove('active'));
            document.getElementById('pane-' + tabId).classList.add('active');

            const content = document.getElementById('gpsGuideContent');
            content.style.maxHeight = content.scrollHeight + 'px';
        }
    
