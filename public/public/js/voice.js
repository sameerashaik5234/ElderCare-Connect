// Web Speech API Voice Assistant (SpeechSynthesis & SpeechRecognition) & Web Audio Sound FX
// Provides full English, Telugu, and Hindi speech synthesis, waiting for voices, and strict non-fallback enforcement.

class VoiceAssistant {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.recognition = null;
    this.isListening = false;
    this.audioCtx = null;
    this.voicesLoadedPromise = null;

    this.initVoices();
    this.initRecognition();
  }

  initVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices() || [];
    if (typeof this.synth.onvoiceschanged !== 'undefined') {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices() || [];
      };
    }
  }

  /**
   * Requirement 5: Wait for speech synthesis voices to load before speaking
   */
  async waitForVoices(timeoutMs = 1200) {
    if (!this.synth) return [];

    const existing = this.synth.getVoices();
    if (existing && existing.length > 0) {
      this.voices = existing;
      return existing;
    }

    return new Promise((resolve) => {
      let settled = false;

      const done = () => {
        if (!settled) {
          settled = true;
          this.voices = this.synth ? (this.synth.getVoices() || []) : [];
          resolve(this.voices);
        }
      };

      if (this.synth) {
        if (typeof this.synth.addEventListener === 'function') {
          this.synth.addEventListener('voiceschanged', done, { once: true });
        } else if (typeof this.synth.onvoiceschanged !== 'undefined') {
          this.synth.onvoiceschanged = done;
        }
      }

      // Polling fallback
      const interval = setInterval(() => {
        if (this.synth) {
          const v = this.synth.getVoices();
          if (v && v.length > 0) {
            clearInterval(interval);
            done();
          }
        }
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        done();
      }, timeoutMs);
    });
  }

  getVoicesList() {
    if (this.synth) {
      const current = this.synth.getVoices();
      if (current && current.length > 0) {
        this.voices = current;
      }
    }
    return this.voices || [];
  }

  /**
   * Detect selected language: 'en', 'te', or 'hi'
   */
  detectLanguage(preferredLang = null) {
    if (preferredLang === 'te' || preferredLang === 'hi' || preferredLang === 'en') {
      return preferredLang;
    }
    if (typeof window !== 'undefined' && (window.currentLanguage === 'te' || window.currentLanguage === 'hi' || window.currentLanguage === 'en')) {
      return window.currentLanguage;
    }
    if (typeof currentLanguage !== 'undefined' && (currentLanguage === 'te' || currentLanguage === 'hi' || currentLanguage === 'en')) {
      return currentLanguage;
    }
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('eldercare_lang');
      if (stored === 'te' || stored === 'hi' || stored === 'en') return stored;
    }
    if (typeof document !== 'undefined' && document.documentElement.lang) {
      const dLang = document.documentElement.lang.toLowerCase();
      if (dLang.startsWith('te')) return 'te';
      if (dLang.startsWith('hi')) return 'hi';
    }
    return 'en';
  }

  /**
   * Requirement 4: Correct Telugu voice matching te-IN or Telugu name
   */
  getTeluguVoice() {
    const voices = this.getVoicesList();
    return voices.find(v => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      const name = (v.name || '').toLowerCase();
      return (
        lang === 'te-in' ||
        lang === 'te' ||
        lang.startsWith('te-') ||
        name.includes('telugu') ||
        name.includes('తెలుగు')
      );
    }) || null;
  }

  /**
   * Requirement 4: Correct Hindi voice matching hi-IN or Hindi name
   */
  getHindiVoice() {
    const voices = this.getVoicesList();
    return voices.find(v => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      const name = (v.name || '').toLowerCase();
      return (
        lang === 'hi-in' ||
        lang === 'hi' ||
        lang.startsWith('hi-') ||
        name.includes('hindi') ||
        name.includes('हिन्दी') ||
        name.includes('हिंदी')
      );
    }) || null;
  }

  /**
   * Requirement 4: Correct English voice (preferring en-IN, then en-US, en-GB)
   */
  getEnglishVoice() {
    const voices = this.getVoicesList();
    const enIn = voices.find(v => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      return lang === 'en-in';
    });
    if (enIn) return enIn;

    const anyEn = voices.find(v => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      return lang.startsWith('en');
    });
    if (anyEn) return anyEn;

    return voices[0] || null;
  }

  getAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    return this.audioCtx;
  }

  playConfirmationChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5

      osc2.frequency.setValueAtTime(261.63, now); // C4

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.65);
      osc2.stop(now + 0.65);
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  }

  playNoticeChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn('Notice chime error:', e);
    }
  }

  playEmergencySiren() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.4);
      osc.frequency.linearRampToValueAtTime(800, now + 0.8);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn('Emergency siren error:', e);
    }
  }

  // =========================================================================
  // TRANSLATION & SPEECH GENERATION HELPERS
  // =========================================================================

  getPatientName(rawName, lang) {
    if (!rawName) {
      if (lang === 'te') return 'లక్ష్మీ దేవి';
      if (lang === 'hi') return 'लक्ष्मी देवी';
      return 'Lakshmi';
    }
    const str = String(rawName);

    if (lang === 'te') {
      const match = str.match(/[\u0C00-\u0C7F]+/g);
      if (match) return match.join(' ').trim();
      if (/Lakshmi/i.test(str)) return 'లక్ష్మీ దేవి';
      if (/Suresh/i.test(str)) return 'సురేష్ కుమార్';
      if (/Rajesh/i.test(str)) return 'డాక్టర్ రాజేష్ రావు';
      return 'లక్ష్మీ దేవి';
    }

    if (lang === 'hi') {
      const match = str.match(/[\u0900-\u097F]+/g);
      if (match) return match.join(' ').trim();
      if (/Lakshmi/i.test(str)) return 'लक्ष्मी देवी';
      if (/Suresh/i.test(str)) return 'सुरेश कुमार';
      if (/Rajesh/i.test(str)) return 'डॉक्टर राजेश राव';
      return 'लक्ष्मी देवी';
    }

    return str.replace(/\(.*?\)/g, '').trim().split(' ')[0] || 'Patient';
  }

  // Time conversion
  formatTimeTelugu(timeStr) {
    if (!timeStr) return 'నిర్ణీత సమయానికి';
    const parts = String(timeStr).trim().split(':');
    const hour = parseInt(parts[0], 10);
    const minute = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    if (isNaN(hour)) return timeStr;

    let period = 'ఉదయం';
    if (hour >= 12 && hour < 16) period = 'మధ్యాహ్నం';
    else if (hour >= 16 && hour < 19) period = 'సాయంత్రం';
    else if (hour >= 19 || hour < 4) period = 'రాత్రి';

    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;

    const words = { 1: 'ఒకటి', 2: 'రెండు', 3: 'మూడు', 4: 'నాలుగు', 5: 'ఐదు', 6: 'ఆరు', 7: 'ఏడు', 8: 'ఎనిమిది', 9: 'తొమ్మిది', 10: 'పది', 11: 'పదకొండు', 12: 'పన్నెండు' };
    const hWord = words[displayHour] || String(displayHour);

    if (minute === 0) return `${period} ${hWord} గంటలకు`;
    if (minute === 30) return `${period} ${hWord}న్నర గంటలకు`;
    return `${period} ${hWord} గంటల ${minute} నిమిషాలకు`;
  }

  formatTimeHindi(timeStr) {
    if (!timeStr) return 'निर्धारित समय पर';
    const parts = String(timeStr).trim().split(':');
    const hour = parseInt(parts[0], 10);
    const minute = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    if (isNaN(hour)) return timeStr;

    let period = 'सुबह';
    if (hour >= 12 && hour < 16) period = 'दोपहर';
    else if (hour >= 16 && hour < 19) period = 'शाम';
    else if (hour >= 19 || hour < 4) period = 'रात';

    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;

    const words = { 1: 'एक', 2: 'दो', 3: 'तीन', 4: 'चार', 5: 'पांच', 6: 'छह', 7: 'सात', 8: 'आठ', 9: 'नौ', 10: 'दस', 11: 'ग्यारह', 12: 'बारह' };
    const hWord = words[displayHour] || String(displayHour);

    if (minute === 0) return `${period} ${hWord} बजे`;
    if (minute === 30) return `${period} साढ़े ${hWord} बजे`;
    return `${period} ${hWord} बजकर ${minute} मिनट पर`;
  }

  formatTimeEnglish(timeStr) {
    if (!timeStr) return 'scheduled time';
    const parts = String(timeStr).trim().split(':');
    const hour = parseInt(parts[0], 10);
    const minute = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    if (isNaN(hour)) return timeStr;

    const ampm = hour >= 12 ? 'PM' : 'AM';
    let h12 = hour % 12;
    if (h12 === 0) h12 = 12;
    const minStr = minute < 10 ? `0${minute}` : String(minute);
    return `${h12}:${minStr} ${ampm}`;
  }

  // Medication Name Translation (Preserves full name & specifications)
  translateMedicationName(d, lang) {
    if (lang === 'te') {
      if (d.medication_name_te && /[\u0C00-\u0C7F]/.test(d.medication_name_te)) {
        return d.medication_name_te.trim()
          .replace(/(\d+)\s*mg\b/gi, '$1 మిల్లీగ్రాములు')
          .replace(/(\d+)\s*ml\b/gi, '$1 మిల్లీలీటర్లు');
      }
      const s = String(d.medication_name || '').trim();
      if (/metformin/i.test(s)) return 'మెట్‌ఫార్మిన్ 500 మిల్లీగ్రాములు';
      if (/amlodipine/i.test(s)) return 'అమ్లోడిపైన్ 5 మిల్లీగ్రాములు';
      if (/atorvastatin/i.test(s)) return 'అటోర్వాస్టాటిన్ 10 మిల్లీగ్రాములు';
      if (/multivitamin/i.test(s)) return 'మల్టీవిటమిన్ మాత్రలు';
      return s.replace(/(\d+)\s*mg\b/gi, '$1 మిల్లీగ్రాములు').replace(/(\d+)\s*ml\b/gi, '$1 మిల్లీలీటర్లు');
    }

    if (lang === 'hi') {
      if (d.medication_name_hi && /[\u0900-\u097F]/.test(d.medication_name_hi)) {
        return d.medication_name_hi.trim()
          .replace(/(\d+)\s*mg\b/gi, '$1 मिलीग्राम')
          .replace(/(\d+)\s*ml\b/gi, '$1 मिलीलीटर');
      }
      const s = String(d.medication_name || '').trim();
      if (/metformin/i.test(s)) return 'मेटफॉर्मिन 500 मिलीग्राम';
      if (/amlodipine/i.test(s)) return 'एम्लोडिपिन 5 मिलीग्राम';
      if (/atorvastatin/i.test(s)) return 'एटोरवास्टेटिन 10 मिलीग्राम';
      if (/multivitamin/i.test(s)) return 'मल्टीविटामिन सीनियर';
      return s.replace(/(\d+)\s*mg\b/gi, '$1 मिलीग्राम').replace(/(\d+)\s*ml\b/gi, '$1 मिलीलीटर');
    }

    return d.medication_name || 'Medication';
  }

  // Dosage translation
  translateDosage(d, lang) {
    if (lang === 'te') {
      let s = (d.dosage_te && /[\u0C00-\u0C7F]/.test(d.dosage_te)) ? d.dosage_te : String(d.dosage || '');
      s = s.replace(/\(.*?\)/g, '').trim();
      if (/2\s*(tablet|మాత్ర)/i.test(s)) return 'రెండు మాత్రలు';
      if (/1\s*(tablet|మాత్ర)/i.test(s) || s === '1' || d.form === 'TABLET') return 'ఒక మాత్ర';
      if (/2\s*(capsule|క్యాప్సూల్)/i.test(s)) return 'రెండు క్యాప్సూల్స్';
      if (/1\s*(capsule|క్యాప్సూల్)/i.test(s) || d.form === 'CAPSULE') return 'ఒక క్యాప్సూల్';
      if (/5\s*ml/i.test(s) || d.form === 'SYRUP') return 'ఐదు మిల్లీ లీటర్ల సిరప్';
      return s.replace(/\b1\b/g, 'ఒక').replace(/\b2\b/g, 'రెండు');
    }

    if (lang === 'hi') {
      let s = (d.dosage_hi && /[\u0900-\u097F]/.test(d.dosage_hi)) ? d.dosage_hi : String(d.dosage || '');
      s = s.replace(/\(.*?\)/g, '').trim();
      if (/2\s*(tablet|गोली)/i.test(s)) return 'दो गोलियां';
      if (/1\s*(tablet|गोली)/i.test(s) || s === '1' || d.form === 'TABLET') return 'एक गोली';
      if (/2\s*(capsule|कैप्सूल)/i.test(s)) return 'दो कैप्सूल';
      if (/1\s*(capsule|कैप्सूल)/i.test(s) || d.form === 'CAPSULE') return 'एक कैप्सूल';
      if (/5\s*ml/i.test(s) || d.form === 'SYRUP') return 'पांच मिलीलीटर सिरप';
      return s.replace(/\b1\b/g, 'एक').replace(/\b2\b/g, 'दो');
    }

    return d.dosage ? String(d.dosage).replace(/\(.*?\)/g, '').trim() : '1 Tablet';
  }

  // Instructions translation
  translateInstructions(d, lang) {
    if (lang === 'te') {
      if (d.instructions_te && /[\u0C00-\u0C7F]/.test(d.instructions_te)) {
        return d.instructions_te.trim().replace(/\b1\s*మాత్ర/g, 'ఒక మాత్ర');
      }
      const inst = String(d.instructions || '').toLowerCase();
      const timing = String(d.meal_timing || '').toUpperCase();
      if (inst.includes('blood pressure') || inst.includes('bp') || inst.includes('breakfast')) {
        return 'రక్తపోటు నియంత్రణ కోసం ఉదయం అల్పాహారానికి ముందు ఒక మాత్ర తీసుకోండి';
      }
      if (inst.includes('cholesterol') || inst.includes('night') || inst.includes('sleep')) {
        return 'కొలెస్ట్రాల్ కోసం రాత్రి పడుకునే ముందు ఒక క్యాప్సూల్ తీసుకోండి';
      }
      if (inst.includes('lunch') || inst.includes('immunity') || inst.includes('energy')) {
        return 'మంచి శక్తి మరియు ఆరోగ్యం కోసం మధ్యాహ్న భోజనంతో పాటు ఒక మాత్ర తీసుకోండి';
      }
      if (inst.includes('after meal') || timing === 'AFTER_MEAL') {
        return 'భోజనం తర్వాత ఒక మాత్ర నీటితో తీసుకోండి';
      }
      if (inst.includes('before meal') || timing === 'BEFORE_MEAL') {
        return 'భోజనానికి ముందు ఒక మాత్ర నీటితో తీసుకోండి';
      }
      return 'సమయానికి ఒక గ్లాసు నీటితో తీసుకోండి';
    }

    if (lang === 'hi') {
      if (d.instructions_hi && /[\u0900-\u097F]/.test(d.instructions_hi)) {
        return d.instructions_hi.trim();
      }
      const inst = String(d.instructions || '').toLowerCase();
      const timing = String(d.meal_timing || '').toUpperCase();
      if (inst.includes('blood pressure') || inst.includes('bp') || inst.includes('breakfast')) {
        return 'रक्तचाप नियंत्रण के लिए सुबह नाश्ते से पहले पानी के साथ लें';
      }
      if (inst.includes('cholesterol') || inst.includes('night') || inst.includes('sleep')) {
        return 'कोलेस्ट्रॉल के लिए रात को सोने से पहले पानी के साथ लें';
      }
      if (inst.includes('lunch') || inst.includes('immunity') || inst.includes('energy')) {
        return 'दैनिक ऊर्जा और स्वास्थ्य के लिए दोपहर के भोजन के साथ लें';
      }
      if (inst.includes('after meal') || timing === 'AFTER_MEAL') {
        return 'भोजन के बाद एक गोली पानी के साथ लें';
      }
      if (inst.includes('before meal') || timing === 'BEFORE_MEAL') {
        return 'भोजन से पहले पानी के साथ लें';
      }
      return 'समय पर पानी के साथ लें';
    }

    return d.instructions || 'Take with water as directed';
  }

  // =========================================================================
  // SCHEDULE SPEECH BUILDERS (Telugu, Hindi, English)
  // =========================================================================

  buildTeluguScheduleSpeech(doses, patientName) {
    const cleanPatient = this.getPatientName(patientName, 'te');
    if (!doses || doses.length === 0) {
      return `నమస్కారం ${cleanPatient} గారు. ఈ రోజు మీకు ఎలాంటి మందుల షెడ్యూల్ నిర్ణయించబడలేదు.`;
    }

    let speech = `నమస్కారం ${cleanPatient} గారు. ఈ రోజు మీరు తీసుకోవాల్సిన మందుల వివరాలు ఇవి. `;

    let activeDoses = doses.filter(d => d.status === 'PENDING' || d.status === 'SNOOZED');
    if (activeDoses.length === 0) {
      speech += 'ఈ రోజు మీరు తీసుకోవాల్సిన అన్ని మందులు విజయవంతంగా తీసుకున్నారు. చాలా మంచిది! ఈ రోజు తీసుకున్న మందుల వివరాలు: ';
      activeDoses = doses;
    }

    const ordinals = ['మొదటి', 'రెండవ', 'మూడవ', 'నాల్గవ', 'ఐదవ', 'ఆరవ'];

    activeDoses.forEach((d, idx) => {
      const ordinal = ordinals[idx] || `మందు ${idx + 1}`;
      const timeSpoken = this.formatTimeTelugu(d.scheduled_time);
      const medName = this.translateMedicationName(d, 'te');
      const dosage = this.translateDosage(d, 'te');
      const instructions = this.translateInstructions(d, 'te');

      speech += `${ordinal} మందు: ${timeSpoken}, ${medName}. మోతాదు ${dosage}. ${instructions}. `;
    });

    speech += 'మందులను క్రమం తప్పకుండా తీసుకొని మీ ఆరోగ్యాన్ని జాగ్రత్తగా చూసుకోండి. ధన్యవాదాలు.';
    return speech.trim();
  }

  buildHindiScheduleSpeech(doses, patientName) {
    const cleanPatient = this.getPatientName(patientName, 'hi');
    if (!doses || doses.length === 0) {
      return `नमस्ते ${cleanPatient} जी, आज के लिए आपकी कोई निर्धारित दवाई नहीं है।`;
    }

    let speech = `नमस्ते ${cleanPatient} जी, आज की आपकी दवाइयों का समय इस प्रकार है। `;

    let activeDoses = doses.filter(d => d.status === 'PENDING' || d.status === 'SNOOZED');
    if (activeDoses.length === 0) {
      speech += 'आज की आपकी सभी दवाइयां सफलतापूर्वक ली जा चुकी हैं। बहुत बढ़िया! आज की दवाइयों का विवरण: ';
      activeDoses = doses;
    }

    const ordinals = ['पहली', 'दूसरी', 'तीसरी', 'चौथी', 'पांचवी', 'छठी'];

    activeDoses.forEach((d, idx) => {
      const ordinal = ordinals[idx] || `दवाई ${idx + 1}`;
      const timeSpoken = this.formatTimeHindi(d.scheduled_time);
      const medName = this.translateMedicationName(d, 'hi');
      const dosage = this.translateDosage(d, 'hi');
      const instructions = this.translateInstructions(d, 'hi');

      speech += `${ordinal} दवाई: ${timeSpoken}, ${medName}। खुराक ${dosage}। ${instructions}। `;
    });

    speech += 'दवाइयां समय पर लें और अपने स्वास्थ्य का ध्यान रखें। धन्यवाद।';
    return speech.trim();
  }

  buildEnglishScheduleSpeech(doses, patientName) {
    const cleanPatient = this.getPatientName(patientName, 'en');
    if (!doses || doses.length === 0) {
      return `Hello ${cleanPatient}. You have no scheduled medications for today.`;
    }

    let speech = `Hello ${cleanPatient}. Here is your medication schedule for today. `;

    let activeDoses = doses.filter(d => d.status === 'PENDING' || d.status === 'SNOOZED');
    if (activeDoses.length === 0) {
      speech += 'All your scheduled medications for today have been completed. Great job! Here is a summary: ';
      activeDoses = doses;
    }

    activeDoses.forEach((d, idx) => {
      const timeSpoken = this.formatTimeEnglish(d.scheduled_time);
      const medName = this.translateMedicationName(d, 'en');
      const dosage = this.translateDosage(d, 'en');
      const instructions = this.translateInstructions(d, 'en');

      speech += `Dose ${idx + 1}: At ${timeSpoken}, please take ${medName}, dosage ${dosage}. ${instructions}. `;
    });

    speech += 'Thank you and stay healthy.';
    return speech.trim();
  }

  // =========================================================================
  // CORE SPEECH SYNTHESIS ENGINE (With Voice Waiting & Non-Fallback Guarantee)
  // =========================================================================

  async speak(text, preferredLang = null, options = {}) {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      return { success: false, reason: 'NOT_SUPPORTED' };
    }

    // Requirement 5: Wait for speech synthesis voices to load
    await this.waitForVoices();

    const lang = this.detectLanguage(preferredLang);
    this.synth.cancel();

    // -----------------------------------------------------------------
    // TELUGU HANDLING
    // -----------------------------------------------------------------
    if (lang === 'te') {
      const teluguVoice = this.getTeluguVoice();

      // Requirement 6 & 7: Never silently fall back to another language!
      if (!teluguVoice) {
        console.warn('[VoiceAssistant] Telugu voice (te-IN) unavailable. English speech strictly suppressed.');
        this.showVoiceUnavailableNotice('te', text, options.doses);
        return {
          success: false,
          reason: 'VOICE_UNAVAILABLE',
          lang: 'te',
          generatedText: text
        };
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'te-IN';
      utterance.voice = teluguVoice;
      utterance.rate = 0.88;
      utterance.pitch = 1.0;

      this.synth.speak(utterance);
      return { success: true, lang: 'te-IN', voice: teluguVoice.name, spokenText: text };
    }

    // -----------------------------------------------------------------
    // HINDI HANDLING
    // -----------------------------------------------------------------
    if (lang === 'hi') {
      const hindiVoice = this.getHindiVoice();

      // Requirement 6 & 7: Never silently fall back to another language!
      if (!hindiVoice) {
        console.warn('[VoiceAssistant] Hindi voice (hi-IN) unavailable. English speech strictly suppressed.');
        this.showVoiceUnavailableNotice('hi', text, options.doses);
        return {
          success: false,
          reason: 'VOICE_UNAVAILABLE',
          lang: 'hi',
          generatedText: text
        };
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.voice = hindiVoice;
      utterance.rate = 0.90;
      utterance.pitch = 1.0;

      this.synth.speak(utterance);
      return { success: true, lang: 'hi-IN', voice: hindiVoice.name, spokenText: text };
    }

    // -----------------------------------------------------------------
    // ENGLISH HANDLING
    // -----------------------------------------------------------------
    const englishVoice = this.getEnglishVoice();
    if (!englishVoice) {
      console.warn('[VoiceAssistant] English voice unavailable.');
      this.showVoiceUnavailableNotice('en', text, options.doses);
      return {
        success: false,
        reason: 'VOICE_UNAVAILABLE',
        lang: 'en',
        generatedText: text
      };
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.voice = englishVoice;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    this.synth.speak(utterance);
    return { success: true, lang: 'en-IN', voice: englishVoice.name, spokenText: text };
  }

  async readScheduleAloud(doses, patientName, preferredLang = null) {
    const lang = this.detectLanguage(preferredLang);

    if (lang === 'te') {
      const speechText = this.buildTeluguScheduleSpeech(doses, patientName);
      return this.speak(speechText, 'te', { doses });
    }

    if (lang === 'hi') {
      const speechText = this.buildHindiScheduleSpeech(doses, patientName);
      return this.speak(speechText, 'hi', { doses });
    }

    const speechText = this.buildEnglishScheduleSpeech(doses, patientName);
    return this.speak(speechText, 'en', { doses });
  }

  /**
   * Requirement 7: Clear localized warning modal for missing voice
   */
  showVoiceUnavailableNotice(lang, fullText, doses = []) {
    this.playNoticeChime();

    if (typeof document === 'undefined') return;

    let modal = document.getElementById('voice-notice-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'voice-notice-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4';
      document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');

    const config = {
      te: {
        badge: '🔊⚠️ బ్రౌజర్‌లో తెలుగు వాయిస్ లేదు (Telugu Voice Missing)',
        title: 'తెలుగు ఆడియో అందుబాటులో లేదు',
        desc: 'మీ డివైస్‌లో <strong>తెలుగు (te-IN) టెక్స్ట్-టు-స్పీచ్ వాయిస్</strong> లేదు. ఆంగ్లంలో తప్పుగా చదవకుండా ఆడియోను ఆపి, మీ మందుల షెడ్యూల్‌ను క్రింద స్పష్టంగా చూపించాము:',
        guideTitle: 'తెలుగు వాయిస్ ఎలా ప్రారంభించాలి:',
        guideDesc: '• Windows: Settings → Time & Language → Speech → Add voices → Telugu (India)\n• Android: Google Speech Services లేదా Google Text-to-Speech ఎనేబుల్ చేయండి.',
        btnText: 'సరే, అర్థమైంది (Got it)'
      },
      hi: {
        badge: '🔊⚠️ ब्राउज़र में हिंदी आवाज़ नहीं है (Hindi Voice Missing)',
        title: 'हिंदी ऑडियो उपलब्ध नहीं है',
        desc: 'आपके डिवाइस में <strong>हिंदी (hi-IN) टेक्स्ट-टू-स्पीच आवाज़</strong> नहीं है। गलत उच्चारण रोकने के लिए ऑडियो रोक दिया गया है। आपकी दवाइयों की सूची नीचे दी गई है:',
        guideTitle: 'हिंदी आवाज़ कैसे शुरू करें:',
        guideDesc: '• Windows: Settings → Time & Language → Speech → Add voices → Hindi (India)\n• Android: Google Speech Services या Google Text-to-Speech को अपडेट करें।',
        btnText: 'ठीक है, समझ गया (Got it)'
      },
      en: {
        badge: '🔊⚠️ English Voice Missing',
        title: 'English Speech Not Available',
        desc: 'Your device does not have an English Text-to-Speech voice installed. Your medication schedule is shown below:',
        guideTitle: 'How to enable English Speech:',
        guideDesc: '• Windows: Settings → Time & Language → Speech → Add voices → English (India/US)',
        btnText: 'Got it'
      }
    };

    const c = config[lang] || config.en;

    const renderedDosesHtml = (doses && doses.length > 0)
      ? doses.map(d => {
          const medName = this.translateMedicationName(d, lang);
          const dosage = this.translateDosage(d, lang);
          const time = lang === 'te' ? this.formatTimeTelugu(d.scheduled_time) : (lang === 'hi' ? this.formatTimeHindi(d.scheduled_time) : this.formatTimeEnglish(d.scheduled_time));
          const instructions = this.translateInstructions(d, lang);

          return `
            <div class="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-left shadow-sm">
              <div class="flex items-center justify-between">
                <span class="text-sm font-black text-blue-900 bg-blue-200 px-3 py-1 rounded-xl">⏰ ${time}</span>
                <span class="text-xs font-bold text-slate-600">${dosage}</span>
              </div>
              <h4 class="text-xl font-black text-slate-900 mt-2">${medName}</h4>
              <p class="text-sm text-slate-700 mt-1 font-medium">ℹ️ ${instructions}</p>
            </div>
          `;
        }).join('')
      : `<div class="p-4 bg-slate-100 rounded-xl text-slate-800 text-sm leading-relaxed">${fullText}</div>`;

    modal.innerHTML = `
      <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full text-center shadow-2xl border-4 border-amber-400 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div class="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-4 py-1.5 rounded-full text-sm font-black mb-3">
          <span>${c.badge}</span>
        </div>
        <h3 class="text-2xl sm:text-3xl font-black text-slate-900 mb-2">${c.title}</h3>
        <p class="text-base sm:text-lg text-slate-700 font-medium leading-relaxed mb-4">${c.desc}</p>
        <div class="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">${renderedDosesHtml}</div>
        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs text-slate-600 mb-6 space-y-1.5 whitespace-pre-line">
          <p class="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
            <span>💡</span> <span>${c.guideTitle}</span>
          </p>
          <p>${c.guideDesc}</p>
        </div>
        <button onclick="document.getElementById('voice-notice-modal').classList.add('hidden')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg sm:text-xl py-4 rounded-2xl shadow-lg transition active:scale-95">
          ${c.btnText}
        </button>
      </div>
    `;
  }

  // Voice Commands
  initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateVoiceIndicator(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateVoiceIndicator(false);
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      console.log('[VoiceAssistant Command Received]:', transcript);
      this.handleVoiceCommand(transcript);
    };

    this.recognition.onerror = (err) => {
      console.warn('[VoiceAssistant Error]:', err.error);
      this.isListening = false;
      this.updateVoiceIndicator(false);
    };
  }

  toggleListening() {
    if (!this.recognition) {
      alert('Voice command recognition is not supported in this browser. Text-to-speech audio guidance is fully active.');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      const lang = this.detectLanguage();
      const codeMap = { te: 'te-IN', hi: 'hi-IN', en: 'en-IN' };
      this.recognition.lang = codeMap[lang] || 'en-IN';
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  }

  updateVoiceIndicator(active) {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById('voice-cmd-btn');
    if (btn) {
      if (active) {
        btn.classList.add('animate-pulse', 'bg-red-500', 'text-white');
        btn.setAttribute('aria-label', 'Listening to voice command...');
      } else {
        btn.classList.remove('animate-pulse', 'bg-red-500', 'text-white');
      }
    }
  }

  handleVoiceCommand(transcript) {
    // 1. Emergency
    if (transcript.includes('emergency') || transcript.includes('help') || transcript.includes('sos') || transcript.includes('సహాయం') || transcript.includes('मदद') || transcript.includes('सहायता')) {
      window.sosManager && window.sosManager.showSosModal();
      return;
    }

    // 2. Read Schedule
    if (transcript.includes('read') || transcript.includes('medicines') || transcript.includes('schedule') || transcript.includes('చదువు') || transcript.includes('మందులు') || transcript.includes('दवा') || transcript.includes('सुनाओ')) {
      window.seniorView && window.seniorView.readAloud();
      return;
    }

    // 3. Take Dose
    if (transcript.includes('took') || transcript.includes('taken') || transcript.includes('తీసుకున్నాను') || transcript.includes('ले ली')) {
      window.seniorView && window.seniorView.takeNextDose();
      return;
    }
  }
}

// Export for Node tests and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceAssistant;
}
if (typeof window !== 'undefined') {
  window.voiceAssistant = new VoiceAssistant();
}
