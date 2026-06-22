
        // System Status Configuration (ตั้งเวลาปิดปรับปรุงระบบ)
        // ใช้ ISO 8601 format พร้อม timezone GMT+7
        const SYSTEM_MAINTENANCE_START = new Date('2026-01-28T00:00:00+07:00'); // 28 Jan 2026 00:00:00 GMT+7
        const SYSTEM_MAINTENANCE_END = new Date('2026-01-28T09:00:00+07:00');   // 28 Jan 2026 09:00:00 GMT+7

        let systemModalAcknowledged = false;

        function checkSystemStatus() {
            if (systemModalAcknowledged) return;

            const now = new Date();
            const systemModal = document.getElementById('systemModal');

            console.log("Checking System Status:", now);
            console.log("Start:", SYSTEM_MAINTENANCE_START);
            console.log("End:", SYSTEM_MAINTENANCE_END);

            if (now >= SYSTEM_MAINTENANCE_START && now <= SYSTEM_MAINTENANCE_END) {
                console.log("System should be CLOSED (Modal Visible)");
                if (systemModal.style.display !== 'flex') {
                    systemModal.style.display = 'flex';
                }
            } else {
                console.log("System within Normal Operation");
                // Auto-close if time passed and user hasn't closed it manually (optional, but good UX)
                if (systemModal.style.display === 'flex') {
                    systemModal.style.display = 'none';
                }
            }
        }

        // System Modal Function
        function closeSystemModal() {
            document.getElementById('systemModal').style.display = 'none';
            systemModalAcknowledged = true;
        }

        // Config schedule for Important Notification Modal
        // Start date: 2026-01-01 00:00 (B.E. 2569)
        const INFO_MODAL_START = new Date("2026-01-01T00:00:00+07:00");
        // End date: 2026-01-30 18:00 (B.E. 2569)
        const INFO_MODAL_END = new Date("2026-01-30T18:00:00+07:00");

        // Show Info Modal on Load
        document.addEventListener('DOMContentLoaded', async function () {
            const now = new Date();
            if (now >= INFO_MODAL_START && now <= INFO_MODAL_END) {
                var infoModal = new bootstrap.Modal(document.getElementById('infoModal'));
                infoModal.show();
            }

            // Start checking system status
            checkSystemStatus();
            setInterval(checkSystemStatus, 60000); // Check every 1 minute

            // Initialize Auth0
            try {
                await configureAuth0();

                const query = window.location.search;
                if (query.includes("state=") && (query.includes("code=") || query.includes("error="))) {
                    await auth0Client.handleRedirectCallback();
                    window.history.replaceState({}, document.title, window.location.pathname);
                }

                await updateAuthUI();
            } catch (error) {
                console.error("Auth0 Init Error:", error);
                const authArea = document.getElementById('authHeaderArea');
                if (authArea) {
                    authArea.innerHTML = `
                        <button class="login-header-btn" onclick="loginUser()">
                            <i class="fa-solid fa-arrow-right-to-bracket"></i> เข้าสู่ระบบ
                        </button>
                    `;
                }
            }
        });

        // Slider functionality
        const slides = document.querySelectorAll('.slide');
        const dotsContainer = document.querySelector('.slider-dots');
        let currentSlide = 0;
        let slideInterval;

        // Create dots
        slides.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.onclick = () => goToSlide(index);
            dotsContainer.appendChild(dot);
        });

        function updateSlider() {
            slides.forEach((slide, index) => {
                slide.classList.remove('active');
                if (index === currentSlide) slide.classList.add('active');
            });
            document.querySelectorAll('.dot').forEach((dot, index) => {
                dot.classList.remove('active');
                if (index === currentSlide) dot.classList.add('active');
            });
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            updateSlider();
            resetInterval();
        }

        function prevSlide() {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            updateSlider();
            resetInterval();
        }

        function goToSlide(index) {
            currentSlide = index;
            updateSlider();
            resetInterval();
        }

        function resetInterval() {
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000);
        }

        // Auto-slide every 5 seconds
        slideInterval = setInterval(nextSlide, 5000);

        // Hide buttons if only one slide
        if (slides.length <= 1) {
            document.querySelectorAll('.slider-btn').forEach(btn => btn.style.display = 'none');
            document.querySelector('.slider-dots').style.display = 'none';
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
                alert('อัปเดตโปรไฟล์สำเร็จแล้ว');

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
                reader.onload = function (e) {
                    document.getElementById('profileModalAvatar').src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        }

        // Image Modal Functionality
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        const modalCaption = document.getElementById('modalCaption');
        const closeBtn = document.querySelector('.modal-close');

        // Add click event to all slider images
        document.querySelectorAll('.slide img').forEach(img => {
            img.addEventListener('click', function () {
                modal.style.display = 'block';
                modalImg.src = this.src;
                modalCaption.textContent = this.alt;
                document.body.style.overflow = 'hidden'; // Prevent scrolling
                clearInterval(slideInterval); // Pause slider
            });
        });

        // Close modal when clicking X
        closeBtn.addEventListener('click', closeModal);

        // Close modal when clicking outside image
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });

        function closeModal() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
            slideInterval = setInterval(nextSlide, 5000); // Resume slider
        }

        /* ════════════════════════════════════════
           ตั้งค่า AUTH0 (Home Page Single Sign-On)
         ════════════════════════════════════════ */
        const AUTH0_DOMAIN = "litalkeducation.us.auth0.com";
        const AUTH0_CLIENT_ID = "PGqozL94LzOwstm4pD39W5kvalYRiK7w";

        let auth0Client = null;
        let isAuthenticated = false;
        let userProfile = null;
        let extractedStudentId = '';

        function escHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>'"]/g,
                tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
            );
        }

        function toast(msg) {
            const t = document.getElementById('copyToast');
            const txt = document.getElementById('copyToastText');
            if (t && txt) {
                txt.textContent = msg;
                t.classList.add('show');
                setTimeout(() => t.classList.remove('show'), 2000);
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
            document.cookie = 'att_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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

                    // Modify the "บันทึกการเข้าร่วมกิจกรรม" card text to reflect logged in state
                    const serviceCardText = document.querySelector('.service-card.lru-mail .card-content p');
                    if (serviceCardText) {
                        serviceCardText.innerHTML = `<span style="color: var(--ink); font-weight: 600;"><i class="fas fa-check-circle"></i> ยืนยันตัวตนแล้ว</span> — แตะเพื่อบันทึกพิกัดกิจกรรม`;
                    }
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

                    const serviceCardText = document.querySelector('.service-card.lru-mail .card-content p');
                    if (serviceCardText) {
                        serviceCardText.innerHTML = `เข้าสู่ระบบด้วย LRU Mail เพื่อเช็คชื่อเข้าร่วมกิจกรรม`;
                    }
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
            }
        }
    