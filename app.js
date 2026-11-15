// ElderCare Connect - Master SPA Application Coordinator
class AppCoordinator {
  constructor() {
    this.currentUser = null;
    this.currentPatient = null;
    this.currentMode = 'senior'; // 'senior', 'caregiver', 'analytics'
    this.cachedData = {
      doses: [],
      medications: [],
      appointments: [],
      vitals: [],
      notifications: [],
      stats: null,
      correlationPoints: []
    };
  }

  async init() {
    console.log('[ElderCare Connect] Initializing master coordinator...');
    this.applyAccessibilitySettings();
    this.renderSosModalShell();
    this.initFormListeners();

    // Listen for language changes and immediately re-render active views
    window.addEventListener('languageChanged', () => {
      this.renderCurrentView();
    });

    // Check existing session or load demo persona
    const savedUser = localStorage.getItem('eldercare_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {}
    }

    // Load initial demo persona if no user
    if (!this.currentUser) {
      await this.switchDemoPersona('elderly');
    } else {
      await this.refreshData();
    }
  }

  applyAccessibilitySettings() {
    const savedFontSize = localStorage.getItem('eldercare_font_size') || 'large';
    const savedContrast = localStorage.getItem('eldercare_contrast') || 'normal';

    document.documentElement.setAttribute('data-font-size', savedFontSize);
    document.documentElement.setAttribute('data-contrast', savedContrast);

    const fontSelect = document.getElementById('font-size-select');
    if (fontSelect) fontSelect.value = savedFontSize;

    const contrastBtn = document.getElementById('contrast-toggle-btn');
    if (contrastBtn) {
      contrastBtn.innerText = savedContrast === 'high' ? 'Standard Contrast' : 'High Contrast';
    }
  }

  setFontSize(size) {
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('eldercare_font_size', size);
  }

  toggleContrast() {
    const current = document.documentElement.getAttribute('data-contrast') || 'normal';
    const next = current === 'high' ? 'normal' : 'high';
    document.documentElement.setAttribute('data-contrast', next);
    localStorage.setItem('eldercare_contrast', next);

    const contrastBtn = document.getElementById('contrast-toggle-btn');
    if (contrastBtn) {
      contrastBtn.innerText = next === 'high' ? 'Standard Contrast' : 'High Contrast';
    }
  }

  async switchDemoPersona(personaType) {
    console.log(`[AppCoordinator] Switching demo persona to: ${personaType}`);
    try {
      const res = await fetch('/api/auth/demo-personas');
      const data = await res.json();
      const personas = data.personas;

      if (personaType === 'elderly' && personas.elderly) {
        const loginRes = await fetch('/api/auth/pin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId: personas.elderly.profileId, passcode: '1234' })
        });
        const loginData = await loginRes.json();
        this.handleLoginSuccess(loginData.user, 'senior');
      } else if (personaType === 'caregiver' && personas.caregiver) {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: personas.caregiver.email, password: 'Caregiver@123' })
        });
        const loginData = await loginRes.json();
        this.handleLoginSuccess(loginData.user, 'caregiver');
      } else if (personaType === 'family' && personas.family) {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: personas.family.email, password: 'Family@123' })
        });
        const loginData = await loginRes.json();
        this.handleLoginSuccess(loginData.user, 'caregiver');
      }
    } catch (e) {
      console.warn('Demo persona switch error, fallback to offline cache:', e);
      const offline = window.offlineManager && window.offlineManager.getEssentialCache();
      if (offline && offline.profile) {
        this.handleLoginSuccess(offline.profile, 'senior');
      }
    }
  }

  handleLoginSuccess(user, preferredMode = null) {
    this.currentUser = user;
    if (user.role === 'ELDERLY') {
      this.currentPatient = user;
      this.currentMode = preferredMode || 'senior';
    } else {
      // Caregiver or family
      this.currentPatient = user.linkedProfiles && user.linkedProfiles.length > 0
        ? {
            profileId: user.linkedProfiles[0].id,
            name: user.linkedProfiles[0].full_name,
            age: user.linkedProfiles[0].age,
            bloodGroup: user.linkedProfiles[0].blood_group,
            allergies: user.linkedProfiles[0].allergies,
            conditions: user.linkedProfiles[0].medical_conditions,
            emergencyContact: {
              name: user.linkedProfiles[0].emergency_contact_name,
              phone: user.linkedProfiles[0].emergency_contact_phone,
              email: user.linkedProfiles[0].emergency_contact_email
            }
          }
        : null;
      this.currentMode = preferredMode || 'caregiver';
    }

    this.updateUserDisplay();
    this.refreshData();
  }

  updateUserDisplay() {
    const roleBadge = document.getElementById('user-role-badge');
    const userName = document.getElementById('user-display-name');
    if (roleBadge && this.currentUser) {
      roleBadge.innerText = this.currentUser.role;
    }
    if (userName && this.currentUser) {
      userName.innerText = this.currentUser.name;
    }

    const personaSelect = document.getElementById('persona-select');
    if (personaSelect && this.currentUser) {
      if (this.currentUser.role === 'ELDERLY') personaSelect.value = 'elderly';
      else if (this.currentUser.role === 'CAREGIVER') personaSelect.value = 'caregiver';
      else if (this.currentUser.role === 'FAMILY') personaSelect.value = 'family';
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    this.renderCurrentView();
  }

  async refreshData() {
    const patientId = this.currentPatient ? (this.currentPatient.profileId || this.currentPatient.id) : null;
    if (!patientId) return;

    try {
      const [dosesRes, medsRes, apptsRes, vitalsRes, notifsRes, statsRes, corrRes] = await Promise.all([
        fetch(`/api/adherence/today?elderlyId=${patientId}`),
        fetch(`/api/medications?elderlyId=${patientId}`),
        fetch(`/api/appointments?elderlyId=${patientId}`),
        fetch(`/api/vitals?elderlyId=${patientId}`),
        fetch(`/api/notifications?elderlyId=${patientId}`),
        fetch(`/api/adherence/stats?elderlyId=${patientId}&days=7`),
        fetch(`/api/vitals/correlation?elderlyId=${patientId}&days=7`)
      ]);

      const dosesData = await dosesRes.json();
      const medsData = await medsRes.json();
      const apptsData = await apptsRes.json();
      const vitalsData = await vitalsRes.json();
      const notifsData = await notifsRes.json();
      const statsData = await statsRes.json();
      const corrData = await corrRes.json();

      this.cachedData = {
        doses: dosesData.doses || [],
        medications: medsData.medications || [],
        appointments: apptsData.appointments || [],
        vitals: vitalsData.vitals || [],
        notifications: notifsData.notifications || [],
        stats: statsData.stats || null,
        correlationPoints: corrData.points || []
      };

      // Save to offline storage
      if (window.offlineManager) {
        window.offlineManager.saveEssentialCache({
          profile: this.currentPatient,
          doses: this.cachedData.doses,
          appointments: this.cachedData.appointments
        });
      }

      this.renderCurrentView();
    } catch (err) {
      console.warn('[AppCoordinator] Fetch error, loading offline cache:', err);
      if (window.offlineManager) {
        const offline = window.offlineManager.getEssentialCache();
        if (offline) {
          this.cachedData.doses = offline.doses || [];
          this.cachedData.appointments = offline.appointments || [];
          this.renderCurrentView();
        }
      }
    }
  }

  renderCurrentView() {
    const container = document.getElementById('main-content-container');
    if (!container) return;

    // Update Top Navigation Mode Buttons
    document.querySelectorAll('[data-nav-mode]').forEach(btn => {
      const mode = btn.getAttribute('data-nav-mode');
      if (mode === this.currentMode) {
        btn.classList.add('bg-blue-600', 'text-white', 'shadow');
        btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white', 'shadow');
        btn.classList.add('text-slate-600', 'hover:bg-slate-100');
      }
    });

    if (this.currentMode === 'senior') {
      window.seniorView.render(container, this.cachedData.doses, this.currentPatient);
    } else if (this.currentMode === 'caregiver') {
      window.caregiverView.render(container, {
        patient: this.currentPatient,
        medications: this.cachedData.medications,
        appointments: this.cachedData.appointments,
        vitals: this.cachedData.vitals,
        notifications: this.cachedData.notifications,
        stats: this.cachedData.stats
      });
    } else if (this.currentMode === 'analytics') {
      window.analyticsView.render(container, {
        stats: this.cachedData.stats,
        correlationPoints: this.cachedData.correlationPoints,
        patient: this.currentPatient
      });
    }
  }

  renderCaregiverView() {
    const container = document.getElementById('main-content-container');
    if (this.currentMode === 'caregiver' && container) {
      window.caregiverView.render(container, {
        patient: this.currentPatient,
        medications: this.cachedData.medications,
        appointments: this.cachedData.appointments,
        vitals: this.cachedData.vitals,
        notifications: this.cachedData.notifications,
        stats: this.cachedData.stats
      });
    }
  }

  renderSosModalShell() {
    const modalContent = document.getElementById('sos-modal-content');
    if (!modalContent) return;

    modalContent.innerHTML = `
      <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl border-4 border-red-500">
        <div class="text-7xl mb-3 animate-pulse">🚨</div>
        <h2 class="text-3xl font-black text-red-600 mb-2">${t('sosConfirmTitle')}</h2>
        <p class="text-slate-700 text-lg mb-6">${t('sosConfirmDesc')}</p>
        
        <div class="bg-red-50 p-4 rounded-2xl mb-6">
          <p class="text-xs uppercase font-extrabold tracking-wider text-red-800">Dispatching in</p>
          <p id="sos-countdown" class="text-6xl font-black text-red-600 my-1">5</p>
          <p class="text-xs text-red-700">seconds (press cancel if clicked by accident)</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
          <button onclick="window.sosManager.cancelSos()" class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold py-4 rounded-2xl text-lg transition">
            ${t('sosCancel')}
          </button>
          <button id="sos-confirm-trigger" onclick="window.sosManager.executeSosDispatch()" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold py-4 rounded-2xl text-lg shadow-lg transition">
            ${t('sosTriggerNow')}
          </button>
        </div>
      </div>
    `;
  }

  initFormListeners() {
    // Add Medication Form
    const addMedForm = document.getElementById('add-med-form');
    if (addMedForm) {
      addMedForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const patientId = this.currentPatient ? (this.currentPatient.profileId || this.currentPatient.id) : null;
        const timeSlotStr = document.getElementById('form-med-times').value;
        const timeSlots = timeSlotStr.split(',').map(s => s.trim()).filter(Boolean);

        const payload = {
          elderlyId: patientId,
          name: document.getElementById('form-med-name').value,
          name_te: document.getElementById('form-med-name-te').value || null,
          dosage: document.getElementById('form-med-dosage').value,
          form: document.getElementById('form-med-form').value,
          frequency: document.getElementById('form-med-frequency').value,
          timeSlots: timeSlots.length > 0 ? timeSlots : ['08:00'],
          meal_timing: document.getElementById('form-med-meal').value,
          instructions: document.getElementById('form-med-instructions').value,
          totalQuantity: parseInt(document.getElementById('form-med-total').value || '30', 10),
          refillThreshold: parseInt(document.getElementById('form-med-threshold').value || '7', 10),
          doctor_name: document.getElementById('form-med-doctor').value
        };

        try {
          await fetch('/api/medications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          document.getElementById('add-med-modal').classList.add('hidden');
          addMedForm.reset();
          this.refreshData();
        } catch (err) {
          alert('Error adding medication: ' + err.message);
        }
      });
    }

    // Add Appointment Form
    const addApptForm = document.getElementById('add-appt-form');
    if (addApptForm) {
      addApptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const patientId = this.currentPatient ? (this.currentPatient.profileId || this.currentPatient.id) : null;
        const payload = {
          elderlyId: patientId,
          doctor_name: document.getElementById('form-appt-doctor').value,
          specialty: document.getElementById('form-appt-specialty').value,
          clinic_address: document.getElementById('form-appt-clinic').value,
          phone: document.getElementById('form-appt-phone').value,
          appointment_date: document.getElementById('form-appt-date').value,
          appointment_time: document.getElementById('form-appt-time').value,
          checklist_notes: document.getElementById('form-appt-checklist').value
        };

        try {
          await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          document.getElementById('add-appt-modal').classList.add('hidden');
          addApptForm.reset();
          this.refreshData();
        } catch (err) {
          alert('Error adding appointment: ' + err.message);
        }
      });
    }

    // Log Vitals Form
    const logVitalsForm = document.getElementById('log-vitals-form');
    if (logVitalsForm) {
      logVitalsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const patientId = this.currentPatient ? (this.currentPatient.profileId || this.currentPatient.id) : null;
        const type = document.getElementById('form-vital-type').value;
        const val1 = document.getElementById('form-vital-val1').value;
        const val2 = document.getElementById('form-vital-val2').value;
        const mood = document.getElementById('form-vital-mood').value;

        let unit = 'mmHg';
        if (type === 'GLUCOSE') unit = 'mg/dL';
        else if (type === 'HEART_RATE') unit = 'bpm';
        else if (type === 'SPO2') unit = '%';

        const payload = {
          elderlyId: patientId,
          type,
          value_primary: val1,
          value_secondary: val2 || null,
          unit,
          mood_tag: mood,
          notes: 'Caregiver checkup'
        };

        try {
          await fetch('/api/vitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          document.getElementById('log-vitals-modal').classList.add('hidden');
          logVitalsForm.reset();
          this.refreshData();
        } catch (err) {
          alert('Error logging vital: ' + err.message);
        }
      });
    }
  }
}

window.appCoordinator = new AppCoordinator();
document.addEventListener('DOMContentLoaded', () => {
  window.appCoordinator.init();
});
