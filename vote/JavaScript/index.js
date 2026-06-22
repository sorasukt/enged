
        // Target dates in GMT+7 timezone
        const startDate = new Date('2026-01-28T13:00:00+07:00').getTime();
        const endDate = new Date('2026-01-28T15:00:00+07:00').getTime();

        function updateCountdown() {
            const now = new Date().getTime();
            const distanceToStart = startDate - now;
            const distanceToEnd = endDate - now;

            // Voting has ended
            if (distanceToEnd < 0 && distanceToStart < 0) {
                document.getElementById('iconContainer').classList.remove('active');
                document.getElementById('iconContainer').classList.add('closed');
                document.getElementById('mainIcon').className = 'fas fa-times-circle';
                document.getElementById('mainTitle').textContent = 'ปิดการเลือกตั้งแล้ว';
                document.getElementById('mainSubtitle').textContent = 'ขอบคุณที่ร่วมใช้สิทธิ์เลือกตั้ง';

                // Hide all countdown elements
                document.getElementById('scheduleBox').classList.add('hide-when-open');
                document.getElementById('countdownLabel').classList.add('hide-when-open');
                document.getElementById('countdown').classList.add('hide-when-open');
                document.getElementById('closingCountdown').classList.remove('show');
                document.getElementById('actionButtons').classList.remove('show');

                // Show instructions (for reference)
                document.getElementById('votingInstructions').classList.add('show');
                return;
            }

            // Voting is open
            if (distanceToStart < 0) {
                // Update page to show voting is open
                document.getElementById('iconContainer').classList.add('active');
                document.getElementById('mainIcon').className = 'fas fa-vote-yea';
                document.getElementById('mainTitle').textContent = 'เปิดรับการเลือกตั้งแล้ว';
                document.getElementById('mainSubtitle').textContent = 'ขณะนี้ท่านสามารถลงคะแนนเลือกตั้งได้แล้ว';

                // Hide opening countdown elements
                document.getElementById('scheduleBox').classList.add('hide-when-open');
                document.getElementById('countdownLabel').classList.add('hide-when-open');
                document.getElementById('countdown').classList.add('hide-when-open');

                // Show voting instructions, action buttons, and closing countdown
                document.getElementById('votingInstructions').classList.add('show');
                document.getElementById('actionButtons').classList.add('show');
                document.getElementById('closingCountdown').classList.add('show');

                // Update closing countdown
                if (distanceToEnd > 0) {
                    const hours = Math.floor(distanceToEnd / (1000 * 60 * 60));
                    const minutes = Math.floor((distanceToEnd % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distanceToEnd % (1000 * 60)) / 1000);

                    document.getElementById('closingHours').textContent = String(hours).padStart(2, '0');
                    document.getElementById('closingMinutes').textContent = String(minutes).padStart(2, '0');
                    document.getElementById('closingSeconds').textContent = String(seconds).padStart(2, '0');
                }
                return;
            }

            // Voting not started yet - show countdown to start
            const days = Math.floor(distanceToStart / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distanceToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distanceToStart % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distanceToStart % (1000 * 60)) / 1000);

            document.getElementById('days').textContent = String(days).padStart(2, '0');
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
        }

        updateCountdown();
        setInterval(updateCountdown, 1000);
    