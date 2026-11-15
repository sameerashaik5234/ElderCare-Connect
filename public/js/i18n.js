// ElderCare Connect - Bilingual Dictionary (English & Telugu)
const I18N = {
  en: {
    appName: "ElderCare Connect",
    appSubtitle: "Elderly Care & Medication Management",
    seniorMode: "Senior Mode",
    caregiverMode: "Caregiver Portal",
    familyMode: "Family View",
    demoSwitch: "Demo Persona:",
    langToggle: "తెలుగు",
    fontSize: "Font Size:",
    contrast: "Contrast:",
    highContrast: "High Contrast",
    normalContrast: "Standard",
    offlineNotice: "Offline Mode Active — Stored locally",
    onlineNotice: "Online — Synced",
    emergencySos: "EMERGENCY SOS",
    sosHelpText: "Press for immediate caregiver help",
    medicalDisclaimer: "Disclaimer: ElderCare Connect is an adherence tracking and reminder assistant. It does not provide medical diagnoses or recommend medication dosage modifications. Always consult a certified healthcare professional.",

    // Senior View
    greeting: "Hello",
    todayMeds: "Today's Medications",
    allMedsTaken: "All medications taken for today! Wonderful job! ⭐",
    listenVoice: "Listen to Schedule",
    voicePromptListening: "Listening... Speak now",
    markTaken: "TAKE DOSE",
    snooze15: "Snooze 15m",
    skipDose: "Skip",
    doseTaken: "Taken at",
    scheduledFor: "Scheduled for",
    mealAfter: "After food",
    mealBefore: "Before food",
    mealWith: "With food",
    refillAlert: "Low stock refill needed!",

    // Caregiver View
    patientOverview: "Patient Overview",
    adherenceRate: "Adherence Compliance",
    activeStreak: "Adherence Streak",
    daysStreak: "Days",
    manageMeds: "Manage Medications",
    addMed: "Add Prescription",
    appointments: "Doctor Appointments",
    addAppointment: "Schedule Visit",
    vitalsMood: "Health Vitals & Mood",
    logVitals: "Log Health Reading",
    notificationsFeed: "Alerts & Notification Log",
    runScheduler: "Trigger Cloud Scheduler Check",
    exportReport: "Export Doctor Summary",

    // Forms & Fields
    medName: "Medication Name",
    dosage: "Dosage (e.g. 500mg)",
    frequency: "Frequency",
    mealTiming: "Meal Timing",
    timeSlots: "Scheduled Times (e.g. 08:00)",
    instructions: "Instructions",
    doctorName: "Doctor's Name",
    remainingPills: "Remaining Quantity",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    close: "Close",

    // SOS Modal
    sosConfirmTitle: "Trigger Emergency SOS?",
    sosConfirmDesc: "This will immediately notify your family and emergency caregivers with your location.",
    sosCancel: "Cancel (False Alarm)",
    sosTriggerNow: "YES, SEND HELP NOW",
    sosActiveAlert: "Emergency alert sent to your caregiver! Calling emergency phone...",

    // Voice Assistant Phrases
    voiceReadIntro: "Here is your medication schedule for today.",
    voiceNoMeds: "You have no remaining doses for today.",
    voiceDoseConfirm: "Great! Your dose has been recorded as taken.",
    voiceSosConfirm: "Emergency help request has been dispatched to your caregivers.",
    teluguVoiceMissingTitle: "Telugu Voice Unavailable in Browser",
    teluguVoiceMissingDesc: "Your browser or device does not currently have a Telugu (te-IN) Text-to-Speech voice installed. To prevent incorrect pronunciation, audio speech has been paused and your schedule is displayed below.",
    teluguVoiceGuideTitle: "How to enable Telugu Speech:",
    teluguVoiceGuideDesc: "Windows: Settings → Time & Language → Speech → Add voices → Telugu (India)\nAndroid: Ensure Google Text-to-Speech engine is enabled\nChrome: Open in Google Chrome for built-in Google Telugu TTS",
    writtenScheduleTitle: "Today's Medication Schedule (Telugu)"
  },

  te: {
    appName: "ఎల్డర్‌కేర్ కనెక్ట్",
    appSubtitle: "వృద్ధుల సంరక్షణ & మందుల నిర్వహణ",
    seniorMode: "సీనియర్ మోడ్",
    caregiverMode: "కేర్‌గివర్ పోర్టల్",
    familyMode: "కుటుంబ సభ్యుల వీక్షణ",
    demoSwitch: "డెమో ప్రొఫైల్:",
    langToggle: "English",
    fontSize: "అక్షరాల పరిమాణం:",
    contrast: "కాంట్రాస్ట్:",
    highContrast: "హై కాంట్రాస్ట్",
    normalContrast: "సాధారణం",
    offlineNotice: "ఆఫ్‌లైన్ మోడ్ — స్థానికంగా భద్రపరచబడింది",
    onlineNotice: "ఆన్‌లైన్ — సమకాలీకరించబడింది",
    emergencySos: "అత్యవసర సహాయం (SOS)",
    sosHelpText: "వెంటనే కుటుంబ సభ్యులకు సమాచారం ఇవ్వడానికి నొక్కండి",
    medicalDisclaimer: "గమనిక: ఎల్డర్‌కేర్ కనెక్ట్ మందుల జ్ఞాపిక మరియు ట్రాకింగ్ సాధనం మాత్రమే. ఇది వైద్య పరీక్షలు లేదా మందుల మోతాదు మార్పులను సూచించదు. వైద్య సలహా కోసం మీ వైద్యుడిని సంప్రదించండి.",

    // Senior View
    greeting: "నమస్కారం",
    todayMeds: "ఈ రోజు తీసుకోవాల్సిన మందులు",
    allMedsTaken: "ఈ రోజు మందులన్నీ విజయవంతంగా తీసుకున్నారు! చాలా మంచిది! ⭐",
    listenVoice: "మందుల వివరాలు వినండి",
    voicePromptListening: "వినబడుతోంది... ఇప్పుడు మాట్లాడండి",
    markTaken: "మందు తీసుకున్నాను",
    snooze15: "15 నిమి. తర్వాత",
    skipDose: "వదిలివేయి",
    doseTaken: "తీసుకున్న సమయం",
    scheduledFor: "నిర్ణీత సమయం",
    mealAfter: "భోజనం తర్వాత",
    mealBefore: "భోజనానికి ముందు",
    mealWith: "భోజనంతో పాటు",
    refillAlert: "మందులు అయిపోతున్నాయి! కొత్తవి కొనండి!",

    // Caregiver View
    patientOverview: "రోగి సమాచారం",
    adherenceRate: "మందుల క్రమశిక్షణ రేటు",
    activeStreak: "నిరంతర రోజులు",
    daysStreak: "రోజులు",
    manageMeds: "మందుల నిర్వహణ",
    addMed: "కొత్త మందు జోడించండి",
    appointments: "వైద్యుల అపాయింట్‌మెంట్లు",
    addAppointment: "అపాయింట్‌మెంట్ నమోదు",
    vitalsMood: "ఆరోగ్య సూచికలు & మానసిక స్థితి",
    logVitals: "రీడింగ్ నమోదు చేయండి",
    notificationsFeed: "హెచ్చరికలు & సమాచార లాగ్",
    runScheduler: "క్లౌడ్ షెడ్యూలర్ తనిఖీని ప్రారంభించండి",
    exportReport: "వైద్యుల సారాంశ నివేదిక డౌన్‌లోడ్",

    // Forms & Fields
    medName: "మందు పేరు",
    dosage: "మోతాదు (ఉదా: 500mg)",
    frequency: "ఫ్రీక్వెన్సీ",
    mealTiming: "భోజన సమయం",
    timeSlots: "నిర్ణీత సమయాలు (ఉదా: 08:00)",
    instructions: "సూచనలు",
    doctorName: "వైద్యుడి పేరు",
    remainingPills: "మిగిలిన మాత్రలు",
    save: "భద్రపరచు",
    cancel: "రద్దు",
    confirm: "ధృవీకరించు",
    close: "మూసివేయి",

    // SOS Modal
    sosConfirmTitle: "అత్యవసర సహాయం (SOS) కావాలా?",
    sosConfirmDesc: "ఇది వెంటనే మీ కుటుంబ సభ్యులు మరియు సంరక్షకులకు మీ లొకేషన్‌తో సహా అత్యవసర సమాచారం పంపుతుంది.",
    sosCancel: "రద్దు (తప్పుగా నొక్కాను)",
    sosTriggerNow: "అవును, వెంటనే సహాయం పంపండి",
    sosActiveAlert: "మీ సంరక్షకులకు అత్యవసర హెచ్చరిక పంపబడింది! ఫోన్ కాల్ కనెక్ట్ అవుతోంది...",

    // Voice Assistant Phrases
    voiceReadIntro: "ఈ రోజు మీరు తీసుకోవాల్సిన మందుల వివరాలు ఇవి.",
    voiceNoMeds: "ఈ రోజుకి ఇక మందులేవీ లేవు.",
    voiceDoseConfirm: "మంచిది! మీరు మందు తీసుకున్నట్లు నమోదు చేయబడింది.",
    voiceSosConfirm: "మీ సంరక్షకులకు అత్యవసర సహాయ అభ్యర్థన పంపబడింది.",
    teluguVoiceMissingTitle: "బ్రౌజర్‌లో తెలుగు వాయిస్ అందుబాటులో లేదు",
    teluguVoiceMissingDesc: "మీ బ్రౌజర్ లేదా డివైస్‌లో తెలుగు (te-IN) టెక్స్ట్-టు-స్పీచ్ వాయిస్ అందుబాటులో లేదు. ఆంగ్లంలో తప్పుగా చదవకుండా ఆడియో ఆపబడింది. మీ మందుల షెడ్యూల్ క్రింద చూపించబడింది.",
    teluguVoiceGuideTitle: "తెలుగు వాయిస్ ఎలా ప్రారంభించాలి:",
    teluguVoiceGuideDesc: "విండోస్: Settings → Time & Language → Speech → Add voices → 'Telugu (India)' ఎంచుకోండి.\nఆండ్రాయిడ్: Google Text-to-Speech యాక్టివ్‌గా ఉందని నిర్ధారించుకోండి.\nక్రోమ్: గూగుల్ క్రోమ్‌లో అంతర్నిర్మిత తెలుగు వాయిస్ సపోర్ట్ ఉంటుంది.",
    writtenScheduleTitle: "ఈ రోజు మందుల షెడ్యూల్"
  },

  hi: {
    appName: "एल्डरकेयर कनेक्ट",
    appSubtitle: "बुजुर्गों की देखभाल और दवा प्रबंधन",
    seniorMode: "सीनियर मोड",
    caregiverMode: "केयरगिवर पोर्टल",
    familyMode: "परिवार व्यू",
    demoSwitch: "डेमो प्रोफ़ाइल:",
    langToggle: "हिन्दी",
    fontSize: "फॉन्ट आकार:",
    contrast: "कंट्रास्ट:",
    highContrast: "हाई कंट्रास्ट",
    normalContrast: "सामान्य",
    offlineNotice: "ऑफ़लाइन मोड सक्रिय — स्थानीय रूप से सुरक्षित",
    onlineNotice: "ऑनलाइन — सिंक हो गया",
    emergencySos: "आपातकालीन सहायता (SOS)",
    sosHelpText: "तुरंत देखभालकर्ता को सहायता के लिए दबाएं",
    medicalDisclaimer: "सूचना: एल्डरकेयर कनेक्ट दवा अनुपालन और स्मरण सहायक उपकरण है। यह चिकित्सीय निदान या खुराक में बदलाव की सिफारिश नहीं करता है। हमेशा प्रमाणित चिकित्सक से परामर्श लें।",

    // Senior View
    greeting: "नमस्ते",
    todayMeds: "आज की दवाइयां",
    allMedsTaken: "आज की सभी दवाइयां सफलतापूर्वक ली जा चुकी हैं! बहुत बढ़िया! ⭐",
    listenVoice: "दवाइयों का समय सुनें",
    voicePromptListening: "सुन रहे हैं... अब बोलें",
    markTaken: "दवाई ले ली",
    snooze15: "15 मिनट बाद",
    skipDose: "छोड़ें",
    doseTaken: "लेने का समय",
    scheduledFor: "निर्धारित समय",
    mealAfter: "भोजन के बाद",
    mealBefore: "भोजन से पहले",
    mealWith: "भोजन के साथ",
    refillAlert: "दवा खत्म होने वाली है! नया स्टॉक लाएं!",

    // Caregiver View
    patientOverview: "रोगी का विवरण",
    adherenceRate: "दवा अनुपालन दर",
    activeStreak: "लगातार दिन",
    daysStreak: "दिन",
    manageMeds: "दवाइयों का प्रबंधन",
    addMed: "नई दवाई जोड़ें",
    appointments: "डॉक्टर अपॉइंटमेंट्स",
    addAppointment: "अपॉइंटमेंट दर्ज करें",
    vitalsMood: "स्वास्थ्य संकेतक और मनोदशा",
    logVitals: "रीडिंग दर्ज करें",
    notificationsFeed: "अलर्ट और सूचनाएं लॉग",
    runScheduler: "क्लाउड शेड्यूलर जांच शुरू करें",
    exportReport: "डॉक्टर सारांश रिपोर्ट डाउनलोड",

    // Forms & Fields
    medName: "दवाई का नाम",
    dosage: "खुराक (जैसे: 500mg)",
    frequency: "आवृत्ति",
    mealTiming: "भोजन का समय",
    timeSlots: "निर्धारित समय (जैसे: 08:00)",
    instructions: "निर्देश",
    doctorName: "डॉक्टर का नाम",
    remainingPills: "शेष गोलियां",
    save: "सुरक्षित करें",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",
    close: "बंद करें",

    // SOS Modal
    sosConfirmTitle: "क्या आपको आपातकालीन सहायता (SOS) चाहिए?",
    sosConfirmDesc: "यह तुरंत आपके परिवार और देखभालकर्ताओं को आपके स्थान के साथ आपातकालीन अलर्ट भेजेगा।",
    sosCancel: "रद्द करें (गलती से दबा)",
    sosTriggerNow: "हाँ, तुरंत सहायता भेजें",
    sosActiveAlert: "देखभालकर्ताओं को आपातकालीन अलर्ट भेजा गया! फोन कॉल कनेक्ट हो रहा है...",

    // Voice Assistant Phrases
    voiceReadIntro: "आज की आपकी दवाइयों का समय इस प्रकार है।",
    voiceNoMeds: "आज के लिए कोई शेष दवाई नहीं है।",
    voiceDoseConfirm: "बहुत अच्छा! आपकी दवाई दर्ज कर ली गई है।",
    voiceSosConfirm: "आपातकालीन सहायता अनुरोध देखभालकर्ताओं को भेज दिया गया है।",
    teluguVoiceMissingTitle: "ब्राउज़र में आवाज़ उपलब्ध नहीं है",
    teluguVoiceMissingDesc: "आपके डिवाइस में हिंदी (hi-IN) टेक्स्ट-टू-स्पीच आवाज़ उपलब्ध नहीं है। गलत उच्चारण रोकने के लिए ऑडियो रोक दिया गया है। आपकी दवाइयों की सूची नीचे दिखाई गई है।",
    teluguVoiceGuideTitle: "हिंदी आवाज़ कैसे शुरू करें:",
    teluguVoiceGuideDesc: "विंडोज़: Settings → Time & Language → Speech → Add voices → 'Hindi (India)' चुनें।\nएंड्रॉइड / क्रोम: Google Text-to-Speech में हिंदी स्वतः समर्थित है।",
    writtenScheduleTitle: "आज की दवाइयों की सूची"
  }
};

let currentLanguage = 'en';
if (typeof window !== 'undefined') {
  window.currentLanguage = currentLanguage;
}

function setLanguage(lang) {
  if (I18N[lang]) {
    currentLanguage = lang;
    if (typeof window !== 'undefined') {
      window.currentLanguage = lang;
    }
    localStorage.setItem('eldercare_lang', lang);
    document.documentElement.lang = lang;
    applyLanguage();

    // Ensure the current view is immediately re-rendered in the newly selected language
    if (typeof window !== 'undefined' && window.appCoordinator) {
      window.appCoordinator.renderCurrentView();
    }
  }
}

function getTranslation(key) {
  return (I18N[currentLanguage] && I18N[currentLanguage][key]) || I18N.en[key] || key;
}

function t(key) {
  return getTranslation(key);
}

function applyLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerText = getTranslation(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = getTranslation(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.title = getTranslation(key);
  });

  const langSelect = document.getElementById('language-select');
  if (langSelect && langSelect.value !== currentLanguage) {
    langSelect.value = currentLanguage;
  }

  // Dispatch event for dynamic view updates
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLanguage } }));
}

// Initialize saved language
const savedLang = localStorage.getItem('eldercare_lang') || 'en';
setLanguage(savedLang);
