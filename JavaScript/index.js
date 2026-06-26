
        // System Status Configuration (ตั้งเวลาปิดปรับปรุงระบบ)
        // ใช้ ISO 8601 format พร้อม timezone GMT+7
        const SYSTEM_MAINTENANCE_START = new Date('2026-01-28T00:00:00+07:00'); // 28 Jan 2026 00:00:00 GMT+7
        const SYSTEM_MAINTENANCE_END = new Date('2026-01-28T09:00:00+07:00');   // 28 Jan 2026 09:00:00 GMT+7

        let systemModalAcknowledged = false;

        function checkSystemStatus() {
            if (systemModalAcknowledged) return;

            const now = new Date();
            const systemModal = document.getElementById('systemModal');

            if (now >= SYSTEM_MAINTENANCE_START && now <= SYSTEM_MAINTENANCE_END) {
                if (systemModal.style.display !== 'flex') {
                    systemModal.style.display = 'flex';
                }
            } else {
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

            // Initialize Auth0 using central script
            initAuth();
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

        document.addEventListener('authStateChanged', (e) => {
            if (e.detail.isAuthenticated) {
                const serviceCardText = document.querySelector('.service-card.lru-mail .card-content p');
                if (serviceCardText) {
                    serviceCardText.innerHTML = `<span style="color: var(--ink); font-weight: 600;"><i class="fas fa-check-circle"></i> ยืนยันตัวตนแล้ว</span> — แตะเพื่อบันทึกพิกัดกิจกรรม`;
                }
            } else {
                const serviceCardText = document.querySelector('.service-card.lru-mail .card-content p');
                if (serviceCardText) {
                    serviceCardText.innerHTML = `เข้าสู่ระบบด้วย LRU Mail เพื่อเช็คชื่อเข้าร่วมกิจกรรม`;
                }
            }
        });
    