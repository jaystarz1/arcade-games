// PWA Install Prompt Manager
class InstallPromptManager {
  constructor() {
    this.deferredPrompt = null;
    this.gamesPlayed = parseInt(localStorage.getItem('si-games-played') || '0');
    this.dontAskAgain = localStorage.getItem('si-dont-ask-install') === 'true';
    this.isInstalled = this.checkIfInstalled();

    this.init();
  }

  checkIfInstalled() {
    // Check if running as installed PWA
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  init() {
    // Listen for beforeinstallprompt event (Android/Desktop)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('Install prompt available');
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      this.isInstalled = true;
      this.hidePrompt();
    });
  }

  incrementGamesPlayed() {
    if (this.isInstalled || this.dontAskAgain) {
      console.log('Install prompt blocked:', {isInstalled: this.isInstalled, dontAsk: this.dontAskAgain});
      return;
    }

    this.gamesPlayed++;
    localStorage.setItem('si-games-played', this.gamesPlayed.toString());
    console.log('Games played:', this.gamesPlayed);

    // Visual debug for game count
    const countDiv = document.createElement('div');
    countDiv.style.cssText = 'position:fixed;top:50px;left:10px;background:blue;color:white;padding:10px;z-index:99999;font-size:14px;';
    countDiv.textContent = 'Total games: ' + this.gamesPlayed;
    document.body.appendChild(countDiv);
    setTimeout(() => countDiv.remove(), 2000);

    // Show prompt every 5 games
    if (this.gamesPlayed % 5 === 0) {
      console.log('Triggering install prompt at game', this.gamesPlayed);
      this.showPrompt();
    }
  }

  showPrompt() {
    if (this.isInstalled || this.dontAskAgain) return;

    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // Create and show the modal
    const modal = this.createPromptModal(isAndroid, isIOS);
    document.body.appendChild(modal);

    // Trigger animation
    setTimeout(() => modal.classList.add('show'), 10);
  }

  createPromptModal(isAndroid, isIOS) {
    const modal = document.createElement('div');
    modal.className = 'install-prompt-overlay';
    modal.innerHTML = `
      <div class="install-prompt-modal">
        <button class="install-prompt-close" aria-label="Close">&times;</button>

        <div class="install-prompt-content">
          <div class="install-prompt-icon">🚀</div>
          <h2>Install Lunar Lander</h2>
          <p>Play offline anytime, anywhere!</p>

          ${isAndroid ? this.getAndroidInstructions() : ''}
          ${isIOS ? this.getIOSInstructions() : ''}
          ${!isAndroid && !isIOS ? this.getDesktopInstructions() : ''}

          <div class="install-prompt-actions">
            ${isAndroid && this.deferredPrompt ?
              '<button class="install-prompt-btn install-btn-primary" id="install-now-btn">Install Now</button>' :
              ''}
            <label class="install-prompt-checkbox">
              <input type="checkbox" id="dont-ask-checkbox">
              Don't ask again
            </label>
          </div>
        </div>
      </div>
    `;

    // Close button handler
    modal.querySelector('.install-prompt-close').addEventListener('click', () => {
      this.handleClose(modal);
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.handleClose(modal);
      }
    });

    // Don't ask again checkbox
    modal.querySelector('#dont-ask-checkbox').addEventListener('change', (e) => {
      if (e.target.checked) {
        localStorage.setItem('si-dont-ask-install', 'true');
        this.dontAskAgain = true;
      } else {
        localStorage.removeItem('si-dont-ask-install');
        this.dontAskAgain = false;
      }
    });

    // Install button (Android/Desktop)
    const installBtn = modal.querySelector('#install-now-btn');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (this.deferredPrompt) {
          this.deferredPrompt.prompt();
          const { outcome } = await this.deferredPrompt.userChoice;
          console.log('Install outcome:', outcome);
          this.deferredPrompt = null;
          this.hidePrompt(modal);
        }
      });
    }

    return modal;
  }

  getAndroidInstructions() {
    return `
      <div class="install-instructions">
        <p class="platform-label">📱 Android Instructions:</p>
        ${this.deferredPrompt ?
          '<p>Click "Install Now" below to add to your home screen!</p>' :
          `<ol>
            <li>Tap the menu icon (⋮) in your browser</li>
            <li>Select "Add to Home screen" or "Install app"</li>
            <li>Tap "Add" or "Install"</li>
          </ol>`
        }
      </div>
    `;
  }

  getIOSInstructions() {
    return `
      <div class="install-instructions">
        <p class="platform-label">📱 iPhone/iPad Instructions:</p>
        <ol>
          <li>Tap the Share button <span style="font-size: 1.2em;">⎋</span> at the bottom</li>
          <li>Scroll down and tap "Add to Home Screen"</li>
          <li>Tap "Add" in the top right</li>
        </ol>
      </div>
    `;
  }

  getDesktopInstructions() {
    return `
      <div class="install-instructions">
        <p class="platform-label">💻 Desktop Instructions:</p>
        ${this.deferredPrompt ?
          '<p>Click "Install Now" below to install!</p>' :
          `<ol>
            <li>Look for the install icon <span style="font-size: 1.2em;">⊕</span> in the address bar</li>
            <li>Click it and select "Install"</li>
            <li>The app will open in its own window</li>
          </ol>`
        }
      </div>
    `;
  }

  handleClose(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  }

  hidePrompt(modal = null) {
    if (modal) {
      this.handleClose(modal);
    } else {
      const existingModal = document.querySelector('.install-prompt-overlay');
      if (existingModal) {
        this.handleClose(existingModal);
      }
    }
  }
}

// CSS styles for the install prompt
const installPromptStyles = `
<style>
.install-prompt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(5px);
}

.install-prompt-overlay.show {
  opacity: 1;
}

.install-prompt-modal {
  background: linear-gradient(135deg, #1a1f71 0%, #2a2f91 100%);
  border-radius: 20px;
  padding: 30px;
  max-width: 450px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transform: scale(0.9);
  transition: transform 0.3s ease;
}

.install-prompt-overlay.show .install-prompt-modal {
  transform: scale(1);
}

.install-prompt-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: 28px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  line-height: 1;
  padding: 0;
}

.install-prompt-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.install-prompt-content {
  color: white;
  text-align: center;
}

.install-prompt-icon {
  font-size: 64px;
  margin-bottom: 15px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.install-prompt-content h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: bold;
}

.install-prompt-content > p {
  margin: 0 0 20px 0;
  font-size: 16px;
  opacity: 0.9;
}

.install-instructions {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  text-align: left;
}

.platform-label {
  font-weight: bold;
  font-size: 16px;
  margin: 0 0 12px 0;
  text-align: center;
}

.install-instructions ol {
  margin: 10px 0;
  padding-left: 25px;
}

.install-instructions li {
  margin: 8px 0;
  line-height: 1.5;
}

.install-prompt-actions {
  margin-top: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}

.install-prompt-btn {
  padding: 14px 32px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  max-width: 250px;
}

.install-btn-primary {
  background: linear-gradient(135deg, #f9c74f 0%, #f39c12 100%);
  color: #1a1f71;
  box-shadow: 0 4px 15px rgba(249, 199, 79, 0.4);
}

.install-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(249, 199, 79, 0.6);
}

.install-btn-primary:active {
  transform: translateY(0);
}

.install-prompt-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.8;
  user-select: none;
}

.install-prompt-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.install-prompt-checkbox:hover {
  opacity: 1;
}

@media (max-width: 500px) {
  .install-prompt-modal {
    padding: 25px 20px;
  }

  .install-prompt-content h2 {
    font-size: 24px;
  }

  .install-prompt-icon {
    font-size: 48px;
  }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', installPromptStyles);

// Export for use in game
window.InstallPromptManager = InstallPromptManager;
