
// Senior Accessibility View: Large Touch Targets, High Contrast, Audio Guidance
class SeniorView {
  constructor() {
    this.doses = [];
  }

  render(container, doses, profile) {
    this.doses = doses || [];

    const lang = (typeof currentLanguage !== 'undefined' ? currentLanguage : 'en');
    const pendingDoses = this.doses.filter(
      d => d.status === 'PENDING' || d.status === 'SNOOZED'
    );
    const completedDoses = this.doses.filter(d => d.status === 'TAKEN');

    const localeMap = { te: 'te-IN', hi: 'hi-IN', en: 'en-US' };
    const activeLocale = localeMap[lang] || 'en-US';

    let patientGreetingName = 'Lakshmi';
    if (lang === 'te') patientGreetingName = 'లక్ష్మీ దేవి';
    else if (lang === 'hi') patientGreetingName = 'लक्ष्मी देवी';
    else if (profile && profile.name) {
      patientGreetingName = profile.name.split(' ')[0];
    }

    let html = `
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span class="inline-block px-3 py-1 bg-blue-500/30 border border-blue-400/40 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              ${t('seniorMode')}
            </span>
            <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
              ${t('greeting')}, ${patientGreetingName}!
            </h1>
            <p class="text-blue-100 text-lg mt-1">
              ${pendingDoses.length > 0 ? `${pendingDoses.length} ${t('todayMeds')}` : t('allMedsTaken')}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button onclick="window.seniorView.readAloud()" class="bg-white/10 hover:bg-white/20 active:scale-95 border-2 border-white/30 text-white px-5 py-3 rounded-2xl font-bold text-lg flex items-center gap-3 shadow transition">
              <span class="text-2xl">🔊</span>
              <span>${t('listenVoice')}</span>
            </button>
            <button id="voice-cmd-btn" onclick="window.voiceAssistant.toggleListening()" class="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white p-3.5 rounded-2xl border-2 border-blue-400 shadow transition flex items-center justify-center text-2xl" title="Speak Voice Command">
              🎙️
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span>⏰</span>
              <span>${t('todayMeds')}</span>
            </h2>
            <span class="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              ${new Date().toLocaleDateString(activeLocale, { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          ${pendingDoses.length === 0 ? `
            <div class="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-8 text-center text-emerald-900 shadow-sm">
              <div class="text-6xl mb-3">🌟</div>
              <h3 class="text-2xl font-black">${t('allMedsTaken')}</h3>
              <p class="text-lg text-emerald-800 mt-2">Next scheduled doses will appear tomorrow morning.</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 gap-5">
              ${pendingDoses.map(dose => this.renderDoseCard(dose, lang)).join('')}
            </div>
          `}
        </div>

        ${completedDoses.length > 0 ? `
          <div class="pt-4 border-t border-slate-200">
            <h3 class="text-xl font-bold text-slate-600 mb-3 flex items-center gap-2">
              <span>✅</span>
              <span>Completed Today (${completedDoses.length})</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${completedDoses.map(dose => {
                let name = dose.medication_name;
                if (lang === 'te') name = dose.medication_name_te || dose.medication_name;
                else if (lang === 'hi') name = dose.medication_name_hi || dose.medication_name;

                return `
                  <div class="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-between opacity-80">
                    <div class="flex items-center gap-3">
                      <span class="w-4 h-4 rounded-full" style="background-color: ${dose.pill_color || '#3B82F6'};"></span>
                      <div>
                        <p class="font-bold text-slate-800">${name}</p>
                        <p class="text-xs text-slate-500">${dose.dosage} • ${dose.scheduled_time}</p>
                      </div>
                    </div>
                    <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                      Taken
                    </span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;
  }

  renderDoseCard(dose, lang) {
    let medName = dose.medication_name;
    let dosage = dose.dosage;
    let instructions = dose.instructions;

    if (lang === 'te') {
      medName = dose.medication_name_te || dose.medication_name;
      dosage = dose.dosage_te || dose.dosage;
      instructions = dose.instructions_te || dose.instructions;
    } else if (lang === 'hi') {
      medName = dose.medication_name_hi || dose.medication_name;
      dosage = dose.dosage_hi || dose.dosage;
      instructions = dose.instructions_hi || dose.instructions;
    }

    let mealBadge = '';
    if (dose.meal_timing === 'AFTER_MEAL') mealBadge = t('mealAfter');
    else if (dose.meal_timing === 'BEFORE_MEAL') mealBadge = t('mealBefore');
    else if (dose.meal_timing === 'WITH_MEAL') mealBadge = t('mealWith');

    const isSnoozed = dose.status === 'SNOOZED';

    return `
      <div class="bg-white border-3 ${isSnoozed ? 'border-amber-400 bg-amber-50/20' : 'border-blue-200'} rounded-3xl p-6 sm:p-7 shadow-lg transition-all hover:shadow-xl relative overflow-hidden">
        ${isSnoozed ? `
          <div class="bg-amber-500 text-white text-xs font-black px-4 py-1 rounded-bl-xl absolute top-0 right-0 tracking-wider uppercase">
            Snoozed
          </div>
        ` : ''}

        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex-shrink-0 flex items-center justify-center border-2 border-slate-200 shadow-sm" style="background-color: ${dose.pill_color || '#3B82F6'}15;">
              <span class="text-3xl sm:text-4xl" role="img" aria-label="pill">💊</span>
            </div>

            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="bg-blue-100 text-blue-900 font-extrabold text-sm px-3 py-1 rounded-xl">
                  ⏰ ${dose.scheduled_time}
                </span>
                ${mealBadge ? `
                  <span class="bg-purple-100 text-purple-900 font-bold text-xs px-2.5 py-1 rounded-xl">
                    🍽️ ${mealBadge}
                  </span>
                ` : ''}
              </div>

              <h3 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ${medName}
              </h3>
              <p class="text-lg font-bold text-blue-700 mt-0.5">
                ${dosage}
              </p>
              ${instructions ? `
                <p class="text-slate-600 text-base font-medium mt-1">
                  ℹ️ ${instructions}
                </p>
              ` : ''}
            </div>
          </div>

          <div class="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
            <button onclick="window.seniorView.takeDose('${dose.log_id}', '${medName}')" class="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xl sm:text-2xl py-4 sm:py-5 px-8 rounded-2xl shadow-lg border-2 border-emerald-500 transition flex items-center justify-center gap-3">
              <span>✅</span>
              <span>${t('markTaken')}</span>
            </button>

            <button onclick="window.seniorView.snoozeDose('${dose.log_id}')" class="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-base py-4 sm:py-5 px-4 rounded-2xl border-2 border-amber-300 transition" title="Remind me again in 15 minutes">
              ⏳ ${t('snooze15')}
            </button>

            <button onclick="window.seniorView.speakDose('${dose.log_id}')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-4 sm:p-5 rounded-2xl border-2 border-slate-300 transition" title="Speak instructions">
              🔊
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async takeDose(logId, medName) {
    if (window.voiceAssistant) {
      window.voiceAssistant.playConfirmationChime();
    }

    try {
      const res = await fetch('/api/adherence/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, action: 'TAKE' })
      });

      if (!res.ok) throw new Error('Failed to record dose');

      this.showSuccessCelebration(medName);

      if (window.appCoordinator) {
        window.appCoordinator.refreshData();
      }
    } catch (err) {
      if (window.offlineManager) {
        window.offlineManager.queueAction({ logId, action: 'TAKE' });
        this.showSuccessCelebration(medName + ' (Saved Offline)');
      }
    }
  }

  async snoozeDose(logId) {
    try {
      await fetch('/api/adherence/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, action: 'SNOOZE', options: { minutes: 15 } })
      });
      if (window.appCoordinator) window.appCoordinator.refreshData();
    } catch (e) {
      console.warn('Snooze error:', e);
    }
  }

  showSuccessCelebration(medName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div class="text-7xl mb-4 animate-bounce">🎉</div>
        <h2 class="text-3xl font-black text-emerald-800 mb-2">Dose Recorded!</h2>
        <p class="text-xl font-bold text-slate-700 mb-6">${medName}</p>
        <p class="text-emerald-700 bg-emerald-50 p-4 rounded-2xl font-bold mb-6">
          Your adherence streak and caregiver dashboard have been updated.
        </p>
        <button onclick="this.closest('.fixed').remove()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xl py-4 rounded-2xl shadow-lg transition">
          Continue (ధన్యవాదాలు / धन्यवाद)
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
      if (modal.parentNode) modal.remove();
    }, 3500);
  }

  speakDose(doseId) {
    const dose = this.doses.find(d => d.log_id === doseId);

    if (dose && window.voiceAssistant) {
      const lang = (typeof currentLanguage !== 'undefined' ? currentLanguage : 'en');
      const patient = window.appCoordinator ? window.appCoordinator.currentPatient : null;

      console.log("SPEAK SINGLE DOSE:", JSON.stringify(dose, null, 2));

      window.voiceAssistant.readScheduleAloud(
        [dose],
        patient ? patient.name : '',
        lang
      );
    }
  }

  // Updated voice debugging: logs the exact medication data being sent to TTS.
  readAloud() {
    const lang = (typeof currentLanguage !== 'undefined' ? currentLanguage : 'en');
    const patient = window.appCoordinator ? window.appCoordinator.currentPatient : null;
    const patientName = patient ? patient.name : '';

    console.log("VOICE LANGUAGE:", lang);
    console.log("VOICE DOSES:", JSON.stringify(this.doses, null, 2));

    if (window.voiceAssistant) {
      window.voiceAssistant.readScheduleAloud(
        this.doses,
        patientName,
        lang
      );
    } else {
      console.error("Voice assistant is not available.");
    }
  }

  takeNextDose() {
    const pending = this.doses.find(
      d => d.status === 'PENDING' || d.status === 'SNOOZED'
    );

    if (pending) {
      const lang = (typeof currentLanguage !== 'undefined' ? currentLanguage : 'en');
      let medName = pending.medication_name;

      if (lang === 'te') medName = pending.medication_name_te || pending.medication_name;
      else if (lang === 'hi') medName = pending.medication_name_hi || pending.medication_name;

      this.takeDose(pending.log_id, medName);
    }
  }
}

window.seniorView = new SeniorView();
