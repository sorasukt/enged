// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log(
          'ServiceWorker registration successful with scope: ',
          registration.scope
        );
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

// Optional: Listen for "beforeinstallprompt" event
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI notify the user they can install the PWA
  console.log('PWA Install Triggered');
});

// iOS PWA Install Prompt Logic
(function () {
  // Detect iOS
  const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  };

  // Detect Standalone Mode
  const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

  // Only run on iOS and not in standalone mode
  if (isIos() && !isInStandaloneMode()) {
    // Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
      .ios-pwa-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 12px 24px;
        font-family: 'IBM Plex Sans Thai', sans-serif;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 4px 15px rgba(211, 47, 47, 0.4);
        z-index: 9999;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s, box-shadow 0.2s;
        animation: slideInUp 0.5s ease-out 1s both;
      }
      .ios-pwa-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(211, 47, 47, 0.5);
      }
      .ios-pwa-btn:active {
        transform: scale(0.98);
      }
      
      .ios-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        z-index: 10000;
        display: none;
        align-items: flex-end; /* Bottom sheet style for mobile */
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .ios-modal-overlay.active {
        display: flex;
        opacity: 1;
      }
      
      .ios-modal {
        background: rgba(255, 255, 255, 0.95);
        width: 100%;
        max-width: 500px;
        border-top-left-radius: 24px;
        border-top-right-radius: 24px;
        padding: 32px 24px;
        box-shadow: 0 -10px 40px rgba(0,0,0,0.2);
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        text-align: center;
        position: relative;
      }
      .ios-modal-overlay.active .ios-modal {
        transform: translateY(0);
      }
      
      @media (min-width: 768px) {
        .ios-modal-overlay {
            align-items: center;
        }
        .ios-modal {
            border-radius: 24px;
            width: 90%;
        }
      }

      .ios-modal h3 {
        margin: 0 0 16px 0;
        color: #1a1a2e;
        font-size: 1.25rem;
        font-weight: 700;
      }
      
      .ios-step {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
        text-align: left;
        background: #f8f9fa;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid #e9ecef;
      }
      .ios-step-icon {
        font-size: 24px;
        color: #007bff; /* iOS Blue */
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #e3f2fd;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .ios-step-text {
        font-size: 0.95rem;
        color: #4a5568;
        font-weight: 500;
      }
      .ios-step-text strong {
        color: #1a1a2e;
        display: block;
        margin-bottom: 2px;
      }

      .ios-close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        color: #adb5bd;
        font-size: 20px;
        cursor: pointer;
        padding: 5px;
      }
      
      @keyframes slideInUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Create Button
    const btn = document.createElement('button');
    btn.className = 'ios-pwa-btn';
    btn.innerHTML = '<i class="fas fa-download"></i> เปิดในแอป';
    document.body.appendChild(btn);

    // Create Modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'ios-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="ios-modal">
        <button class="ios-close-btn" onclick="this.closest('.ios-modal-overlay').classList.remove('active')">
            <i class="fas fa-times"></i>
        </button>
        <h3>ติดตั้งแอป English Education</h3>
        <p style="color: #64748b; margin-bottom: 24px; font-size: 0.9rem;">
            เพื่อประสบการณ์การใช้งานที่ดีที่สุด กรุณาติดตั้งแอปพลิเคชันลงบนหน้าจอโฮมของคุณ
        </p>
        
        <div class="ios-step">
            <div class="ios-step-icon">
                <i class="fas fa-share-square"></i>
            </div>
            <div class="ios-step-text">
                <strong>1. แตะที่ปุ่มแชร์</strong>
                ด้านล่างของหน้าจอ (หรือด้านบนขวาบน iPad)
            </div>
        </div>
        
        <div class="ios-step">
            <div class="ios-step-icon">
                <i class="fas fa-plus-square"></i>
            </div>
            <div class="ios-step-text">
                <strong>2. เลือก "เพิ่มไปยังหน้าจอโฮม"</strong>
                (Add to Home Screen)
            </div>
        </div>

         <div class="ios-step" style="border:none; background:transparent; justify-content:center; margin-bottom:0;">
            <div class="ios-step-text" style="color:#d32f2f; font-size:0.85rem; text-align:center;">
                <i class="fas fa-arrow-down"></i> กดปุ่มแชร์ที่แถบด้านล่าง
            </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    // Event Listeners
    btn.addEventListener('click', () => {
      modalOverlay.classList.add('active');
    });

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
      }
    });
  }
})();
