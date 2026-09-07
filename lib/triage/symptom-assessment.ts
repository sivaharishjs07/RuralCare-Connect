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

export function assessSymptoms(symptoms: string): SymptomAssessmentResult {
  const normalized = symptoms.toLowerCase().trim();
  const matches = conditionDataset.filter((condition) =>
    condition.keywords.some((keyword) => normalized.includes(keyword))
  );
  const riskLevel = matches.reduce<AssessmentRiskLevel>(
    (highest, condition) =>
      riskWeight[condition.risk] > riskWeight[highest] ? condition.risk : highest,
    'low'
  );
  const riskScore = matches.length === 0
    ? 10
    : riskLevel === 'emergency'
      ? 100
      : Math.min(95, riskWeight[riskLevel] + Math.max(0, matches.length - 1) * 5);
  const recommendation = riskLevel === 'emergency'
    ? 'Emergency warning: seek emergency medical care immediately. This symptom pattern requires urgent professional assessment.'
    : riskLevel === 'high'
      ? 'Symptoms may require prompt professional attention. Contact a healthcare professional as soon as possible.'
      : riskLevel === 'medium'
        ? 'Possible risk pattern detected. Arrange a professional medical assessment and monitor for worsening symptoms.'
        : 'Possible low-risk pattern detected. Rest, monitor your symptoms, and seek professional care if they persist or worsen.';

  return { riskLevel, riskScore, recommendation };
}
