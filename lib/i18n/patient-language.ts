'use client';

import { createContext, createElement, useContext, useEffect, useState } from 'react';

export type PatientLanguage = 'en' | 'mr' | 'hi';
export type TranslationKey =

  | 'english'
  | 'marathi'
  | 'hindi'
  | 'language'
  | 'myAppointments'
  | 'bookAndView'
  | 'bookAppointment'
  | 'time'
  | 'symptoms'
  | 'analyzeSymptoms'
  | 'riskLevel'
  | 'confirmAppointment'
  | 'patientOnlyBooking'
  | 'appointmentBooked'
  | 'yourAppointment'
  | 'appointmentDetails'
  | 'appointmentList'
  | 'appointmentSaved'
  | 'appointmentWillBeSaved'
  | 'appointmentNotes'
  | 'doctor'
  | 'facility'
  | 'notAssigned'
  | 'searchAppointments'
  | 'allStatuses'
  | 'loadingAppointments'
  | 'noAppointments'
  | 'bookFirstAppointment'
  | 'bookAnAppointment'
  | 'dateAndTime'
  | 'whatSymptoms'
  | 'symptomInstructions'
  | 'symptomDisclaimer'
  | 'notes'
  | 'cancel'
  | 'reviewSymptoms'
  | 'confirmAndBook'
  | 'saving'
  | 'pleaseDescribeSymptoms'
  | 'profileMissing'
  | 'dateRequired'
  | 'low'
  | 'medium'
  | 'high'
  | 'emergency'
  | 'risk'
  | 'riskScore'
  | 'recommendation'
  | 'lowRecommendation'
  | 'mediumRecommendation'
  | 'highRecommendation'
  | 'emergencyRecommendation'
  | 'medicalDisclaimer'
  | 'appointmentBookedSuccess'
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'checkedIn'
  | 'inConsultation'
  | 'noShow'
  | 'unableLoadProfile'
  | 'unableLoadAppointments'
  | 'unableCreateAppointment'
  | 'unableSaveAssessment'
  | 'dashboard' | 'welcome' | 'appointments' | 'upcomingAppointments' | 'recentAppointments' | 'triage' | 'referrals' | 'followUps' | 'notifications' | 'healthRecords' | 'profile' | 'quickActions' | 'loading' | 'error' | 'empty' | 'tryAgain' | 'read' | 'unread' | 'search' | 'status' | 'priority' | 'date' | 'reason' | 'sourceFacility' | 'destinationFacility' | 'expectedVisit' | 'completedDate' | 'personalInformation' | 'dateOfBirth' | 'gender' | 'phone' | 'address' | 'district' | 'emergencyContact' | 'diagnosis' | 'bloodGroup' | 'allergies' | 'chronicConditions' | 'currentMedications';

const translations: Record<PatientLanguage, Record<TranslationKey, string>> = {
  en: {
    english: 'English', marathi: 'Marathi', hindi: 'Hindi', language: 'Language',
    myAppointments: 'My Appointments', bookAndView: 'Book and view your healthcare appointments.', bookAppointment: 'Book Appointment',
    appointmentBooked: 'Appointment booked', yourAppointment: 'Your Appointment', appointmentDetails: 'Appointment details', appointmentSaved: 'Your appointment will be saved to RuralCare Connect.', appointmentWillBeSaved: 'Your appointment will be saved to RuralCare Connect.', appointmentNotes: 'Reason or additional appointment notes...', unableLoadProfile: 'Unable to load your patient profile.', unableLoadAppointments: 'Unable to load appointments.', unableCreateAppointment: 'Unable to create appointment.', unableSaveAssessment: 'Unable to save symptom assessment.',
    doctor: 'Doctor', facility: 'Facility', time: 'Time', symptoms: 'Symptoms', analyzeSymptoms: 'Analyze Symptoms', riskLevel: 'Risk level', confirmAppointment: 'Confirm appointment', patientOnlyBooking: 'This page is available for patients only.', notAssigned: 'Not assigned', searchAppointments: 'Search your appointments...', allStatuses: 'All statuses', loadingAppointments: 'Loading appointments...', noAppointments: 'No appointments yet', bookFirstAppointment: 'Book your first appointment using the button above.', bookAnAppointment: 'Book an Appointment',
    dateAndTime: 'Appointment Date & Time', whatSymptoms: 'What are your symptoms?', symptomInstructions: 'Describe your symptoms. This helps prioritize your appointment and is not a diagnosis.', symptomDisclaimer: 'This information helps prioritize your appointment and is not a medical diagnosis.', notes: 'Notes', cancel: 'Cancel', reviewSymptoms: 'Review Symptoms', confirmAndBook: 'Confirm & Book Appointment', saving: 'Saving...',
    pleaseDescribeSymptoms: 'Please describe your symptoms before continuing.', profileMissing: 'Your patient profile could not be found.', dateRequired: 'Please select an appointment date and time.', low: 'Low', medium: 'Medium', high: 'High', emergency: 'Emergency', risk: 'Risk', riskScore: 'Risk score', recommendation: 'Recommendation',
    lowRecommendation: 'Your symptoms appear to be low risk.', mediumRecommendation: 'Your symptoms may need medical attention.', highRecommendation: 'Please consult a healthcare professional soon.', emergencyRecommendation: 'Please seek emergency medical care immediately.', medicalDisclaimer: 'This is not a medical diagnosis. Seek professional care, especially if symptoms worsen.', appointmentBookedSuccess: 'Appointment booked successfully. You will see the update in Notifications.', appointmentList: 'My Appointment List', scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled', checkedIn: 'Checked in', inConsultation: 'In consultation', noShow: 'No show', dashboard: 'Dashboard', welcome: 'Welcome', appointments: 'Appointments', upcomingAppointments: 'Upcoming appointments', recentAppointments: 'Recent appointments', triage: 'Triage', referrals: 'Referrals', followUps: 'Follow-ups', notifications: 'Notifications', healthRecords: 'Health records', profile: 'Profile', quickActions: 'Quick actions', loading: 'Loading...', error: 'Something went wrong.', empty: 'Nothing to show yet.', tryAgain: 'Try again', read: 'Read', unread: 'Unread', search: 'Search', status: 'Status', priority: 'Priority', date: 'Date', reason: 'Reason', sourceFacility: 'Source facility', destinationFacility: 'Destination facility', expectedVisit: 'Expected visit date', completedDate: 'Completed date', personalInformation: 'Personal information', dateOfBirth: 'Date of birth', gender: 'Gender', phone: 'Phone', address: 'Address', district: 'District', emergencyContact: 'Emergency contact', diagnosis: 'Diagnosis', bloodGroup: 'Blood group', allergies: 'Allergies', chronicConditions: 'Chronic conditions', currentMedications: 'Current medications',
  },
  mr: {
    english: 'इंग्रजी', marathi: 'मराठी', hindi: 'हिंदी', language: 'भाषा',
    myAppointments: 'माझ्या भेटी', bookAndView: 'तुमच्या आरोग्यसेवा भेटी बुक करा आणि पहा.', bookAppointment: 'भेट बुक करा', appointmentBooked: 'भेट बुक झाली', yourAppointment: 'तुमची भेट', appointmentDetails: 'भेटीची माहिती', appointmentSaved: 'तुमची भेट RuralCare Connect मध्ये जतन केली जाईल.', appointmentWillBeSaved: 'तुमची भेट RuralCare Connect मध्ये जतन केली जाईल.', appointmentNotes: 'कारण किंवा भेटीबद्दल अतिरिक्त माहिती...', unableLoadProfile: 'तुमचे रुग्ण प्रोफाइल लोड करता आले नाही.', unableLoadAppointments: 'भेटी लोड करता आल्या नाहीत.', unableCreateAppointment: 'भेट तयार करता आली नाही.', unableSaveAssessment: 'लक्षणांचे मूल्यांकन जतन करता आले नाही.',
    doctor: 'डॉक्टर', facility: 'आरोग्य केंद्र', time: 'वेळ', symptoms: 'लक्षणे', analyzeSymptoms: 'लक्षणांचे विश्लेषण करा', riskLevel: 'जोखीम पातळी', confirmAppointment: 'भेटीची पुष्टी करा', patientOnlyBooking: 'हे पृष्ठ फक्त रुग्णांसाठी आहे.', notAssigned: 'निवडलेले नाही', searchAppointments: 'तुमच्या भेटी शोधा...', allStatuses: 'सर्व स्थिती', loadingAppointments: 'भेटी लोड होत आहेत...', noAppointments: 'अद्याप कोणतीही भेट नाही', bookFirstAppointment: 'वरचे बटण वापरून तुमची पहिली भेट बुक करा.', bookAnAppointment: 'भेट बुक करा',
    dateAndTime: 'भेटीची तारीख आणि वेळ', whatSymptoms: 'तुम्हाला कोणती लक्षणे आहेत?', symptomInstructions: 'तुमची लक्षणे लिहा. यामुळे भेटीला प्राधान्य देण्यास मदत होते; ही निदानाची प्रक्रिया नाही.', symptomDisclaimer: 'ही माहिती भेटीला प्राधान्य देण्यासाठी आहे; हे वैद्यकीय निदान नाही.', notes: 'नोंदी', cancel: 'रद्द करा', reviewSymptoms: 'लक्षणे तपासा', confirmAndBook: 'पुष्टी करून भेट बुक करा', saving: 'जतन होत आहे...',
    pleaseDescribeSymptoms: 'पुढे जाण्यापूर्वी तुमची लक्षणे लिहा.', profileMissing: 'तुमचे रुग्ण प्रोफाइल सापडले नाही.', dateRequired: 'कृपया भेटीची तारीख आणि वेळ निवडा.', low: 'कमी', medium: 'मध्यम', high: 'जास्त', emergency: 'आपत्कालीन', risk: 'जोखीम', riskScore: 'जोखीम गुण', recommendation: 'शिफारस',
    lowRecommendation: 'तुमची लक्षणे कमी जोखमीची दिसत आहेत.', mediumRecommendation: 'तुमच्या लक्षणांकडे वैद्यकीय लक्ष देणे आवश्यक असू शकते.', highRecommendation: 'कृपया लवकरात लवकर आरोग्यसेवा तज्ज्ञांचा सल्ला घ्या.', emergencyRecommendation: 'कृपया त्वरित आपत्कालीन वैद्यकीय मदत घ्या.', medicalDisclaimer: 'ही वैद्यकीय निदानाची प्रक्रिया नाही. लक्षणे वाढल्यास व्यावसायिक वैद्यकीय मदत घ्या.', appointmentBookedSuccess: 'भेट यशस्वीपणे बुक झाली. सूचना विभागात अपडेट दिसेल.', appointmentList: 'माझ्या भेटींची यादी', scheduled: 'नियोजित', completed: 'पूर्ण', cancelled: 'रद्द', checkedIn: 'तपासणीसाठी नोंद झाली', inConsultation: 'सल्लामसलत सुरू', noShow: 'अनुपस्थित', dashboard: 'डॅशबोर्ड', welcome: 'स्वागत', appointments: 'भेटी', upcomingAppointments: 'आगामी भेटी', recentAppointments: 'अलीकडील भेटी', triage: 'लक्षण तपासणी', referrals: 'रेफरल्स', followUps: 'फॉलो-अप', notifications: 'सूचना', healthRecords: 'आरोग्य नोंदी', profile: 'प्रोफाइल', quickActions: 'जलद कृती', loading: 'लोड होत आहे...', error: 'काहीतरी चूक झाली.', empty: 'अजून माहिती उपलब्ध नाही.', tryAgain: 'पुन्हा प्रयत्न करा', read: 'वाचलेले', unread: 'न वाचलेले', search: 'शोधा', status: 'स्थिती', priority: 'प्राधान्य', date: 'तारीख', reason: 'कारण', sourceFacility: 'मूळ आरोग्य केंद्र', destinationFacility: 'गंतव्य आरोग्य केंद्र', expectedVisit: 'अपेक्षित भेटीची तारीख', completedDate: 'पूर्ण झाल्याची तारीख', personalInformation: 'वैयक्तिक माहिती', dateOfBirth: 'जन्मतारीख', gender: 'लिंग', phone: 'फोन', address: 'पत्ता', district: 'जिल्हा', emergencyContact: 'आपत्कालीन संपर्क', diagnosis: 'निदान', bloodGroup: 'रक्तगट', allergies: 'अॅलर्जी', chronicConditions: 'दीर्घकालीन आजार', currentMedications: 'सध्याची औषधे',
  },
  hi: {
    english: 'अंग्रेज़ी', marathi: 'मराठी', hindi: 'हिन्दी', language: 'भाषा',
    myAppointments: 'मेरी अपॉइंटमेंट', bookAndView: 'अपनी स्वास्थ्य अपॉइंटमेंट बुक करें और देखें।', bookAppointment: 'अपॉइंटमेंट बुक करें', appointmentBooked: 'अपॉइंटमेंट बुक हो गई', yourAppointment: 'आपकी अपॉइंटमेंट', appointmentDetails: 'अपॉइंटमेंट की जानकारी', appointmentSaved: 'आपकी अपॉइंटमेंट RuralCare Connect में सेव होगी।', appointmentWillBeSaved: 'आपकी अपॉइंटमेंट RuralCare Connect में सेव होगी।', appointmentNotes: 'कारण या अपॉइंटमेंट से जुड़ी अतिरिक्त जानकारी...', unableLoadProfile: 'आपका रोगी प्रोफाइल लोड नहीं हो सका।', unableLoadAppointments: 'अपॉइंटमेंट लोड नहीं हो सकीं।', unableCreateAppointment: 'अपॉइंटमेंट नहीं बन सकी।', unableSaveAssessment: 'लक्षणों का आकलन सेव नहीं हो सका।',
    doctor: 'डॉक्टर', facility: 'स्वास्थ्य केंद्र', time: 'समय', symptoms: 'लक्षण', analyzeSymptoms: 'लक्षणों का विश्लेषण करें', riskLevel: 'जोखिम स्तर', confirmAppointment: 'अपॉइंटमेंट की पुष्टि करें', patientOnlyBooking: 'यह पृष्ठ केवल रोगियों के लिए है।', notAssigned: 'चयनित नहीं', searchAppointments: 'अपनी अपॉइंटमेंट खोजें...', allStatuses: 'सभी स्थिति', loadingAppointments: 'अपॉइंटमेंट लोड हो रही हैं...', noAppointments: 'अभी कोई अपॉइंटमेंट नहीं', bookFirstAppointment: 'ऊपर दिए बटन से अपनी पहली अपॉइंटमेंट बुक करें।', bookAnAppointment: 'अपॉइंटमेंट बुक करें',
    dateAndTime: 'अपॉइंटमेंट की तारीख और समय', whatSymptoms: 'आपको क्या लक्षण हैं?', symptomInstructions: 'अपने लक्षण लिखें। इससे अपॉइंटमेंट को प्राथमिकता देने में मदद मिलेगी; यह निदान नहीं है।', symptomDisclaimer: 'यह जानकारी अपॉइंटमेंट को प्राथमिकता देने में मदद करती है और यह चिकित्सकीय निदान नहीं है।', notes: 'नोट्स', cancel: 'रद्द करें', reviewSymptoms: 'लक्षणों की समीक्षा करें', confirmAndBook: 'पुष्टि करें और अपॉइंटमेंट बुक करें', saving: 'सेव हो रहा है...',
    pleaseDescribeSymptoms: 'जारी रखने से पहले अपने लक्षण लिखें।', profileMissing: 'आपका रोगी प्रोफाइल नहीं मिला।', dateRequired: 'कृपया अपॉइंटमेंट की तारीख और समय चुनें।', low: 'कम', medium: 'मध्यम', high: 'अधिक', emergency: 'आपातकालीन', risk: 'जोखिम', riskScore: 'जोखिम स्कोर', recommendation: 'सलाह',
    lowRecommendation: 'आपके लक्षण कम जोखिम वाले दिखाई दे रहे हैं।', mediumRecommendation: 'आपके लक्षणों पर चिकित्सकीय ध्यान देने की आवश्यकता हो सकती है।', highRecommendation: 'कृपया जल्द से जल्द स्वास्थ्य सेवा विशेषज्ञ से सलाह लें।', emergencyRecommendation: 'कृपया तुरंत आपातकालीन चिकित्सा सहायता लें।', medicalDisclaimer: 'यह चिकित्सकीय निदान नहीं है। लक्षण बढ़ने पर पेशेवर चिकित्सा सहायता लें।', appointmentBookedSuccess: 'अपॉइंटमेंट सफलतापूर्वक बुक हो गई। अपडेट नोटिफिकेशन में दिखाई देगा।', appointmentList: 'मेरी अपॉइंटमेंट सूची', scheduled: 'निर्धारित', completed: 'पूर्ण', cancelled: 'रद्द', checkedIn: 'चेक-इन हो गया', inConsultation: 'परामर्श चल रहा है', noShow: 'अनुपस्थित', dashboard: 'डैशबोर्ड', welcome: 'स्वागत', appointments: 'अपॉइंटमेंट', upcomingAppointments: 'आगामी अपॉइंटमेंट', recentAppointments: 'हाल की अपॉइंटमेंट', triage: 'लक्षण जांच', referrals: 'रेफरल', followUps: 'फॉलो-अप', notifications: 'सूचनाएं', healthRecords: 'स्वास्थ्य रिकॉर्ड', profile: 'प्रोफाइल', quickActions: 'त्वरित कार्य', loading: 'लोड हो रहा है...', error: 'कुछ गलत हुआ।', empty: 'अभी कुछ दिखाने के लिए नहीं है।', tryAgain: 'फिर कोशिश करें', read: 'पढ़ा हुआ', unread: 'अपठित', search: 'खोजें', status: 'स्थिति', priority: 'प्राथमिकता', date: 'तारीख', reason: 'कारण', sourceFacility: 'स्रोत स्वास्थ्य केंद्र', destinationFacility: 'गंतव्य स्वास्थ्य केंद्र', expectedVisit: 'अपेक्षित मुलाकात की तारीख', completedDate: 'पूरा होने की तारीख', personalInformation: 'व्यक्तिगत जानकारी', dateOfBirth: 'जन्मतिथि', gender: 'लिंग', phone: 'फोन', address: 'पता', district: 'जिला', emergencyContact: 'आपातकालीन संपर्क', diagnosis: 'निदान', bloodGroup: 'रक्त समूह', allergies: 'एलर्जी', chronicConditions: 'पुरानी बीमारियां', currentMedications: 'वर्तमान दवाएं',
  },
};

const STORAGE_KEY = 'ruralcare-patient-language';

type PatientLanguageContextValue = {
  language: PatientLanguage;
  setLanguage: (language: PatientLanguage) => void;
  t: (key: TranslationKey) => string;
};

const PatientLanguageContext = createContext<PatientLanguageContextValue | null>(null);

export function PatientLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<PatientLanguage>('en');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'mr' || stored === 'hi') setLanguageState(stored);
  }, []);

  const setLanguage = (nextLanguage: PatientLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  return createElement(
    PatientLanguageContext.Provider,
    { value: { language, setLanguage, t: (key) => translations[language][key] } },
    children
  );
}

export function usePatientLanguage() {
  const context = useContext(PatientLanguageContext);
  if (context) return context;

  const [language, setLanguageState] = useState<PatientLanguage>('en');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'mr' || stored === 'hi') {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (nextLanguage: PatientLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  return {
    language,
    setLanguage,
    t: (key: TranslationKey) => translations[language][key],
  };
}
