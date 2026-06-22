
        const APP_URL = "https://script.google.com/macros/s/AKfycbzMAhUcwoYV-OuYne_h6qeIczrI0qGfv58_qgls9k8ONWJEdZGoZgqofrtVCNxZu3qk1w/exec";

        let currentUser = null;
        let selectedCandidate = null;

        function verifyUser() {
            const id = document.getElementById('studentIdInput').value;
            const errorMsg = document.getElementById('loginError');
            const loader = document.getElementById('loginLoader');

            if (id.length !== 10) {
                errorMsg.innerText = "รหัสนักศึกษาต้องมี 10 หลัก";
                return;
            }

            errorMsg.innerText = "";
            loader.style.display = 'block';

            fetch(`${APP_URL}?action=checkRights&studentId=${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        if (data.hasVoted) {
                            loader.style.display = 'none';
                            errorMsg.innerText = "ท่านได้ใช้สิทธิ์เลือกตั้งไปแล้ว ไม่สามารถเลือกตั้งซ้ำได้";
                        } else {
                            currentUser = data.data;
                            loadCandidates();
                        }
                    } else {
                        loader.style.display = 'none';
                        errorMsg.innerText = data.message;
                    }
                })
                .catch(err => {
                    loader.style.display = 'none';
                    errorMsg.innerText = "เกิดข้อผิดพลาดในการเชื่อมต่อ";
                });
        }

        function loadCandidates() {
            fetch(`${APP_URL}?action=getCandidates`)
                .then(res => res.json())
                .then(data => {
                    document.getElementById('loginLoader').style.display = 'none';

                    if (data.status === 'success') {
                        document.getElementById('loginSection').classList.add('hidden');
                        document.getElementById('voteSection').classList.remove('hidden');

                        document.getElementById('userInfoDisplay').innerHTML = `
                            <i class="fas fa-user" style="color: var(--ink-50);"></i> 
                            <span>ผู้ใช้สิทธิ์: <strong>${currentUser.name}</strong> (${currentUser.group})</span>
                        `;

                        const list = document.getElementById('candidateList');
                        list.innerHTML = '';
                        data.data.forEach(c => {
                            list.innerHTML += `
                                <label class="candidate-card" onclick="selectCandidate('${c.number}', this)">
                                    <input type="radio" name="candidate" value="${c.number}">
                                    <div class="candidate-radio"></div>
                                    <img src="img/${c.number}.png" alt="พรรคหมายเลข ${c.number}" class="candidate-img" onerror="this.style.display='none'">
                                    <div class="candidate-info">
                                        <div class="candidate-number">หมายเลข ${c.number}</div>
                                        <div class="candidate-party">พรรค${c.party}</div>
                                    </div>
                                </label>
                            `;
                        });
                    }
                });
        }

        function selectCandidate(number, element) {
            selectedCandidate = number;
            document.querySelectorAll('.candidate-card').forEach(card => {
                card.classList.remove('selected');
            });
            element.classList.add('selected');
        }

        function confirmVote() {
            if (!selectedCandidate) {
                alert("กรุณาเลือกหมายเลขก่อนกดยืนยัน");
                return;
            }

            if (confirm(`ยืนยันการเลือกหมายเลข ${selectedCandidate} ใช่หรือไม่?`)) {
                const btn = document.getElementById('btnConfirm');
                const loader = document.getElementById('voteLoader');
                btn.disabled = true;
                loader.style.display = 'block';

                fetch(APP_URL + "?action=vote", {
                    method: 'POST',
                    redirect: 'follow',
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({
                        studentId: currentUser.id,
                        voteNumber: selectedCandidate
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        loader.style.display = 'none';
                        if (data.status === 'success') {
                            document.getElementById('voteSection').classList.add('hidden');
                            document.getElementById('successSection').classList.remove('hidden');
                        } else {
                            alert("เกิดข้อผิดพลาด: " + data.message);
                            btn.disabled = false;
                        }
                    })
                    .catch(err => {
                        loader.style.display = 'none';
                        btn.disabled = false;
                        console.error(err);
                        alert("เกิดข้อผิดพลาดในการส่งข้อมูล");
                    });
            }
        }

        document.getElementById('studentIdInput').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') verifyUser();
        });

        // Time checking - same as index.html
        const startDate = new Date('2026-01-28T13:00:00+07:00').getTime();
        const endDate = new Date('2026-01-28T15:00:00+07:00').getTime();

        function checkVotingTime() {
            const now = new Date().getTime();
            const distanceToStart = startDate - now;
            const distanceToEnd = endDate - now;

            const overlay = document.getElementById('timeStatusOverlay');
            const icon = document.getElementById('timeStatusIcon');
            const iconEl = document.getElementById('timeStatusIconEl');
            const title = document.getElementById('timeStatusTitle');
            const subtitle = document.getElementById('timeStatusSubtitle');
            const countdown = document.getElementById('timeStatusCountdown');

            // Voting has ended
            if (distanceToEnd < 0 && distanceToStart < 0) {
                overlay.classList.remove('hidden');
                icon.className = 'time-status-icon closed';
                iconEl.className = 'fas fa-times-circle';
                title.textContent = 'ปิดการเลือกตั้งแล้ว';
                subtitle.textContent = 'ขอบคุณที่ร่วมใช้สิทธิ์เลือกตั้ง';
                countdown.classList.add('hidden');
                return;
            }

            // Voting not started yet
            if (distanceToStart > 0) {
                overlay.classList.remove('hidden');
                icon.className = 'time-status-icon waiting';
                iconEl.className = 'fas fa-clock';
                title.textContent = 'ยังไม่ถึงเวลาเลือกตั้ง';
                subtitle.textContent = 'กรุณารอจนกว่าจะถึงเวลาเปิดรับเลือกตั้ง';
                countdown.classList.remove('hidden');

                const days = Math.floor(distanceToStart / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distanceToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distanceToStart % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distanceToStart % (1000 * 60)) / 1000);

                document.getElementById('statusDays').textContent = String(days).padStart(2, '0');
                document.getElementById('statusHours').textContent = String(hours).padStart(2, '0');
                document.getElementById('statusMinutes').textContent = String(minutes).padStart(2, '0');
                document.getElementById('statusSeconds').textContent = String(seconds).padStart(2, '0');
                return;
            }

            // Voting is open - hide overlay
            overlay.classList.add('hidden');
        }

        checkVotingTime();
        setInterval(checkVotingTime, 1000);
    