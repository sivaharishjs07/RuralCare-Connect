import type { TriageAssessment } from '@/lib/types/database';

export type AssessmentRiskLevel = TriageAssessment['risk_level'];

export type SymptomAssessmentResult = {
  riskLevel: AssessmentRiskLevel;
  riskScore: number;
  recommendation: string;
};

type Condition = {
  name: string;
  risk: AssessmentRiskLevel;
  keywords: string[];
};

const conditionDataset: Condition[] = [
  { name: 'Common Cold', risk: 'low', keywords: ['runny nose', 'sneezing', 'cough', 'sore throat'] },
  { name: 'Influenza', risk: 'medium', keywords: ['fever', 'cough', 'body ache', 'fatigue'] },
  { name: 'COVID-19', risk: 'high', keywords: ['fever', 'cough', 'sore throat', 'fatigue', 'breathing difficulty'] },
  { name: 'Malaria', risk: 'high', keywords: ['fever', 'chills', 'sweating', 'headache', 'weakness'] },
  { name: 'Dengue', risk: 'high', keywords: ['high fever', 'headache', 'body pain', 'nausea', 'rash'] },
  { name: 'Chikungunya', risk: 'medium', keywords: ['fever', 'severe joint pain', 'headache', 'rash'] },
  { name: 'Typhoid', risk: 'medium', keywords: ['prolonged fever', 'headache', 'abdominal pain', 'weakness'] },
  { name: 'Tuberculosis', risk: 'high', keywords: ['persistent cough', 'fever', 'night sweats', 'fatigue'] },
  { name: 'Cholera', risk: 'high', keywords: ['severe watery diarrhoea', 'vomiting', 'dehydration'] },
  { name: 'Hepatitis A', risk: 'medium', keywords: ['fever', 'nausea', 'abdominal pain', 'jaundice'] },
  { name: 'Hepatitis B', risk: 'medium', keywords: ['fatigue', 'nausea', 'abdominal discomfort', 'jaundice'] },
  { name: 'Hepatitis C', risk: 'medium', keywords: ['few symptoms', 'fatigue', 'jaundice'] },
  { name: 'Measles', risk: 'medium', keywords: ['fever', 'cough', 'runny nose', 'skin rash'] },
  { name: 'Chickenpox', risk: 'medium', keywords: ['fever', 'tiredness', 'itchy rash'] },
  { name: 'Mumps', risk: 'medium', keywords: ['fever', 'headache', 'swollen jaw', 'swollen cheeks'] },
  { name: 'Diphtheria', risk: 'high', keywords: ['sore throat', 'fever', 'swollen neck', 'breathing difficulty'] },
  { name: 'Tetanus', risk: 'high', keywords: ['muscle stiffness', 'jaw stiffness', 'difficulty swallowing'] },
  { name: 'Whooping Cough', risk: 'high', keywords: ['severe cough', 'vomiting after coughing', 'breathing difficulty'] },
  { name: 'Meningitis', risk: 'high', keywords: ['fever', 'severe headache', 'neck stiffness', 'confusion'] },
  { name: 'Encephalitis', risk: 'high', keywords: ['fever', 'headache', 'confusion', 'seizures'] },
  { name: 'Pneumonia', risk: 'high', keywords: ['fever', 'cough', 'chest pain', 'difficult breathing'] },
  { name: 'Bronchitis', risk: 'medium', keywords: ['cough', 'mucus', 'chest discomfort', 'fatigue'] },
  { name: 'Asthma', risk: 'high', keywords: ['wheezing', 'cough', 'chest tightness', 'breathlessness'] },
  { name: 'COPD', risk: 'high', keywords: ['chronic cough', 'mucus', 'breathlessness', 'wheezing'] },
  { name: 'Allergic Rhinitis', risk: 'low', keywords: ['sneezing', 'runny nose', 'itchy eyes'] },
  { name: 'Sinusitis', risk: 'medium', keywords: ['facial pain', 'blocked nose', 'headache', 'nasal discharge'] },
  { name: 'Gastritis', risk: 'medium', keywords: ['stomach pain', 'nausea', 'vomiting', 'indigestion'] },
  { name: 'Peptic Ulcer', risk: 'medium', keywords: ['abdominal pain', 'nausea', 'bloating', 'indigestion'] },
  { name: 'Gastroenteritis', risk: 'medium', keywords: ['diarrhoea', 'vomiting', 'stomach cramps', 'fever'] },
  { name: 'Kidney Stones', risk: 'high', keywords: ['severe side pain', 'back pain', 'painful urination', 'blood in urine'] },
  { name: 'UTI', risk: 'medium', keywords: ['burning urination', 'frequent urination', 'pelvic pain'] },
  { name: 'Kidney Disease', risk: 'high', keywords: ['swelling', 'fatigue', 'reduced urine', 'nausea'] },
  { name: 'Diabetes', risk: 'medium', keywords: ['excessive thirst', 'frequent urination', 'fatigue', 'blurred vision'] },
  { name: 'Hypertension', risk: 'medium', keywords: ['headache', 'dizziness'] },
  { name: 'Heart Disease', risk: 'high', keywords: ['chest discomfort', 'breathlessness', 'fatigue', 'palpitations'] },
  { name: 'Heart Attack', risk: 'emergency', keywords: ['chest pressure', 'chest pain', 'sweating', 'nausea', 'breathlessness'] },
  { name: 'Stroke', risk: 'emergency', keywords: ['facial weakness', 'arm weakness', 'speech difficulty', 'confusion'] },
  { name: 'Anaemia', risk: 'medium', keywords: ['fatigue', 'weakness', 'dizziness', 'pale skin'] },
  { name: 'Thyroid Disorder', risk: 'medium', keywords: ['fatigue', 'temperature sensitivity', 'heart rate changes'] },
  { name: 'Migraine', risk: 'medium', keywords: ['severe headache', 'nausea', 'light sensitivity', 'sound sensitivity'] },
  { name: 'Epilepsy', risk: 'high', keywords: ['recurrent seizures', 'confusion', 'unusual sensations'] },
  { name: 'Arthritis', risk: 'medium', keywords: ['joint pain', 'stiffness', 'swelling'] },
  { name: 'Osteoporosis', risk: 'medium', keywords: ['fragile bones', 'fractures', 'back pain'] },
  { name: 'Eczema', risk: 'medium', keywords: ['dry skin', 'itchy skin', 'inflamed skin'] },
  { name: 'Psoriasis', risk: 'medium', keywords: ['scaly patches', 'itching', 'redness'] },
  { name: 'Scabies', risk: 'low', keywords: ['severe itching', 'rash', 'small bumps'] },
  { name: 'Conjunctivitis', risk: 'medium', keywords: ['red eye', 'watering', 'discharge', 'irritation'] },
  { name: 'Oral Cancer', risk: 'high', keywords: ['persistent mouth sore', 'lump', 'difficulty swallowing'] },
  { name: 'Breast Cancer', risk: 'high', keywords: ['breast lump', 'skin changes', 'nipple changes'] },
  { name: 'Skin Cancer', risk: 'high', keywords: ['changing skin spot', 'unusual growth', 'persistent sore'] },
  { name: 'HIV/AIDS', risk: 'high', keywords: ['recurrent infections', 'fever', 'fatigue'] },
  { name: 'Rabies', risk: 'emergency', keywords: ['animal bite', 'fever', 'swallowing difficulty', 'confusion'] },
  { name: 'Leptospirosis', risk: 'high', keywords: ['fever', 'headache', 'muscle pain', 'vomiting'] },
  { name: 'Japanese Encephalitis', risk: 'high', keywords: ['fever', 'headache', 'vomiting', 'confusion', 'seizures'] },
  { name: 'Filariasis', risk: 'medium', keywords: ['limb swelling', 'pain', 'fever'] },
  { name: 'Heat Exhaustion', risk: 'medium', keywords: ['heavy sweating', 'weakness', 'dizziness', 'headache'] },
  { name: 'Heat Stroke', risk: 'emergency', keywords: ['very high temperature', 'confusion', 'weakness'] },
  { name: 'Food Poisoning', risk: 'medium', keywords: ['vomiting', 'diarrhoea', 'abdominal cramps'] },
  { name: 'Obesity', risk: 'medium', keywords: ['excess body weight', 'reduced activity', 'breathlessness'] },
  { name: 'Malnutrition', risk: 'medium', keywords: ['weakness', 'poor growth', 'fatigue', 'poor appetite'] },
];

const riskWeight: Record<AssessmentRiskLevel, number> = {
  low: 20,
  medium: 45,
  high: 70,
  emergency: 100,
};

function containsAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

function containsAll(text: string, values: string[]) {
  return values.every((value) => text.includes(value));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function assessSymptoms(symptoms: string): SymptomAssessmentResult {
  const normalized = symptoms.toLowerCase().trim();

  if (!normalized) {
    return {
      riskLevel: 'low',
      riskScore: 10,
      recommendation: 'No symptoms were entered. A healthcare professional should review the patient history and current symptoms before making any risk assessment.',
    };
  }

  // 1) Immediate emergency escalation for clear red-flag symptoms. These are not inferred from the count of generic matches.
  const emergencySymptoms = [
    { match: /(chest pain|chest pressure)/, label: 'Possible emergency cardiac pattern', recommendation: 'Emergency warning: urgent medical evaluation is recommended for chest pain or pressure, especially if this is severe or accompanied by shortness of breath.' },
    { match: /(severe breathing difficulty|trouble breathing|shortness of breath|breathing difficulty|severe shortness of breath|struggling to breathe)/, label: 'Possible emergency breathing pattern', recommendation: 'Emergency warning: severe breathing difficulty requires immediate professional evaluation.' },
    { match: /(severe confusion|confused|unresponsive|unconscious|loss of consciousness|fainting)/, label: 'Possible emergency neurological pattern', recommendation: 'Emergency warning: severe confusion or unresponsiveness requires urgent medical assessment.' },
    { match: /(seizure|convulsion|fit)/, label: 'Possible emergency seizure pattern', recommendation: 'Emergency warning: a seizure or convulsion requires urgent medical assessment.' },
    { match: /(severe bleeding|heavy bleeding|bleeding heavily|large blood loss)/, label: 'Possible emergency bleeding pattern', recommendation: 'Emergency warning: severe bleeding requires immediate professional care.' },
  ];

  const emergencyMatch = emergencySymptoms.find((candidate) => candidate.match.test(normalized));
  if (emergencyMatch) {
    return {
      riskLevel: 'emergency',
      riskScore: 100,
      recommendation: emergencyMatch.recommendation,
    };
  }

  // 2) Recognized disease or infection patterns are treated as possible risk patterns, not diagnoses.
  //    This avoids the old issue where disease names like "malaria" were ignored because they were not present in the generic keyword list.
  const recognizedPatterns: Array<{ risk: AssessmentRiskLevel; score: number; label: string; recommendation: string }> = [];

  if (containsAny(normalized, ['malaria'])) {
    recognizedPatterns.push({
      risk: 'high',
      score: 80,
      label: 'Possible malaria-like infection risk pattern',
      recommendation: 'Possible malaria-like risk pattern detected. A healthcare professional should evaluate the patient promptly, especially if fever, chills, sweating, headache, or weakness are present.',
    });
  }

  if (containsAny(normalized, ['dengue'])) {
    recognizedPatterns.push({
      risk: 'high',
      score: 78,
      label: 'Possible dengue-like fever pattern',
      recommendation: 'Possible dengue-like risk pattern detected. Professional evaluation is recommended, particularly if there is high fever, severe headache, rash, or body pain.',
    });
  }

  if (containsAny(normalized, ['typhoid'])) {
    recognizedPatterns.push({
      risk: 'high',
      score: 72,
      label: 'Possible typhoid-like fever pattern',
      recommendation: 'Possible typhoid-like risk pattern detected. Professional assessment is recommended for ongoing fever, abdominal pain, or weakness.',
    });
  }

  if (containsAny(normalized, ['influenza', 'flu'])) {
    recognizedPatterns.push({
      risk: 'medium',
      score: 58,
      label: 'Possible influenza-like illness pattern',
      recommendation: 'Possible influenza-like risk pattern detected. Professional evaluation is recommended if fever, cough, fatigue, or body aches are worsening.',
    });
  }

  if (containsAny(normalized, ['covid', 'covid-19', 'coronavirus'])) {
    recognizedPatterns.push({
      risk: 'high',
      score: 76,
      label: 'Possible COVID-19-like respiratory pattern',
      recommendation: 'Possible COVID-19-like respiratory risk pattern detected. Professional evaluation is recommended, especially with fever, cough, fatigue, or breathing symptoms.',
    });
  }

  if (containsAny(normalized, ['pneumonia'])) {
    recognizedPatterns.push({
      risk: 'high',
      score: 80,
      label: 'Possible pneumonia-like respiratory pattern',
      recommendation: 'Possible pneumonia-like respiratory risk pattern detected. Professional evaluation is recommended, especially when fever and breathing symptoms are present.',
    });
  }

  // 3) Meaningful infection/fever combinations should score based on the combination itself rather than the number of generic condition matches.
  //    This prevents a single symptom such as "fever" from accumulating points because it appears in many disease definitions.
  if (containsAll(normalized, ['fever', 'chills', 'sweating', 'headache', 'weakness']) || containsAll(normalized, ['fever', 'chills', 'headache', 'weakness'])) {
    recognizedPatterns.push({
      risk: 'high',
      score: 82,
      label: 'Possible malaria-like febrile infection pattern',
      recommendation: 'Possible malaria-like risk pattern detected. A healthcare professional should review the patient promptly, especially for fever with chills, sweating, headache, and weakness.',
    });
  }

  if (containsAll(normalized, ['fever', 'headache', 'rash']) || containsAll(normalized, ['high fever', 'headache', 'body pain', 'rash'])) {
    recognizedPatterns.push({
      risk: 'high',
      score: 76,
      label: 'Possible dengue-like febrile pattern',
      recommendation: 'Possible dengue-like risk pattern detected. Professional evaluation is recommended if fever is accompanied by severe headache, rash, or body pain.',
    });
  }

  if (containsAll(normalized, ['fever', 'cough', 'breathing']) || containsAll(normalized, ['fever', 'cough', 'shortness of breath'])) {
    recognizedPatterns.push({
      risk: 'high',
      score: 78,
      label: 'Possible respiratory infection pattern',
      recommendation: 'Possible respiratory infection risk pattern detected. A healthcare professional should assess this promptly, especially if breathing symptoms or worsening fever are present.',
    });
  }

  if (containsAll(normalized, ['fever', 'abdominal pain']) || containsAll(normalized, ['fever', 'abdominal pain', 'weakness'])) {
    recognizedPatterns.push({
      risk: 'high',
      score: 70,
      label: 'Possible systemic febrile illness pattern',
      recommendation: 'Possible systemic febrile illness risk pattern detected. Professional evaluation is recommended if fever is accompanied by abdominal pain or weakness.',
    });
  }

  const strongestPattern = recognizedPatterns.reduce<{ risk: AssessmentRiskLevel; score: number; label: string; recommendation: string } | null>((best, current) => {
    if (!best) return current;
    return riskWeight[current.risk] > riskWeight[best.risk] || (riskWeight[current.risk] === riskWeight[best.risk] && current.score > best.score) ? current : best;
  }, null);

  // 4) If there is no recognized disease or emergency pattern, score only a few distinct generic symptoms.
  //    We intentionally do not count the number of matched disease definitions because generic symptoms such as "fever"
  //    appear in many conditions, making the previous logic artificially inflate the score.
  let genericScore = 0;
  const genericSignals: Array<{ keyword: string; score: number; level: AssessmentRiskLevel }> = [
    { keyword: 'severe fever', score: 28, level: 'medium' },
    { keyword: 'fever', score: 26, level: 'medium' },
    { keyword: 'chills', score: 18, level: 'medium' },
    { keyword: 'sweating', score: 16, level: 'medium' },
    { keyword: 'weakness', score: 18, level: 'medium' },
    { keyword: 'headache', score: 12, level: 'low' },
    { keyword: 'mild headache', score: 10, level: 'low' },
    { keyword: 'cough', score: 18, level: 'medium' },
    { keyword: 'body pain', score: 14, level: 'low' },
    { keyword: 'rash', score: 12, level: 'low' },
    { keyword: 'vomiting', score: 18, level: 'medium' },
    { keyword: 'abdominal pain', score: 18, level: 'medium' },
    { keyword: 'breathlessness', score: 24, level: 'medium' },
    { keyword: 'shortness of breath', score: 26, level: 'medium' },
    { keyword: 'dizziness', score: 14, level: 'low' },
    { keyword: 'fatigue', score: 14, level: 'low' },
  ];

  for (const signal of genericSignals) {
    if (normalized.includes(signal.keyword)) {
      genericScore += signal.score;
    }
  }

  if (strongestPattern) {
    const patternRiskLevel = strongestPattern.risk;
    const patternScore = clampScore(Math.max(strongestPattern.score, genericScore));
    return {
      riskLevel: patternRiskLevel,
      riskScore: patternScore,
      recommendation: strongestPattern.recommendation,
    };
  }

  if (genericScore >= 45) {
    return {
      riskLevel: 'medium',
      riskScore: clampScore(genericScore),
      recommendation: 'Risk pattern detected. A healthcare professional should review the symptoms and consider whether the patient needs further assessment or follow-up care.',
    };
  }

  if (genericScore > 0) {
    return {
      riskLevel: 'low',
      riskScore: clampScore(Math.max(genericScore, 15)),
      recommendation: 'Symptoms are present but not yet showing a strong emergency pattern. Professional evaluation is still recommended if the symptoms persist, worsen, or are accompanied by fever, breathing issues, confusion, or severe pain.',
    };
  }

  return {
    riskLevel: 'low',
    riskScore: 10,
    recommendation: 'No clear risk pattern was identified from the provided symptoms. A healthcare professional should review the patient history and current symptoms before making a risk judgment.',
  };
}
