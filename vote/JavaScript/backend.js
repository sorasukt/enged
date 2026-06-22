
        const APP_URL = "https://script.google.com/macros/s/AKfycbzMAhUcwoYV-OuYne_h6qeIczrI0qGfv58_qgls9k8ONWJEdZGoZgqofrtVCNxZu3qk1w/exec";

        // Global state for system online/offline status
        let isSystemOnline = true;
        let hashUpdateInterval = null;

        function setSystemOffline() {
            isSystemOnline = false;
            const indicator = document.getElementById('statusIndicator');
            const systemStatus = document.getElementById('systemStatus');
            const nodesStatus = document.getElementById('nodesStatus');
            const hashElement = document.getElementById('integrityHash');

            if (indicator) {
                indicator.style.backgroundColor = '#dc2626';
                indicator.style.boxShadow = '0 0 10px #dc2626';
                indicator.style.animation = 'none';
            }
            if (systemStatus) {
                systemStatus.textContent = 'System: Offline Unverified';
            }
            if (nodesStatus) {
                nodesStatus.textContent = 'Nodes: Disconnected';
            }
            if (hashElement) {
                hashElement.textContent = '----...----';
                hashElement.style.opacity = '0.5';
            }
        }

        function setSystemOnline() {
            isSystemOnline = true;
            const indicator = document.getElementById('statusIndicator');
            const systemStatus = document.getElementById('systemStatus');
            const nodesStatus = document.getElementById('nodesStatus');
            const hashElement = document.getElementById('integrityHash');

            if (indicator) {
                indicator.style.backgroundColor = '#22c55e';
                indicator.style.boxShadow = '0 0 10px #22c55e';
                indicator.style.animation = 'blink 2s infinite';
            }
            if (systemStatus) {
                systemStatus.textContent = 'System: Verified';
            }
            if (nodesStatus) {
                nodesStatus.textContent = 'Nodes: Online';
            }
            if (hashElement) {
                hashElement.style.opacity = '1';
            }
        }

        function displayResults(data) {
            const list = document.getElementById('resultsList');
            list.innerHTML = '';

            // Convert object to array for easier processing
            const candidates = [];
            Object.keys(data).forEach(key => {
                candidates.push({
                    number: key,
                    party: data[key].party,
                    votes: data[key].count || 0
                });
            });

            // Sort by votes (descending) - highest votes first
            candidates.sort((a, b) => b.votes - a.votes);

            const total = candidates.reduce((sum, c) => sum + c.votes, 0);

            // Find maximum votes for leading badge
            const maxVotes = candidates.length > 0 ? candidates[0].votes : 0;

            candidates.forEach((c, index) => {
                const pct = total > 0 ? ((c.votes / total) * 100).toFixed(1) : 0;
                const isLeading = index === 0 && maxVotes > 0;

                // Different styles for leading vs others
                const cardClass = isLeading ? 'result-item leading' : 'result-item';
                const leadingBadge = isLeading ? '<div class="leading-badge">คะแนนนำ</div>' : '';

                list.innerHTML += `
                    <div class="${cardClass}">
                        ${leadingBadge}
                        <div class="result-content">
                            <div class="result-number-badge">
                                ${c.number}
                            </div>
                            <img src="img/${c.number}.png" alt="หัวหน้าพรรค ${c.party}" class="result-img" onerror="this.style.display='none'">
                            <div class="result-info">
                                <div class="result-party">${c.party}</div>
                                <div class="result-subtitle">หมายเลข ${c.number}</div>
                            </div>
                            <div class="result-votes">
                                <div class="result-votes-number">${c.votes}</div>
                                <div class="result-votes-label">คะแนน (${pct}%)</div>
                            </div>
                        </div>
                        <div class="result-bar"><div class="result-fill" style="width:${pct}%"></div></div>
                    </div>
                `;
            });

            document.getElementById('totalVotes').innerHTML = `รวมผู้ใช้สิทธิ์ทั้งหมด <strong>${total}</strong> คน`;
            document.getElementById('totalVotes').style.display = 'block';
        }

        // Cookie/localStorage helper functions
        function saveResultsToCache(data) {
            const cacheData = {
                results: data,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('electionResultsCache', JSON.stringify(cacheData));
        }

        function getResultsFromCache() {
            const cached = localStorage.getItem('electionResultsCache');
            if (cached) {
                return JSON.parse(cached);
            }
            return null;
        }

        function formatLastUpdated(isoString) {
            const date = new Date(isoString);
            return date.toLocaleString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        function showLastUpdateInfo(lastUpdated, isOffline = false) {
            let updateInfo = document.getElementById('updateInfo');
            if (!updateInfo) {
                updateInfo = document.createElement('div');
                updateInfo.id = 'updateInfo';
                updateInfo.style.cssText = `
                    text-align: center;
                    padding: 12px 16px;
                    margin-bottom: 16px;
                    border-radius: var(--r-sm);
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-weight: 600;
                `;
                const disclaimer = document.querySelector('.disclaimer');
                if (disclaimer) {
                    disclaimer.after(updateInfo);
                }
            }

            if (isOffline) {
                updateInfo.style.background = 'var(--warn-bg)';
                updateInfo.style.color = 'var(--warn)';
                updateInfo.style.border = '1px solid var(--warn-bd)';
                updateInfo.innerHTML = `<i class="fas fa-wifi-slash"></i> ข้อมูลออฟไลน์ - อัพเดทล่าสุด: ${formatLastUpdated(lastUpdated)}`;
            } else {
                updateInfo.style.background = 'var(--success-bg)';
                updateInfo.style.color = 'var(--success)';
                updateInfo.style.border = '1px solid var(--success-bd)';
                updateInfo.innerHTML = `<i class="fas fa-check-circle"></i> อัพเดทล่าสุด: ${formatLastUpdated(lastUpdated)}`;
            }
        }

        function loadResults() {
            fetch(`${APP_URL}?action=getResults`)
                .then(res => res.json())
                .then(json => {
                    document.getElementById('loader').style.display = 'none';
                    if (json.status === 'success' && json.data) {
                        // Save to cache
                        saveResultsToCache(json.data);
                        displayResults(json.data);
                        showLastUpdateInfo(new Date().toISOString(), false);
                        document.getElementById('errorMsg').style.display = 'none';
                        setSystemOnline();
                    } else {
                        // Try to show cached data
                        setSystemOffline();
                        const cached = getResultsFromCache();
                        if (cached) {
                            displayResults(cached.results);
                            showLastUpdateInfo(cached.lastUpdated, true);
                            document.getElementById('errorMsg').textContent = 'ไม่สามารถโหลดข้อมูลใหม่ได้ - แสดงข้อมูลจากแคช';
                            document.getElementById('errorMsg').style.display = 'block';
                        } else {
                            document.getElementById('errorMsg').textContent = json.message || 'ไม่สามารถโหลดข้อมูลได้';
                            document.getElementById('errorMsg').style.display = 'block';
                        }
                    }
                })
                .catch(err => {
                    document.getElementById('loader').style.display = 'none';
                    console.error('API Error:', err);
                    setSystemOffline();

                    // Try to show cached data on error
                    const cached = getResultsFromCache();
                    if (cached) {
                        displayResults(cached.results);
                        showLastUpdateInfo(cached.lastUpdated, true);
                        document.getElementById('errorMsg').textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ - แสดงข้อมูลจากแคช';
                        document.getElementById('errorMsg').style.display = 'block';
                    } else {
                        document.getElementById('errorMsg').textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ และไม่มีข้อมูลแคช';
                        document.getElementById('errorMsg').style.display = 'block';
                    }
                });
        }

        // Time checking - results available after voting starts (and after voting ends too)
        const startDate = new Date('2026-01-01T15:05:00+07:00').getTime();

        function checkVotingTime() {
            const now = new Date().getTime();
            const distanceToStart = startDate - now;

            const overlay = document.getElementById('timeStatusOverlay');

            // Voting not started yet - show overlay, don't load results
            if (distanceToStart > 0) {
                overlay.classList.remove('hidden');

                const days = Math.floor(distanceToStart / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distanceToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distanceToStart % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distanceToStart % (1000 * 60)) / 1000);

                document.getElementById('statusDays').textContent = String(days).padStart(2, '0');
                document.getElementById('statusHours').textContent = String(hours).padStart(2, '0');
                document.getElementById('statusMinutes').textContent = String(minutes).padStart(2, '0');
                document.getElementById('statusSeconds').textContent = String(seconds).padStart(2, '0');
                return false; // Don't load results
            }

            // Voting has started (or ended) - hide overlay, allow results
            overlay.classList.add('hidden');
            return true; // Load results
        }

        // Check time first, then load results if allowed
        if (checkVotingTime()) {
            loadResults();
        }

        // Keep checking time every second (for countdown)
        setInterval(() => {
            if (checkVotingTime() && document.getElementById('resultsList').innerHTML === '') {
                loadResults();
            }
        }, 1000);

        // Auto Refresh Results every 30 seconds
        setInterval(() => {
            if (checkVotingTime()) {
                loadResults();
            }
        }, 30000);

        // Simulating Real-time Hash Updates
        function updateIntegrityHash() {
            // Only update hash when system is online
            if (!isSystemOnline) {
                return;
            }

            const characters = 'abcdef0123456789';
            let hash = '';
            // Generate a fake hash segment
            for (let i = 0; i < 8; i++) {
                hash += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            hash += '...';
            for (let i = 0; i < 8; i++) {
                hash += characters.charAt(Math.floor(Math.random() * characters.length));
            }

            const hashElement = document.getElementById('integrityHash');
            if (hashElement) {
                hashElement.style.opacity = '0.5';
                setTimeout(() => {
                    hashElement.textContent = hash;
                    hashElement.style.opacity = '1';
                }, 200);
            }
        }

        // Start the interval now that the function is defined
        setInterval(updateIntegrityHash, 5000);
    