
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

        const ALLOWED_EMAIL = "sb6740102220@lru.ac.th";

        document.addEventListener('authStateChanged', (e) => {
            if (e.detail.isAuthenticated) {
                if (e.detail.userProfile.email === ALLOWED_EMAIL) {
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
                document.getElementById('loginPage').classList.remove('show');
                document.getElementById('mainApp').classList.add('show');
                document.getElementById('appScreen').style.display = 'block';
            } else {
                document.getElementById('mainApp').classList.remove('show');
                document.getElementById('loginPage').classList.add('show');
                document.getElementById(screenId).style.display = 'block';
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            initAuth();
        });
    