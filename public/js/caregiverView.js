// Caregiver & Family Portal Management View
class CaregiverView {
  constructor() {
    this.activeTab = 'medications'; // 'medications', 'appointments', 'vitals', 'notifications'
  }

  render(container, data) {
    const { patient, medications, appointments, vitals, notifications, stats } = data;
    const isTe = currentLanguage === 'te';

    let html = `
      <div class="max-w-6xl mx-auto space-y-8">
        <!-- Patient Clinical Banner -->
        <div class="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-3xl font-black flex items-center justify-center shadow">
              ${patient ? patient.name.charAt(0) : 'P'}
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">${patient ? patient.name : 'Patient'}</h1>
                <span class="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">Age: ${patient ? patient.age : 72}</span>
                <span class="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full">Blood: ${patient ? patient.bloodGroup : 'O+'}</span>
              </div>
              <p class="text-slate-600 mt-1 font-medium">
                <strong>Conditions:</strong> ${patient ? patient.conditions : 'Hypertension, Diabetes'}
              </p>
              <p class="text-rose-600 text-sm font-bold mt-0.5">
                <strong>⚠️ Allergies:</strong> ${patient ? patient.allergies : 'Penicillin'}
              </p>
            </div>
          </div>

          <!-- Adherence Score Widget -->
          <div class="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div class="text-center">
              <span class="text-xs uppercase font-extrabold tracking-wider text-slate-500">${t('adherenceRate')}</span>
              <p class="text-4xl font-black text-blue-700">${stats ? stats.adherenceRate : 92}%</p>
            </div>
            <div class="h-10 w-px bg-slate-300"></div>
            <div class="text-center">
              <span class="text-xs uppercase font-extrabold tracking-wider text-slate-500">${t('activeStreak')}</span>
              <p class="text-4xl font-black text-emerald-600">${stats ? stats.streak : 5} <span class="text-sm font-semibold">${t('daysStreak')}</span></p>
            </div>
          </div>
        </div>

        <!-- Quick Action / Cloud Scheduler Bar -->
        <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow">
          <div class="flex items-center gap-3">
            <span class="text-2xl">☁️</span>
            <div>
              <p class="font-bold text-sm">Google Cloud Scheduler Simulator</p>
              <p class="text-xs text-slate-400">Triggers automated 30-min missed dose checks and caregiver email alerts</p>
            </div>
          </div>
          <button onclick="window.caregiverView.triggerSchedulerCheck()" class="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow transition flex items-center gap-2">
            <span>⚡</span>
            <span>${t('runScheduler')}</span>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex border-b border-slate-200 space-x-2 sm:space-x-8 overflow-x-auto pb-1">
          <button onclick="window.caregiverView.switchTab('medications')" class="py-3 px-4 font-extrabold text-base border-b-2 transition ${this.activeTab === 'medications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}">
            💊 ${t('manageMeds')} (${medications ? medications.length : 0})
          </button>
          <button onclick="window.caregiverView.switchTab('appointments')" class="py-3 px-4 font-extrabold text-base border-b-2 transition ${this.activeTab === 'appointments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}">
            🩺 ${t('appointments')} (${appointments ? appointments.length : 0})
          </button>
          <button onclick="window.caregiverView.switchTab('vitals')" class="py-3 px-4 font-extrabold text-base border-b-2 transition ${this.activeTab === 'vitals' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}">
            📊 ${t('vitalsMood')}
          </button>
          <button onclick="window.caregiverView.switchTab('notifications')" class="py-3 px-4 font-extrabold text-base border-b-2 transition ${this.activeTab === 'notifications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}">
            🔔 ${t('notificationsFeed')} (${notifications ? notifications.length : 0})
          </button>
        </div>

        <!-- Tab Contents -->
        <div id="caregiver-tab-content">
          ${this.renderActiveTab(data)}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  switchTab(tab) {
    this.activeTab = tab;
    if (window.appCoordinator) {
      window.appCoordinator.renderCaregiverView();
    }
  }

  renderActiveTab(data) {
    if (this.activeTab === 'medications') return this.renderMedicationsTab(data.medications);
    if (this.activeTab === 'appointments') return this.renderAppointmentsTab(data.appointments);
    if (this.activeTab === 'vitals') return this.renderVitalsTab(data.vitals);
    if (this.activeTab === 'notifications') return this.renderNotificationsTab(data.notifications);
    return '';
  }

  // ---------------------------------------------------------------------
  // 1. Medications Tab
  // ---------------------------------------------------------------------
  renderMedicationsTab(meds = []) {
    const isTe = currentLanguage === 'te';
    return `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-slate-800">Active Prescriptions</h2>
          <button onclick="window.caregiverView.openAddMedModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm shadow transition flex items-center gap-2">
            <span>+</span> <span>${t('addMed')}</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${meds.map(m => {
            const name = isTe ? (m.name_te || m.name) : m.name;
            const dosage = isTe ? (m.dosage_te || m.dosage) : m.dosage;
            const instructions = isTe ? (m.instructions_te || m.instructions) : m.instructions;
            const isLowStock = m.remaining_quantity <= m.refill_threshold;

            return `
              <div class="bg-white border ${isLowStock ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'} rounded-2xl p-5 shadow-sm space-y-3">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <span class="w-5 h-5 rounded-full shadow-inner" style="background-color: ${m.pill_color || '#3B82F6'};"></span>
                    <div>
                      <h3 class="text-lg font-black text-slate-900">${name}</h3>
                      <p class="text-sm font-bold text-blue-700">${dosage}</p>
                    </div>
                  </div>
                  <span class="text-xs font-black uppercase px-2.5 py-1 rounded-full ${isLowStock ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}">
                    ${m.frequency}
                  </span>
                </div>

                <div class="text-xs text-slate-600 space-y-1">
                  <p><strong>Times:</strong> ${m.timeSlots.join(', ')} • <strong>Meal:</strong> ${m.meal_timing}</p>
                  ${instructions ? `<p><strong>Instructions:</strong> ${instructions}</p>` : ''}
                  <p><strong>Doctor:</strong> ${m.doctor_name || 'Primary Care'}</p>
                </div>

                <div class="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span class="font-extrabold ${isLowStock ? 'text-rose-600 animate-pulse' : 'text-slate-600'}">
                    📦 ${m.remaining_quantity} pills remaining ${isLowStock ? '(⚠️ Refill Needed!)' : ''}
                  </span>
                  <button onclick="window.caregiverView.deleteMed('${m.id}')" class="text-rose-600 hover:text-rose-800 font-bold">
                    Delete
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------
  // 2. Appointments Tab
  // ---------------------------------------------------------------------
  renderAppointmentsTab(appointments = []) {
    return `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-slate-800">Scheduled Doctor Appointments</h2>
          <button onclick="window.caregiverView.openAddApptModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm shadow transition flex items-center gap-2">
            <span>+</span> <span>${t('addAppointment')}</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${appointments.map(a => `
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="text-lg font-black text-slate-900">${a.doctor_name}</h3>
                  <p class="text-sm font-bold text-blue-700">${a.specialty}</p>
                </div>
                <span class="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                  📅 ${a.appointment_date} @ ${a.appointment_time}
                </span>
              </div>
              <p class="text-xs text-slate-600">
                📍 <strong>Clinic:</strong> ${a.clinic_address || 'Apollo / Care Clinic'}
              </p>
              ${a.checklist_notes ? `
                <div class="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-900">
                  <strong>📋 Pre-Visit Checklist:</strong> ${a.checklist_notes}
                </div>
              ` : ''}
              <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <a href="tel:${a.phone || ''}" class="text-blue-600 hover:underline font-bold">
                  📞 Call Clinic (${a.phone || '+91 40 2360 7777'})
                </a>
                <button onclick="window.caregiverView.deleteAppt('${a.id}')" class="text-rose-600 hover:text-rose-800 font-bold">
                  Cancel
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------
  // 3. Vitals & Mood Tab
  // ---------------------------------------------------------------------
  renderVitalsTab(vitals = []) {
    return `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-slate-800">Healthcare Vitals Log</h2>
          <button onclick="window.caregiverView.openLogVitalsModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm shadow transition flex items-center gap-2">
            <span>+</span> <span>${t('logVitals')}</span>
          </button>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600 uppercase text-xs font-bold border-b">
              <tr>
                <th class="p-3.5">Type</th>
                <th class="p-3.5">Reading</th>
                <th class="p-3.5">Mood</th>
                <th class="p-3.5">Recorded At</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${vitals.slice(0, 10).map(v => {
                let reading = `${v.value_primary} ${v.unit || ''}`;
                if (v.value_secondary) reading = `${v.value_primary}/${v.value_secondary} ${v.unit || ''}`;

                let moodEmoji = '😊 Good';
                if (v.mood_tag === 'GREAT') moodEmoji = '🌟 Great';
                if (v.mood_tag === 'TIRED') moodEmoji = '🥱 Tired';
                if (v.mood_tag === 'UNWELL') moodEmoji = '🤒 Unwell';

                return `
                  <tr>
                    <td class="p-3.5 font-bold text-slate-800">${v.type.replace('_', ' ')}</td>
                    <td class="p-3.5 font-black text-blue-700">${reading}</td>
                    <td class="p-3.5 font-medium">${moodEmoji}</td>
                    <td class="p-3.5 text-xs text-slate-500">${new Date(v.recorded_at).toLocaleString()}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------
  // 4. Notifications & Alerts Feed
  // ---------------------------------------------------------------------
  renderNotificationsTab(notifications = []) {
    return `
      <div class="space-y-6">
        <h2 class="text-xl font-bold text-slate-800">Automated Notification Audit Feed</h2>
        <div class="space-y-3">
          ${notifications.map(n => `
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-4">
              <span class="text-2xl">${n.type === 'SOS_EMERGENCY' ? '🚨' : (n.type === 'MISSED_DOSE' ? '⚠️' : '🔔')}</span>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-slate-900">${n.subject}</h4>
                  <span class="text-xs text-slate-500">${new Date(n.sent_at).toLocaleTimeString()}</span>
                </div>
                <p class="text-xs text-slate-600 mt-1">Recipient: <strong>${n.recipient_email}</strong> | Status: <span class="text-emerald-700 font-bold">${n.status}</span></p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  async triggerSchedulerCheck() {
    try {
      const res = await fetch('/api/scheduler/check-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cloudscheduler': 'true' }
      });
      const data = await res.json();
      alert(`Cloud Scheduler Completed!\nEvaluated: ${data.evaluatedDate}\nMissed Doses Marked: ${data.missedDosesMarked}\nAlerts Sent: ${data.alertsDispatched.length}\nAppointment Reminders: ${data.appointmentRemindersSent}`);
      if (window.appCoordinator) window.appCoordinator.refreshData();
    } catch (e) {
      alert('Error triggering scheduler: ' + e.message);
    }
  }

  // Modals & Action Handlers
  openAddMedModal() {
    const modal = document.getElementById('add-med-modal');
    if (modal) modal.classList.remove('hidden');
  }

  openAddApptModal() {
    const modal = document.getElementById('add-appt-modal');
    if (modal) modal.classList.remove('hidden');
  }

  openLogVitalsModal() {
    const modal = document.getElementById('log-vitals-modal');
    if (modal) modal.classList.remove('hidden');
  }

  async deleteMed(id) {
    if (confirm('Are you sure you want to discontinue this medication?')) {
      await fetch(`/api/medications/${id}`, { method: 'DELETE' });
      if (window.appCoordinator) window.appCoordinator.refreshData();
    }
  }

  async deleteAppt(id) {
    if (confirm('Cancel this doctor appointment?')) {
      await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (window.appCoordinator) window.appCoordinator.refreshData();
    }
  }
}

window.caregiverView = new CaregiverView();
