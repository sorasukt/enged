
        /* ════ CONFIG ════ */
        const GAS_URL = "https://script.google.com/macros/s/AKfycbxNif4pv3SL70z-xSRNHoU1fwvAEOwp7QmgqQZbH7yITzeWycZPKcbb0cSCu7g2TJiWog/exec";



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

            const auth0Promise = initAuth();

            const activitiesPromise = (async () => {
                try {
                    const activities = await fetchActivitiesData();
                    populateActivities(activities);
                } catch (e) {
                    showConfigAlert(`เชื่อมต่อล้มเหลว: ${e.message}`);
                }
            })();

            // Wait for Auth0 to complete before showing UI
            await auth0Promise;

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

            // Let activitiesPromise resolve in the background
            activitiesPromise.then(() => {});

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

        document.addEventListener('authStateChanged', (e) => {
            if (e.detail.isAuthenticated) {
                const email = e.detail.userProfile.email;
                const regex = /^sb(\d+)@lru\.ac\.th$/i;
                const match = email.match(regex);

                if (match) {
                    const extractedId = match[1];
                    const studentIdInput = document.getElementById('studentId');
                    studentIdInput.value = extractedId;
                    onIdInput(studentIdInput);
                    showStudentIdInput(false);
                } else {
                    showStudentIdInput(true);
                }
            } else {
                showStudentIdInput(true);
            }
        });

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
                    })
                    .catch(e => console.warn('Monitor fetch failed:', e));
            }, 60000);
        }

        /* ════ HELPERS ════ */
        function show(id) { document.getElementById(id).classList.remove('hidden'); }
        function hide(id) { document.getElementById(id).classList.add('hidden'); }
        function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
        function escHtml(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    