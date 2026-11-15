// Authentication Modal: Senior 4-Digit PIN Keypad & Caregiver Login
class AuthModal {
  constructor() {
    this.currentPin = '';
    this.selectedProfileId = null;
  }

  init() {
    this.renderKeypad();
  }

  showPinLogin(profileId, profileName) {
    this.currentPin = '';
    this.selectedProfileId = profileId;
    const modal = document.getElementById('auth-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.getElementById('pin-display').innerText = '____';
    document.getElementById('pin-profile-name').innerText = profileName || 'Senior Profile';
    document.getElementById('pin-error').innerText = '';
    document.getElementById('pin-login-view').classList.remove('hidden');
    document.getElementById('caregiver-login-view').classList.add('hidden');
  }

  showCaregiverLogin() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.getElementById('pin-login-view').classList.add('hidden');
    document.getElementById('caregiver-login-view').classList.remove('hidden');
    document.getElementById('caregiver-error').innerText = '';
  }

  close() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
  }

  appendPinDigit(digit) {
    if (this.currentPin.length < 4) {
      this.currentPin += digit;
      this.updatePinDisplay();
      if (this.currentPin.length === 4) {
        setTimeout(() => this.submitPin(), 200);
      }
    }
  }

  clearPin() {
    this.currentPin = '';
    this.updatePinDisplay();
  }

  updatePinDisplay() {
    const display = document.getElementById('pin-display');
    if (!display) return;
    const dots = '● '.repeat(this.currentPin.length) + '_ '.repeat(4 - this.currentPin.length);
    display.innerText = dots.trim();
  }

  async submitPin() {
    if (this.currentPin.length !== 4) return;
    const errEl = document.getElementById('pin-error');
    errEl.innerText = 'Verifying PIN...';

    try {
      const res = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: this.selectedProfileId,
          passcode: this.currentPin
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'PIN verification failed');
      }

      // Success
      localStorage.setItem('eldercare_token', data.token);
      localStorage.setItem('eldercare_user', JSON.stringify(data.user));
      this.close();
      if (window.appCoordinator) {
        window.appCoordinator.handleLoginSuccess(data.user);
      }
    } catch (err) {
      errEl.innerText = err.message;
      this.currentPin = '';
      this.updatePinDisplay();
    }
  }

  async submitCaregiverLogin() {
    const email = document.getElementById('caregiver-email').value;
    const password = document.getElementById('caregiver-password').value;
    const errEl = document.getElementById('caregiver-error');
    errEl.innerText = 'Authenticating...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('eldercare_token', data.token);
      localStorage.setItem('eldercare_user', JSON.stringify(data.user));
      this.close();
      if (window.appCoordinator) {
        window.appCoordinator.handleLoginSuccess(data.user);
      }
    } catch (err) {
      errEl.innerText = err.message;
    }
  }

  renderKeypad() {
    const container = document.getElementById('pin-keypad-container');
    if (!container) return;

    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'];
    container.innerHTML = digits.map(d => {
      let bg = 'bg-white hover:bg-blue-50 text-slate-800 border-2 border-slate-200 active:bg-blue-200';
      let action = `window.authModal.appendPinDigit('${d}')`;
      if (d === 'C') {
        bg = 'bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold border-2 border-amber-300';
        action = `window.authModal.clearPin()`;
      } else if (d === '✓') {
        bg = 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-2 border-emerald-600';
        action = `window.authModal.submitPin()`;
      }

      return `
        <button onclick="${action}" class="${bg} rounded-2xl h-16 sm:h-20 text-2xl sm:text-3xl font-extrabold flex items-center justify-center shadow transition-transform active:scale-95">
          ${d}
        </button>
      `;
    }).join('');
  }
}

window.authModal = new AuthModal();
