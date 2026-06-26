// --- ⚙️ Config ---
// 🚨 นำ URL ที่ได้จากการ Deploy แบบ Web App (Anyone) มาวางที่นี่
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxNif4pv3SL70z-xSRNHoU1fwvAEOwp7QmgqQZbH7yITzeWycZPKcbb0cSCu7g2TJiWog/exec";

// ************************************************

let monitorInterval;

window.onload = function () {
    var infoModal = new bootstrap.Modal(document.getElementById('infoModal'));
    infoModal.show();

    if (GAS_API_URL.includes("วาง_URL")) {
        document.getElementById('configAlert').style.display = 'block';
        document.getElementById('alertMsg').innerHTML = "ยังไม่ได้ตั้งค่า URL";
    }

    fetchActivities();

    const urlParams = new URLSearchParams(window.location.search);
    const paramName = urlParams.get('name') || urlParams.get('activity') || urlParams.get('code');
    const paramId = urlParams.get('id');

    if (paramName && paramId) {
        document.getElementById('inputSection').classList.add('hidden-mode');
        document.getElementById('welcomeText').innerHTML = '<span class="text-danger d-inline-flex align-items-center gap-2"><div class="loader-mini"></div> กำลังค้นหาข้อมูลอัตโนมัติ...</span>';
        performSearch(paramId, paramName, true);
    }
};



// --- Main System Logic ---
function checkAutoSearch() {
    const p = new URLSearchParams(window.location.search);
    const name = p.get('name') || p.get('activity') || p.get('code');
    const id = p.get('id');
    if (name && id) {
        document.getElementById('inputSection').classList.add('hidden-mode');
        document.getElementById('welcomeText').innerHTML = '<span class="text-danger">กำลังค้นหาข้อมูลอัตโนมัติ...</span>';
        performSearch(id, name, true);
    }
}

function fetchActivities() {
    fetch(`${GAS_API_URL}?action=getActivities`)
        .then(async response => {
            if (!response.ok) {
                if (response.status === 404) throw new Error("404 Not Found: ไม่พบ Web App (ตรวจสอบ URL หรือ Deploy ใหม่)");
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            } else {
                // Received HTML instead of JSON
                throw new Error("ได้รับ HTML แทนที่จะเป็น JSON (ลอง Deploy ใหม่เป็น New Version)");
            }
        })
        .then(data => {
            const sel = document.getElementById('activitySelect');
            sel.innerHTML = '<option value="" selected disabled>กรุณาเลือกกิจกรรม</option>';
            if (data.length) {
                data.forEach(act => {
                    let opt = document.createElement("option");
                    opt.text = act; opt.value = act;
                    sel.add(opt);
                });
                document.getElementById('searchBtn').disabled = false;
            } else {
                sel.innerHTML = '<option disabled>ไม่พบรายการกิจกรรม</option>';
            }
        })
        .catch(e => {
            document.getElementById('configAlert').style.display = 'block';
            document.getElementById('alertMsg').innerHTML = `<strong>เชื่อมต่อล้มเหลว:</strong> ${e.message}`;
        });
}

function handleEnter(e) { if (e.key === 'Enter') searchData(); }

function searchData() {
    const act = document.getElementById('activitySelect').value;
    const id = document.getElementById('studentId').value.trim();
    if (!act) { alert("กรุณาเลือกกิจกรรม"); return; }
    if (!id) { alert("กรุณากรอกรหัสนักศึกษา"); return; }
    performSearch(id, act, false);
}

function performSearch(id, act, isAuto) {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('resultArea').style.display = 'none';
    document.getElementById('errorMsg').style.display = 'none';
    document.getElementById('pendingMsg').style.display = 'none';
    if (monitorInterval) clearInterval(monitorInterval);

    if (!isAuto) {
        document.getElementById('searchBtn').disabled = true;
        document.getElementById('searchBtn').innerHTML = '<div class="loader-mini"></div> กำลังค้นหา...';
    }

    fetch(`${GAS_API_URL}?action=search&id=${encodeURIComponent(id)}&criteria=${encodeURIComponent(act)}`)
        .then(async response => {
            if (!response.ok) {
                if (response.status === 404) throw new Error("404 Not Found (URL ผิด หรือยังไม่ได้ Deploy)");
                throw new Error(`HTTP Error: ${response.status}`);
            }
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            } else {
                throw new Error("ได้รับ HTML แทน JSON (ตรวจสอบสิทธิ์การเข้าถึง Web App)");
            }
        })
        .then(data => showResult(data, isAuto))
        .catch(e => showError(e));
}

function showResult(data, isAuto) {
    document.getElementById('loading').style.display = 'none';
    const btn = document.getElementById('searchBtn');
    btn.disabled = false;
    btn.innerHTML = '<span>ค้นหาข้อมูล</span><i class="fas fa-arrow-right"></i>';

    if (!data.found) {
        document.getElementById('errorMsg').style.display = 'block';
        document.getElementById('errorDetail').innerText = "ไม่พบข้อมูลสำหรับรหัสนักศึกษานี้ในกิจกรรมที่เลือก";
        document.getElementById('technicalError').innerText = "";
        document.getElementById('deployHint').style.display = 'none';
        if (isAuto) {
            document.getElementById('welcomeText').innerText = "ไม่พบข้อมูลจากลิงก์";
            document.getElementById('retryBtn').style.display = 'block';
        } else {
            document.getElementById('retryBtn').style.display = 'none';
        }
        return;
    }

    if (data.data.activities && data.data.activities.length > 0 && data.data.activities[0].code === 'กำลังดำเนินการ') {
        document.getElementById('pendingMsg').style.display = 'block';
        if (isAuto) document.getElementById('welcomeText').style.display = 'none';
        return;
    }

    if (isAuto) document.getElementById('welcomeText').style.display = 'none';

    document.getElementById('resActivity').innerText = data.data.activityName;
    document.getElementById('resName').innerText = data.data.name;
    document.getElementById('resId').innerText = data.data.studentId;
    document.getElementById('resGroup').innerText = data.data.group;

    let html = '';
    data.data.activities.forEach((item, index) => {
        if (item.code || item.token) {
            html += `
                    <div class="activity-card">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                             <small class="text-muted fw-bold">รายการที่ ${index + 1}</small>
                        </div>
                        <div class="d-flex flex-wrap gap-3 align-items-center justify-content-between">
                             <div class="code-pill" onclick="copyText('${item.code}', this)" title="คลิกเพื่อคัดลอก">
                                 <i class="fas fa-hashtag text-secondary"></i> ${item.code} <i class="fas fa-copy ms-2 text-muted opacity-50"></i>
                             </div>
                             <div class="token-badge" onclick="copyText('${item.token}', this)" title="คลิกเพื่อคัดลอก">
                                 <i class="fas fa-key"></i> ${item.token} <i class="fas fa-copy ms-2 opacity-50"></i>
                             </div>
                        </div>
                    </div>`;
        }
    });
    document.getElementById('activitiesList').innerHTML = html;

    // Setup Share Button
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.style.display = 'inline-block';
        shareBtn.onclick = () => copyResultLink(data.data.studentId, data.data.activityName);
    }

    document.getElementById('resultArea').style.display = 'block';
}

function showError(e) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('searchBtn').disabled = false;
    document.getElementById('searchBtn').innerHTML = '<span>ค้นหาข้อมูล</span>';

    document.getElementById('errorMsg').style.display = 'block';
    document.getElementById('errorDetail').innerText = "เกิดข้อผิดพลาดในการเชื่อมต่อ";
    document.getElementById('technicalError').innerText = "Technical Detail: " + e.message;

    if (e.message.includes("404") || e.message.includes("HTML")) {
        document.getElementById('deployHint').style.display = 'block';
    } else {
        document.getElementById('deployHint').style.display = 'none';
    }
}

function resetSearch() {
    if (monitorInterval) clearInterval(monitorInterval);
    document.getElementById('resultArea').style.display = 'none';
    document.getElementById('errorMsg').style.display = 'none';
    document.getElementById('pendingMsg').style.display = 'none';
    document.getElementById('studentId').value = '';
    document.getElementById('welcomeText').innerText = "สาขาวิชาภาษาอังกฤษ มหาวิทยาลัยราชภัฏเลย";
    document.getElementById('welcomeText').style.display = 'block';
    document.getElementById('inputSection').classList.remove('hidden-mode');

    const sel = document.getElementById('activitySelect');
    if (sel.options.length <= 1) fetchActivities();

    if (window.history.pushState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.pushState({ path: newurl }, '', newurl);
    }
}

function copyText(txt, el) {
    if (!txt) return;
    navigator.clipboard.writeText(txt).then(() => {
        if (el) {
            const icon = el.querySelector('.fa-copy');
            if (icon) {
                icon.classList.remove('fa-copy');
                icon.classList.add('fa-check');
                setTimeout(() => {
                    icon.classList.remove('fa-check');
                    icon.classList.add('fa-copy');
                }, 2000);
            }
        }
    });
}

function enableNotification() {
    if (!("Notification" in window)) { alert("บราวเซอร์ไม่รองรับ"); return; }
    Notification.requestPermission().then(p => {
        if (p === "granted") startMonitoring();
        else alert("กรุณาอนุญาตการแจ้งเตือน");
    });
}

function startMonitoring() {
    document.getElementById('btnEnableNotify').style.display = 'none';
    document.getElementById('monitoringStatus').style.display = 'block';
    const id = document.getElementById('studentId').value.trim() || new URLSearchParams(window.location.search).get('id');
    const act = document.getElementById('activitySelect').value || new URLSearchParams(window.location.search).get('name') || new URLSearchParams(window.location.search).get('activity') || new URLSearchParams(window.location.search).get('code');
    monitorInterval = setInterval(() => checkUpdate(id, act), 60000);
}

function checkUpdate(id, act) {
    fetch(`${GAS_API_URL}?action=search&id=${encodeURIComponent(id)}&criteria=${encodeURIComponent(act)}`)
        .then(r => r.json())
        .then(d => {
            if (d.found && d.data.activities[0].code !== 'กำลังดำเนินการ') {
                new Notification("Token มาแล้ว!", { body: "คลิกเพื่อดูรหัส", icon: "https://s3.ap-southeast-1.amazonaws.com/files.stnetradio.com/logo/ENGEDLOGO.ico" });
                clearInterval(monitorInterval);
                showResult(d, true);
            }
        });
}

function copyResultLink(id, act) {
    const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?id=${encodeURIComponent(id)}&activity=${encodeURIComponent(act)}`;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('shareBtn');
        const orgHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check me-1"></i> คัดลอกแล้ว';
        btn.classList.replace('btn-outline-danger', 'btn-success');
        setTimeout(() => {
            btn.innerHTML = orgHtml;
            btn.classList.replace('btn-success', 'btn-outline-danger');
        }, 2000);
    });
}


