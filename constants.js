// ElderCare Connect Constants

const ROLES = {
  ELDERLY: 'ELDERLY',
  CAREGIVER: 'CAREGIVER',
  FAMILY: 'FAMILY',
  ADMIN: 'ADMIN'
};

const DOSE_STATUS = {
  PENDING: 'PENDING',
  TAKEN: 'TAKEN',
  SNOOZED: 'SNOOZED',
  MISSED: 'MISSED',
  SKIPPED: 'SKIPPED'
};

const VITAL_TYPES = {
  BLOOD_PRESSURE: 'BLOOD_PRESSURE',
  GLUCOSE: 'GLUCOSE',
  HEART_RATE: 'HEART_RATE',
  SPO2: 'SPO2',
  WEIGHT: 'WEIGHT',
  MOOD: 'MOOD'
};

const APPOINTMENT_STATUS = {
  UPCOMING: 'UPCOMING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

const LANGUAGES = {
  EN: 'en',
  TE: 'te',
  HI: 'hi'
};

const MEDICAL_DISCLAIMER = "Disclaimer: ElderCare Connect is an adherence tracking and reminder tool. It does not provide medical diagnoses or recommend medication dosage modifications. Always consult your certified physician for health advice.";

module.exports = {
  ROLES,
  DOSE_STATUS,
  VITAL_TYPES,
  APPOINTMENT_STATUS,
  LANGUAGES,
  MEDICAL_DISCLAIMER
};
