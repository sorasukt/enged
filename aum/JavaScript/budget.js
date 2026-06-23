
        const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbynESsU9hxZ-MfZo2hSodAb7KsYvoWhhfLJnUcR_X5Qpmkxx5VQlmKUg1dNQbrAmtcN/exec';

        /* ─── Custom Dropdown ─── */
        const trigger = document.getElementById('selectTrigger');
        const dropdown = document.getElementById('customDropdown');
        const trigText = document.getElementById('triggerText');
        const realSelect = document.getElementById('category');

        function openDropdown() {
            trigger.classList.add('open');
            dropdown.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
        }

        function closeDropdown() {
            trigger.classList.remove('open');
            dropdown.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }

        trigger.addEventListener('click', () => {
            trigger.classList.contains('open') ? closeDropdown() : openDropdown();
        });

        trigger.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.classList.contains('open') ? closeDropdown() : openDropdown(); }
            if (e.key === 'Escape') closeDropdown();
        });

        document.querySelectorAll('.dropdown-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const val = opt.dataset.value;
                const label = opt.querySelector('span:first-of-type').textContent;

                // update UI
                document.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                trigText.textContent = label;
                trigger.classList.add('has-value');

                // sync real select
                realSelect.value = val;

                closeDropdown();
            });
        });

        document.addEventListener('click', e => {
            if (!document.getElementById('selectWrap').contains(e.target)) closeDropdown();
        });

        /* ─── Calculate ─── */
        function calculateTotal() {
            const qty = parseFloat(document.getElementById('qty').value) || 0;
            const price = parseFloat(document.getElementById('price').value) || 0;
            const total = qty * price;
            document.getElementById('total').value = total > 0
                ? total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '';
        }

        /* ─── File ─── */
        function onFileChange(input) {
            const label = document.getElementById('fileLabel');
            const icon = document.querySelector('.file-zone-icon i');
            if (input.files.length > 0) {
                const name = input.files[0].name;
                const isImg = input.files[0].type.startsWith('image/');
                label.textContent = name;
                label.classList.add('selected');
                icon.className = isImg ? 'fa-regular fa-image' : 'fa-regular fa-file-pdf';
            } else {
                label.textContent = 'คลิกหรือลากไฟล์มาวางที่นี่';
                label.classList.remove('selected');
                icon.className = 'fa-regular fa-file-image';
            }
        }

        const fileZone = document.getElementById('fileZone');
        fileZone.addEventListener('dragover', e => { e.preventDefault(); fileZone.classList.add('drag-over'); });
        fileZone.addEventListener('dragleave', () => fileZone.classList.remove('drag-over'));
        fileZone.addEventListener('drop', () => fileZone.classList.remove('drag-over'));

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

            const payload = {
                date: document.getElementById('date').value,
                category: document.getElementById('category').value,
                details: document.getElementById('details').value,
                qty: document.getElementById('qty').value,
                price: document.getElementById('price').value,
                note: document.getElementById('note').value,
                fileName, fileMimeType, fileBase64
            };

            try {
                const res = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) });
                const result = await res.json();

                if (result.status === 'success') {
                    status.innerHTML = '<i class="fa-solid fa-circle-check"></i> บันทึกข้อมูลและอัปโหลดไฟล์สำเร็จ';
                    status.className = 'status-msg success';

                    document.getElementById('budgetForm').reset();
                    document.getElementById('total').value = '';

                    // reset custom dropdown
                    trigText.textContent = 'กรุณาเลือกหมวดเงิน';
                    trigger.classList.remove('has-value');
                    document.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('selected'));

                    // reset file
                    document.getElementById('fileLabel').textContent = 'คลิกหรือลากไฟล์มาวางที่นี่';
                    document.getElementById('fileLabel').classList.remove('selected');
                    document.querySelector('.file-zone-icon i').className = 'fa-regular fa-file-image';
                } else {
                    throw new Error(result.message);
                }
            } catch (err) {
                status.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> เกิดข้อผิดพลาด: ' + err.message;
                status.className = 'status-msg error';
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i><span>บันทึกข้อมูล</span>';
            }
        });

        const ALLOWED_EMAIL = "sb6740102220@lru.ac.th";

        document.addEventListener('authStateChanged', (e) => {
            if (e.detail.isAuthenticated) {
                if (e.detail.userProfile.email === ALLOWED_EMAIL) {
                    document.getElementById('userEmailDisplay').textContent = e.detail.userProfile.email;
                    showScreen('appScreen');
                } else {
                    document.getElementById('currentEmail').textContent = e.detail.userProfile.email;
                    showScreen('deniedScreen');
                }
            } else {
                showScreen('authScreen');
            }
        });

        function showScreen(screenId) {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('deniedScreen').style.display = 'none';
            document.getElementById('appScreen').style.display = 'none';

            if (screenId === 'appScreen') {
                document.getElementById('appScreen').style.display = 'block';
            } else {
                document.getElementById(screenId).style.display = 'block';
            }
        }
    