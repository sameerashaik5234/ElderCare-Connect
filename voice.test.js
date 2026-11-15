// Comprehensive Voice Assistant Unit Tests — Telugu, Hindi, English
// Tests: voice selection, schedule text generation, non-fallback enforcement,
//        time formatting, and voice-missing notice behaviour.
//
// NOTE: These are Node.js unit tests with mocked SpeechSynthesis.
//       Real browser TTS pronunciation must be verified manually in Edge/Chrome
//       because the Web Speech API is not available in Node.js.

const test   = require('node:test');
const assert = require('node:assert');
const VoiceAssistant = require('../public/js/voice');

// ─────────────────────────────────────────────────────────────────────────────
// MOCK HELPER
// ─────────────────────────────────────────────────────────────────────────────

function createMockSpeechEnv(mockVoices = []) {
  let spokenUtterance       = null;
  let speakCallCount        = 0;
  let cancelled             = false;
  let voiceNoticeInvokedWith = null; // { lang, text, doses }

  const mockSynth = {
    getVoices:        () => mockVoices,
    speak:            (utt) => { spokenUtterance = utt; speakCallCount++; },
    cancel:           () => { cancelled = true; },
    // Needed by waitForVoices() — voices are pre-loaded so it shortcuts via getVoices()
    addEventListener: (_evt, _cb, _opts) => {}
  };

  global.window    = { speechSynthesis: mockSynth, currentLanguage: 'en' };
  global.document  = undefined; // suppress DOM in tests

  global.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text  = text;
      this.lang  = '';
      this.voice = null;
      this.rate  = 1.0;
      this.pitch = 1.0;
    }
  };

  const assistant = new VoiceAssistant();
  assistant.synth  = mockSynth;
  assistant.voices = mockVoices;

  // Override DOM-dependent notice so we can inspect calls without a browser
  assistant.showVoiceUnavailableNotice = (lang, text, doses) => {
    voiceNoticeInvokedWith = { lang, text, doses };
  };

  return {
    assistant,
    getSpokenUtterance:    () => spokenUtterance,
    getSpeakCallCount:     () => speakCallCount,
    wasCancelled:          () => cancelled,
    getVoiceNoticeInvoked: () => voiceNoticeInvokedWith
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED DOSE FIXTURE (all three languages)
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_DOSES_ALL_LANGS = [
  {
    scheduled_time:     '08:00',
    medication_name:    'Amlodipine 5mg',
    medication_name_te: 'అమ్లోడిపైన్ 5mg',
    medication_name_hi: 'एम्लोडिपिन 5mg',
    dosage:             '1 Tablet (1 మాత్ర)',
    dosage_te:          '1 మాత్ర',
    dosage_hi:          '1 गोली',
    instructions:       'Take 1 tablet in morning before breakfast for Blood Pressure',
    instructions_te:    'రక్తపోటు నియంత్రణ కోసం ఉదయం అల్పాహారానికి ముందు 1 మాత్ర తీసుకోండి',
    instructions_hi:    'రक्తचाप नियंत्रण के लिए सुबह नाश्ते से पहले 1 गोली लें',
    meal_timing:        'BEFORE_MEAL',
    status:             'PENDING'
  },
  {
    scheduled_time:     '13:00',
    medication_name:    'Multivitamin Senior',
    medication_name_te: 'మల్టీవిటమిన్ మాత్రలు',
    medication_name_hi: 'मल्टीविटामिन सीनियर',
    dosage:             '1 Tablet',
    dosage_te:          '1 మాత్ర',
    dosage_hi:          '1 गोली',
    instructions:       'Take 1 tablet with lunch for daily energy & immunity',
    instructions_te:    'మంచి శక్తి మరియు రోగనిరోధక శక్తి కోసం భోజనంతో 1 మాత్ర తీసుకోండి',
    instructions_hi:    'दैनिक ऊर्जा के लिए दोपहर के भोजन के साथ 1 गोली लें',
    meal_timing:        'WITH_MEAL',
    status:             'PENDING'
  },
  {
    scheduled_time:     '20:00',
    medication_name:    'Metformin 500mg',
    medication_name_te: 'మెట్‌ఫార్మిన్ 500mg',
    medication_name_hi: 'मेटफॉर्मिन 500mg',
    dosage:             '1 Tablet',
    dosage_te:          '1 మాత్ర',
    dosage_hi:          '1 गोली',
    instructions:       'Take 1 tablet after meals with water',
    instructions_te:    'భోజనం తర్వాత 1 మాత్ర నీటితో తీసుకోండి',
    instructions_hi:    'भोजन के बाद 1 गोली पानी के साथ लें',
    meal_timing:        'AFTER_MEAL',
    status:             'PENDING'
  }
];

// ═════════════════════════════════════════════════════════════════════════════
// TEST 1 — Language detection
// ═════════════════════════════════════════════════════════════════════════════

test('VoiceAssistant: detectLanguage respects explicit param, window global, and fallback', () => {
  const { assistant } = createMockSpeechEnv([]);

  assert.strictEqual(assistant.detectLanguage('te'), 'te', 'Explicit param te');
  assert.strictEqual(assistant.detectLanguage('hi'), 'hi', 'Explicit param hi');
  assert.strictEqual(assistant.detectLanguage('en'), 'en', 'Explicit param en');

  global.window.currentLanguage = 'te';
  assert.strictEqual(assistant.detectLanguage(), 'te', 'window.currentLanguage=te');

  global.window.currentLanguage = 'hi';
  assert.strictEqual(assistant.detectLanguage(), 'hi', 'window.currentLanguage=hi');

  global.window.currentLanguage = 'en';
  assert.strictEqual(assistant.detectLanguage(), 'en', 'window.currentLanguage=en');
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 2 — Telugu voice selection
// ═════════════════════════════════════════════════════════════════════════════

test('VoiceAssistant: getTeluguVoice() selects te-IN voice by lang code', () => {
  const mockVoices = [
    { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' },
    { name: 'Microsoft Mohan - Telugu (India)',                   lang: 'te-IN' },
    { name: 'Google US English',                                  lang: 'en-US' }
  ];
  const { assistant } = createMockSpeechEnv(mockVoices);
  const voice = assistant.getTeluguVoice();
  assert.ok(voice,                             'Telugu voice must be found');
  assert.strictEqual(voice.lang, 'te-IN',      'Lang must be te-IN');
  assert.strictEqual(voice.name, 'Microsoft Mohan - Telugu (India)');
});

test('VoiceAssistant: getTeluguVoice() returns null when no Telugu voice present', () => {
  const { assistant } = createMockSpeechEnv([
    { name: 'Microsoft Ravi - English (India)', lang: 'en-IN' }
  ]);
  assert.strictEqual(assistant.getTeluguVoice(), null);
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 3 — Hindi voice selection
// ═════════════════════════════════════════════════════════════════════════════

test('VoiceAssistant: getHindiVoice() selects hi-IN voice by lang code', () => {
  const mockVoices = [
    { name: 'Microsoft Hemant - Hindi (India)',                   lang: 'hi-IN' },
    { name: 'Microsoft David Desktop - English (United States)',  lang: 'en-US' },
    { name: 'Microsoft Mohan - Telugu (India)',                   lang: 'te-IN' }
  ];
  const { assistant } = createMockSpeechEnv(mockVoices);
  const voice = assistant.getHindiVoice();
  assert.ok(voice,                             'Hindi voice must be found');
  assert.strictEqual(voice.lang, 'hi-IN',      'Lang must be hi-IN');
  assert.strictEqual(voice.name, 'Microsoft Hemant - Hindi (India)');
});

test('VoiceAssistant: getHindiVoice() returns null when no Hindi voice present', () => {
  const { assistant } = createMockSpeechEnv([
    { name: 'Microsoft Ravi - English (India)', lang: 'en-IN' },
    { name: 'Microsoft Mohan - Telugu (India)', lang: 'te-IN' }
  ]);
  assert.strictEqual(assistant.getHindiVoice(), null);
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 4 — Telugu time formatting
// ═════════════════════════════════════════════════════════════════════════════

test('VoiceAssistant: formatTimeTelugu converts HH:MM to Telugu spoken time words', () => {
  const { assistant } = createMockSpeechEnv([]);
  assert.strictEqual(assistant.formatTimeTelugu('08:00'), 'ఉదయం ఎనిమిది గంటలకు');
  assert.strictEqual(assistant.formatTimeTelugu('13:00'), 'మధ్యాహ్నం ఒకటి గంటలకు');
  assert.strictEqual(assistant.formatTimeTelugu('20:00'), 'రాత్రి ఎనిమిది గంటలకు');
  assert.strictEqual(assistant.formatTimeTelugu('21:00'), 'రాత్రి తొమ్మిది గంటలకు');
  assert.strictEqual(assistant.formatTimeTelugu('06:30'), 'ఉదయం ఆరున్నర గంటలకు');
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 5 — Hindi time formatting
// ═════════════════════════════════════════════════════════════════════════════

test('VoiceAssistant: formatTimeHindi converts HH:MM to Hindi spoken time words', () => {
  const { assistant } = createMockSpeechEnv([]);
  assert.strictEqual(assistant.formatTimeHindi('08:00'), 'सुबह आठ बजे');
  assert.strictEqual(assistant.formatTimeHindi('13:00'), 'दोपहर एक बजे');
  assert.strictEqual(assistant.formatTimeHindi('20:00'), 'रात आठ बजे');
  assert.strictEqual(assistant.formatTimeHindi('21:00'), 'रात नौ बजे');
  assert.strictEqual(assistant.formatTimeHindi('06:30'), 'सुबह साढ़े छह बजे');
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 6 — buildHindiScheduleSpeech internal helper (content detail)
// ═════════════════════════════════════════════════════════════════════════════

test('VoiceAssistant: buildHindiScheduleSpeech — greeting, full medicine name, dosage, time, instructions', () => {
  const { assistant } = createMockSpeechEnv([]);

  const doses = [
    {
      scheduled_time:     '08:00',
      medication_name:    'Amlodipine 5mg',
      medication_name_hi: 'एम्लोडिपिन 5mg',
      dosage:             '1 Tablet',
      dosage_hi:          '1 गोली',
      instructions:       'Before breakfast',
      instructions_hi:    'रक्तचाप नियंत्रण के लिए सुबह नाश्ते से पहले 1 गोली लें',
      meal_timing:        'BEFORE_MEAL',
      status:             'PENDING'
    },
    {
      scheduled_time:     '21:00',
      medication_name:    'Atorvastatin 10mg',
      medication_name_hi: 'एटोरवास्टेटिन 10mg',
      dosage:             '1 Capsule',
      dosage_hi:          '1 कैप्सूल',
      instructions:       'At night for cholesterol',
      instructions_hi:    'कोलेस्ट्रॉल के लिए रात को सोने से पहले 1 कैप्सूल लें',
      meal_timing:        'AFTER_MEAL',
      status:             'PENDING'
    }
  ];

  const text = assistant.buildHindiScheduleSpeech(doses, 'Lakshmi Devi');
  console.log('\n[buildHindiScheduleSpeech output]\n' + text + '\n');

  // Contains Devanagari
  assert.ok(/[\u0900-\u097F]/.test(text), 'Must contain Devanagari script');

  // Greeting
  assert.ok(text.includes('नमस्ते'),          'Hindi greeting नमस्ते');
  assert.ok(text.includes('लक्ष्मी देवी'),    'Patient name in Hindi');

  // Times
  assert.ok(text.includes('सुबह आठ बजे'), '08:00 → सुबह आठ बजे');
  assert.ok(text.includes('रात नौ बजे'),  '21:00 → रात नौ बजे');

  // Full medicine names (not truncated)
  assert.ok(text.includes('एम्लोडिपिन'),    'Amlodipine name in Hindi');
  assert.ok(text.includes('एटोरवास्टेटिन'), 'Atorvastatin name in Hindi');

  // Dosage
  assert.ok(text.includes('एक गोली'),    'Tablet dosage → एक गोली');
  assert.ok(text.includes('एक कैप्सूल'), 'Capsule dosage → एक कैप्सूल');

  // Instructions
  assert.ok(text.includes('नाश्ते से पहले') || text.includes('रक्तचाप'),
    'Blood pressure instructions present in Hindi');
  assert.ok(text.includes('कोलेस्ट्रॉल'), 'Cholesterol instruction in Hindi');

  // Closing
  assert.ok(text.includes('धन्यवाद'), 'Hindi closing धन्यवाद');

  // No English sentence fragments
  const prohibited = ['Hello', 'Dose ', 'please take', 'breakfast', 'after meals'];
  for (const word of prohibited) {
    assert.strictEqual(text.includes(word), false,
      `Hindi speech must NOT contain English word: "${word}"`);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 7 — waitForVoices resolves immediately when voices pre-loaded
// ═════════════════════════════════════════════════════════════════════════════

test('VoiceAssistant: waitForVoices resolves immediately when voices already available', async () => {
  const preloadedVoices = [{ name: 'Microsoft Ravi - English (India)', lang: 'en-IN' }];
  const { assistant } = createMockSpeechEnv(preloadedVoices);
  const voices = await assistant.waitForVoices();
  assert.ok(Array.isArray(voices), 'waitForVoices must return an array');
  assert.ok(voices.length > 0,     'Must return preloaded voices');
  assert.strictEqual(voices[0].lang, 'en-IN');
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 8 — Telugu complete schedule: 100% Telugu text, correct utterance
// ═════════════════════════════════════════════════════════════════════════════

test('VoiceAssistant: Telugu readScheduleAloud — 100% Telugu text, correct voice, no English sentences', async () => {
  const mockVoices = [
    { name: 'Microsoft Mohan - Telugu (India)', lang: 'te-IN' },
    { name: 'Microsoft David - English',        lang: 'en-US' }
  ];
  const { assistant, getSpokenUtterance, getSpeakCallCount } = createMockSpeechEnv(mockVoices);

  const result = await assistant.readScheduleAloud(SAMPLE_DOSES_ALL_LANGS, 'Lakshmi Devi (లక్ష్మీ దేవి)', 'te');

  assert.strictEqual(result.success, true,   'Must succeed');
  assert.strictEqual(result.lang,   'te-IN', 'Lang must be te-IN');
  assert.strictEqual(getSpeakCallCount(), 1,  'synth.speak called once');

  const utt = getSpokenUtterance();
  assert.ok(utt,                     'SpeechSynthesisUtterance created');
  assert.strictEqual(utt.lang,       'te-IN');
  assert.strictEqual(utt.voice.lang, 'te-IN');

  const text = utt.text;
  console.log('\n[Telugu schedule text]\n' + text + '\n');

  // Contains Telugu Unicode
  assert.ok(/[\u0C00-\u0C7F]/.test(text), 'Must contain Telugu Unicode script');

  // Greeting
  assert.ok(text.includes('నమస్కారం లక్ష్మీ దేవి గారు'), 'Telugu greeting with patient name');

  // Times in Telugu words
  assert.ok(text.includes('ఉదయం ఎనిమిది గంటలకు'),  '08:00 as ఉదయం ఎనిమిది గంటలకు');
  assert.ok(text.includes('మధ్యాహ్నం ఒకటి గంటలకు'), '13:00 as మధ్యాహ్నం ఒకటి గంటలకు');
  assert.ok(text.includes('రాత్రి ఎనిమిది గంటలకు'),  '20:00 as రాత్రి ఎనిమిది గంటలకు');

  // Medicine names in Telugu
  assert.ok(text.includes('అమ్లోడిపైన్'),   'Amlodipine in Telugu');
  assert.ok(text.includes('మల్టీవిటమిన్'),  'Multivitamin in Telugu');
  assert.ok(text.includes('మెట్‌ఫార్మిన్'), 'Metformin in Telugu');

  // Dosage in Telugu
  assert.ok(text.includes('ఒక మాత్ర'), 'Dosage → ఒక మాత్ర');

  // Instructions in Telugu
  assert.ok(text.includes('తీసుకోండి'), 'Instructions must include తీసుకోండి');

  // No English sentences
  const prohibited = ['Hello', 'Dose ', 'please take', 'dosage', 'scheduled', 'breakfast', 'after meals'];
  for (const word of prohibited) {
    assert.strictEqual(text.includes(word), false,
      `Telugu schedule must NOT contain English: "${word}"`);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 9 — Hindi complete schedule: 100% Hindi text, correct utterance
// ═════════════════════════════════════════════════════════════════════════════

test('VoiceAssistant: Hindi readScheduleAloud — 100% Hindi text, correct voice, no English sentences', async () => {
  const mockVoices = [
    { name: 'Microsoft Hemant - Hindi (India)', lang: 'hi-IN' },
    { name: 'Microsoft David - English',        lang: 'en-US' }
  ];
  const { assistant, getSpokenUtterance, getSpeakCallCount } = createMockSpeechEnv(mockVoices);

  const result = await assistant.readScheduleAloud(SAMPLE_DOSES_ALL_LANGS, 'Lakshmi Devi', 'hi');

  assert.strictEqual(result.success, true,   'Must succeed for Hindi');
  assert.strictEqual(result.lang,   'hi-IN', 'Lang must be hi-IN');
  assert.strictEqual(getSpeakCallCount(), 1,  'synth.speak called once');

  const utt = getSpokenUtterance();
  assert.ok(utt,                     'SpeechSynthesisUtterance created');
  assert.strictEqual(utt.lang,       'hi-IN');
  assert.strictEqual(utt.voice.lang, 'hi-IN');

  const text = utt.text;
  console.log('\n[Hindi schedule text]\n' + text + '\n');

  // Contains Devanagari
  assert.ok(/[\u0900-\u097F]/.test(text), 'Must contain Devanagari script');

  // Greeting
  assert.ok(text.includes('नमस्ते'),       'Hindi greeting नमस्ते');
  assert.ok(text.includes('लक्ष्मी देवी'), 'Patient name in Hindi');

  // Times in Hindi words
  assert.ok(text.includes('सुबह आठ बजे'),  '08:00 → सुबह आठ बजे');
  assert.ok(text.includes('दोपहर एक बजे'), '13:00 → दोपहर एक बजे');
  assert.ok(text.includes('रात आठ बजे'),   '20:00 → रात आठ बजे');

  // Full medicine names in Hindi (not truncated)
  assert.ok(text.includes('एम्लोडिपिन'),  'Amlodipine in Hindi');
  assert.ok(text.includes('मल्टीविटामिन'), 'Multivitamin in Hindi');
  assert.ok(text.includes('मेटफॉर्मिन'),  'Metformin in Hindi');

  // Dosage in Hindi
  assert.ok(text.includes('एक गोली'), 'Dosage → एक गोली');

  // Instructions in Hindi
  assert.ok(text.includes('लें'), 'Hindi instructions must include लें');

  // Closing
  assert.ok(text.includes('धन्यवाद'), 'Hindi closing धन्यवाद');

  // No English sentences
  const prohibited = ['Hello', 'Dose ', 'please take', 'dosage', 'scheduled', 'breakfast', 'after meals'];
  for (const word of prohibited) {
    assert.strictEqual(text.includes(word), false,
      `Hindi schedule must NOT contain English: "${word}"`);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 10 — English schedule: correct content and voice
// ═════════════════════════════════════════════════════════════════════════════

test('VoiceAssistant: English readScheduleAloud — correct greeting, medicine name, time, dosage', async () => {
  const mockVoices = [
    { name: 'Microsoft Ravi - English (India)', lang: 'en-IN' },
    { name: 'Microsoft David - English (US)',   lang: 'en-US' }
  ];
  const { assistant, getSpokenUtterance, getSpeakCallCount } = createMockSpeechEnv(mockVoices);

  const doses = [{
    scheduled_time:  '08:00',
    medication_name: 'Metformin 500mg',
    dosage:          '1 Tablet',
    instructions:    'Take 1 tablet after breakfast',
    status:          'PENDING'
  }];

  const result = await assistant.readScheduleAloud(doses, 'Lakshmi Devi', 'en');

  assert.strictEqual(result.success, true,   'English schedule must succeed');
  assert.strictEqual(result.lang,   'en-IN', 'Lang must be en-IN');
  assert.strictEqual(getSpeakCallCount(), 1);

  const utt = getSpokenUtterance();
  assert.ok(utt);
  assert.strictEqual(utt.lang,       'en-IN');
  assert.strictEqual(utt.voice.lang, 'en-IN');

  const text = utt.text;
  console.log('\n[English schedule text]\n' + text + '\n');

  assert.ok(text.includes('Hello Lakshmi Devi'), 'English greeting');
  assert.ok(text.includes('Metformin 500mg'),     'Full medicine name preserved');
  assert.ok(text.includes('1 Tablet'),            'Dosage present');
  assert.ok(text.includes('8:00 AM'),             '08:00 → 8:00 AM');
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 11 — Telugu voice MISSING → no English fallback (non-fallback enforcement)
// ═════════════════════════════════════════════════════════════════════════════

test('VoiceAssistant: Missing Telugu voice → speech suppressed, notice shown, reason=VOICE_UNAVAILABLE', async () => {
  const onlyEnglishVoices = [
    { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' },
    { name: 'Microsoft Zira Desktop - English (United States)',  lang: 'en-US' },
    { name: 'Microsoft Ravi - English (India)',                  lang: 'en-IN' }
  ];
  const { assistant, getSpokenUtterance, getSpeakCallCount, getVoiceNoticeInvoked } =
    createMockSpeechEnv(onlyEnglishVoices);

  assert.strictEqual(assistant.getTeluguVoice(), null, 'Telugu voice must be absent');

  const doses = [{
    scheduled_time:     '08:00',
    medication_name:    'Metformin 500mg',
    medication_name_te: 'మెట్‌ఫార్మిన్ 500mg',
    dosage:             '1 Tablet',
    status:             'PENDING'
  }];

  const result = await assistant.readScheduleAloud(doses, 'లక్ష్మీ దేవి', 'te');

  assert.strictEqual(result.success, false,              'Must return success=false');
  assert.strictEqual(result.reason,  'VOICE_UNAVAILABLE','Reason must be VOICE_UNAVAILABLE');
  assert.strictEqual(getSpeakCallCount(),    0,    'synth.speak must NOT be called');
  assert.strictEqual(getSpokenUtterance(),   null, 'No utterance must be created');

  const notice = getVoiceNoticeInvoked();
  assert.ok(notice,                     'showVoiceUnavailableNotice must be called');
  assert.strictEqual(notice.lang, 'te', 'Notice lang must be "te"');
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 12 — Hindi voice MISSING → no English fallback (non-fallback enforcement)
// ═════════════════════════════════════════════════════════════════════════════

test('VoiceAssistant: Missing Hindi voice → speech suppressed, notice shown, reason=VOICE_UNAVAILABLE', async () => {
  const onlyEnglishVoices = [
    { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' },
    { name: 'Microsoft Ravi - English (India)',                  lang: 'en-IN' }
  ];
  const { assistant, getSpokenUtterance, getSpeakCallCount, getVoiceNoticeInvoked } =
    createMockSpeechEnv(onlyEnglishVoices);

  assert.strictEqual(assistant.getHindiVoice(), null, 'Hindi voice must be absent');

  const doses = [{
    scheduled_time:     '08:00',
    medication_name:    'Amlodipine 5mg',
    medication_name_hi: 'एम्लोडिपिन 5mg',
    dosage:             '1 Tablet',
    dosage_hi:          '1 गोली',
    status:             'PENDING'
  }];

  const result = await assistant.readScheduleAloud(doses, 'लक्ष्मी देवी', 'hi');

  assert.strictEqual(result.success, false,               'Must return success=false for Hindi');
  assert.strictEqual(result.reason,  'VOICE_UNAVAILABLE', 'Reason must be VOICE_UNAVAILABLE');
  assert.strictEqual(getSpeakCallCount(),  0,    'synth.speak must NOT be called');
  assert.strictEqual(getSpokenUtterance(), null, 'No utterance must be created');

  const notice = getVoiceNoticeInvoked();
  assert.ok(notice,                     'showVoiceUnavailableNotice must be called');
  assert.strictEqual(notice.lang, 'hi', 'Notice lang must be "hi"');
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 13 — English voice MISSING → speech suppressed, notice shown
// ═════════════════════════════════════════════════════════════════════════════

test('VoiceAssistant: Missing English voice → speech suppressed, notice shown, reason=VOICE_UNAVAILABLE', async () => {
  // Only Telugu/Hindi voices — no English
  const noEnglishVoices = [
    { name: 'Microsoft Mohan - Telugu (India)', lang: 'te-IN' },
    { name: 'Microsoft Hemant - Hindi (India)', lang: 'hi-IN' }
  ];
  const { assistant, getSpokenUtterance, getSpeakCallCount, getVoiceNoticeInvoked } =
    createMockSpeechEnv(noEnglishVoices);

  assert.strictEqual(assistant.getEnglishVoice(), null, 'English voice must be absent');

  const doses = [{
    scheduled_time:  '08:00',
    medication_name: 'Metformin 500mg',
    dosage:          '1 Tablet',
    status:          'PENDING'
  }];

  const result = await assistant.readScheduleAloud(doses, 'Lakshmi Devi', 'en');

  assert.strictEqual(result.success, false,              'Must return success=false');
  assert.strictEqual(result.reason,  'VOICE_UNAVAILABLE','Reason must be VOICE_UNAVAILABLE');
  assert.strictEqual(getSpeakCallCount(),  0,    'synth.speak must NOT be called');
  assert.strictEqual(getSpokenUtterance(), null, 'No utterance must be created');

  const notice = getVoiceNoticeInvoked();
  assert.ok(notice,                     'showVoiceUnavailableNotice must be called');
  assert.strictEqual(notice.lang, 'en', 'Notice lang must be "en"');
});
