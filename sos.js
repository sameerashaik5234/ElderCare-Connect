// Emergency SOS Coordinator
class SosManager {
  constructor() {
    this.countdownTimer = null;
    this.countdownSeconds = 5;
    this.isTriggered = false;
  }

  showSosModal() {
    const modal = document.getElementById('sos-modal');
    if (!modal) return;

    this.countdownSeconds = 5;
    this.isTriggered = false;
    modal.classList.remove('hidden');

    const countdownEl = document.getElementById('sos-countdown');
    const triggerBtn = document.getElementById('sos-confirm-trigger');

    if (countdownEl) countdownEl.innerText = this.countdownSeconds;

    clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      this.countdownSeconds--;
      if (countdownEl) countdownEl.innerText = this.countdownSeconds;

      if (this.countdownSeconds <= 0) {
        clearInterval(this.countdownTimer);
        this.executeSosDispatch();
      }
    }, 1000);
  }

  cancelSos() {
    clearInterval(this.countdownTimer);
    const modal = document.getElementById('sos-modal');
    if (modal) modal.classList.add('hidden');
  }

  async executeSosDispatch() {
    clearInterval(this.countdownTimer);
    if (this.isTriggered) return;
    this.isTriggered = true;

    // Play siren sound
    if (window.voiceAssistant) {
      window.voiceAssistant.playEmergencySiren();
    }

    const patient = window.appCoordinator ? window.appCoordinator.currentPatient : null;
    const elderlyId = patient ? patient.profileId : null;

    let coords = { latitude: null, longitude: null };

    // Attempt GPS capture
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 3000 });
        });
        if (position) {
          coords.latitude = position.coords.latitude;
          coords.longitude = position.coords.longitude;
        }
      } catch (e) {
        console.warn('Geolocation capture bypassed:', e);
      }
    }

    try {
      const res = await fetch('/api/sos/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderlyId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          locationAddress: coords.latitude ? `GPS: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : 'Home location'
        })
      });
      const data = await res.json();
      this.showSosActiveScreen(data);
    } catch (err) {
      console.error('Failed to dispatch SOS via API:', err);
      // Offline fallback: still display emergency numbers!
      this.showSosActiveScreen({
        emergencyContact: patient ? patient.emergencyContact : { name: 'Emergency Caregiver', phone: '+91 98765 00001' }
      });
    }
  }

  showSosActiveScreen(data) {
    const modalContent = document.getElementById('sos-modal-content');
    if (!modalContent) return;

    const contact = data.emergencyContact || { name: 'Caregiver', phone: '+91 98765 00001' };

    modalContent.innerHTML = `
      <div class="text-center p-6 bg-red-600 text-white rounded-2xl shadow-2xl">
        <div class="text-6xl mb-4 animate-bounce">🚨</div>
        <h2 class="text-3xl font-extrabold mb-2">${t('sosActiveAlert')}</h2>
        <p class="text-lg opacity-90 mb-6">${t('voiceSosConfirm')}</p>
        
        <div class="bg-white text-red-900 p-4 rounded-xl mb-6 shadow">
          <p class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-1">Primary Emergency Contact</p>
          <p class="text-2xl font-black">${contact.name}</p>
          <p class="text-xl font-bold mt-1">${contact.phone}</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="tel:${contact.phone}" class="bg-white text-red-700 hover:bg-red-50 text-xl font-black py-4 px-8 rounded-xl shadow-lg border-2 border-white transition flex items-center justify-center gap-3">
            <span>📞</span> <span>Call ${contact.name}</span>
          </a>
          <button onclick="window.sosManager.closeActiveSos()" class="bg-red-800 hover:bg-red-900 text-white font-bold py-4 px-6 rounded-xl transition">
            ${t('close')}
          </button>
        </div>
      </div>
    `;
  }

  closeActiveSos() {
    const modal = document.getElementById('sos-modal');
    if (modal) modal.classList.add('hidden');
    // Refresh coordinator to restore original modal HTML
    if (window.appCoordinator) {
      window.appCoordinator.renderSosModalShell();
    }
  }
}

window.sosManager = new SosManager();
