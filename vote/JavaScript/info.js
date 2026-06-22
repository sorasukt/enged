
        const APP_URL = "https://script.google.com/macros/s/AKfycbzMAhUcwoYV-OuYne_h6qeIczrI0qGfv58_qgls9k8ONWJEdZGoZgqofrtVCNxZu3qk1w/exec";
        
        function hideResults() { 
            document.querySelectorAll('.result-card').forEach(el => el.style.display = 'none');
        }
        
        function checkRights() {
            const id = document.getElementById('studentIdInput').value;
            const errorMsg = document.getElementById('errorMsg');
            const loader = document.getElementById('loader');
            
            hideResults();
            
            if (id.length !== 10) { 
                errorMsg.innerText = "รหัสนักศึกษาต้องมี 10 หลัก"; 
                return; 
            }
            
            errorMsg.innerText = ""; 
            loader.style.display = 'block';
            
            fetch(`${APP_URL}?action=checkRights&studentId=${id}`)
                .then(res => res.json())
                .then(data => {
                    loader.style.display = 'none';
                    if (data.status === 'success') {
                        if (data.hasVoted) {
                            document.getElementById('votedName').textContent = data.data.name;
                            document.getElementById('votedGroup').textContent = data.data.group;
                            document.getElementById('resultVoted').style.display = 'block';
                        } else {
                            document.getElementById('eligibleName').textContent = data.data.name;
                            document.getElementById('eligibleGroup').textContent = data.data.group;
                            document.getElementById('resultEligible').style.display = 'block';
                        }
                    } else {
                        document.getElementById('notEligibleMsg').textContent = data.message || 'ไม่พบข้อมูลในระบบ';
                        document.getElementById('resultNotEligible').style.display = 'block';
                    }
                })
                .catch(err => { 
                    loader.style.display = 'none'; 
                    errorMsg.innerText = "เกิดข้อผิดพลาดในการเชื่อมต่อ"; 
                });
        }
        
        document.getElementById('studentIdInput').addEventListener('keypress', e => { 
            if (e.key === 'Enter') checkRights(); 
        });
    