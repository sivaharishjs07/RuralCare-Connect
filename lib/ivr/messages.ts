export type IvrLanguage = 'en' | 'hi' | 'mr';

export const ivrMessages: Record<IvrLanguage, Record<string, string>> = {
  en: {
    languageMenu: 'Press 1 for English. Press 2 for Hindi. Press 3 for Marathi.',
    mainMenu: 'Press 1 to book an appointment. Press 2 to check appointment status. Press 3 for healthcare information. Press 9 to repeat this menu. Press 0 to end the call.',
    bookIntro: 'To book an appointment, enter your registered phone number followed by the hash key.',
    askDate: 'Enter your preferred appointment date as eight digits: day, month, and year.',
    statusIntro: 'To check appointment status, enter your registered phone number followed by the hash key.',
    informationMenu: 'Press 1 for general health guidance. Press 2 for medication reminders. Press 3 for emergency guidance.',
    generalHealth: 'Drink safe water, eat balanced meals, wash your hands, and contact a healthcare professional when symptoms persist.',
    medication: 'Take medicines only as prescribed. Do not share medicines. Contact your healthcare professional if you have concerns.',
    emergency: 'For an emergency, contact local emergency services or go to the nearest healthcare facility immediately.',
    invalidInput: 'That input was not recognised. Please try again.',
    patientNotFound: 'We could not find a patient with that registered phone number.',
    serviceUnavailable: 'The appointment service is temporarily unavailable. Please try again later or contact your healthcare facility.',
    appointmentCreated: 'Your appointment has been booked successfully.',
    noAppointments: 'No appointments were found for this phone number.',
  },
  hi: {
    languageMenu: 'अंग्रेजी के लिए 1 दबाएं। हिंदी के लिए 2 दबाएं। मराठी के लिए 3 दबाएं।',
    mainMenu: 'अपॉइंटमेंट बुक करने के लिए 1 दबाएं। स्थिति जानने के लिए 2 दबाएं। स्वास्थ्य जानकारी के लिए 3 दबाएं। मेनू दोहराने के लिए 9 दबाएं। कॉल समाप्त करने के लिए 0 दबाएं।',
    bookIntro: 'अपॉइंटमेंट बुक करने के लिए अपना पंजीकृत फोन नंबर और फिर हैश कुंजी दबाएं।',
    askDate: 'अपनी पसंदीदा तारीख आठ अंकों में दर्ज करें: दिन, महीना और वर्ष।',
    statusIntro: 'स्थिति जानने के लिए अपना पंजीकृत फोन नंबर और फिर हैश कुंजी दबाएं।',
    informationMenu: 'सामान्य स्वास्थ्य सलाह के लिए 1 दबाएं। दवा अनुस्मारक के लिए 2 दबाएं। आपातकालीन मार्गदर्शन के लिए 3 दबाएं।',
    generalHealth: 'साफ पानी पिएं, संतुलित भोजन करें, हाथ धोएं और लक्षण बने रहने पर स्वास्थ्यकर्मी से संपर्क करें।',
    medication: 'दवाएं केवल डॉक्टर की सलाह के अनुसार लें। दवाएं साझा न करें। चिंता होने पर स्वास्थ्यकर्मी से संपर्क करें।',
    emergency: 'आपातकाल में स्थानीय आपातकालीन सेवा से संपर्क करें या तुरंत निकटतम स्वास्थ्य केंद्र जाएं।',
    invalidInput: 'इनपुट पहचाना नहीं गया। कृपया फिर कोशिश करें।',
    patientNotFound: 'इस पंजीकृत फोन नंबर से कोई मरीज नहीं मिला।',
    serviceUnavailable: 'अपॉइंटमेंट सेवा अभी उपलब्ध नहीं है। बाद में प्रयास करें या अपने स्वास्थ्य केंद्र से संपर्क करें।',
    appointmentCreated: 'आपका अपॉइंटमेंट सफलतापूर्वक बुक हो गया है।',
    noAppointments: 'इस फोन नंबर के लिए कोई अपॉइंटमेंट नहीं मिला।',
  },
  mr: {
    languageMenu: 'इंग्रजीसाठी 1 दाबा. हिंदीसाठी 2 दाबा. मराठीसाठी 3 दाबा.',
    mainMenu: 'भेट बुक करण्यासाठी 1 दाबा. भेटीची स्थिती जाणून घेण्यासाठी 2 दाबा. आरोग्य माहितीसाठी 3 दाबा. मेनू पुन्हा ऐकण्यासाठी 9 दाबा. कॉल संपवण्यासाठी 0 दाबा.',
    bookIntro: 'भेट बुक करण्यासाठी तुमचा नोंदणीकृत फोन नंबर आणि त्यानंतर हॅश दाबा.',
    askDate: 'तुमची पसंतीची तारीख आठ अंकांत द्या: दिवस, महिना आणि वर्ष.',
    statusIntro: 'स्थिती जाणून घेण्यासाठी तुमचा नोंदणीकृत फोन नंबर आणि त्यानंतर हॅश दाबा.',
    informationMenu: 'सामान्य आरोग्य मार्गदर्शनासाठी 1 दाबा. औषधांच्या आठवणीसाठी 2 दाबा. आपत्कालीन मार्गदर्शनासाठी 3 दाबा.',
    generalHealth: 'स्वच्छ पाणी प्या, संतुलित आहार घ्या, हात धुवा आणि लक्षणे राहिल्यास आरोग्य कर्मचाऱ्यांशी संपर्क साधा.',
    medication: 'औषधे फक्त डॉक्टरांच्या सल्ल्याने घ्या. औषधे इतरांसोबत वाटू नका. चिंता असल्यास आरोग्य कर्मचाऱ्यांशी संपर्क साधा.',
    emergency: 'आपत्कालीन परिस्थितीत स्थानिक आपत्कालीन सेवांशी संपर्क साधा किंवा जवळच्या आरोग्य केंद्रात त्वरित जा.',
    invalidInput: 'इनपुट ओळखता आले नाही. कृपया पुन्हा प्रयत्न करा.',
    patientNotFound: 'या नोंदणीकृत फोन नंबरचा रुग्ण सापडला नाही.',
    serviceUnavailable: 'भेट सेवा सध्या उपलब्ध नाही. नंतर पुन्हा प्रयत्न करा किंवा आरोग्य केंद्राशी संपर्क साधा.',
    appointmentCreated: 'तुमची भेट यशस्वीपणे बुक झाली आहे.',
    noAppointments: 'या फोन नंबरसाठी कोणत्याही भेटी सापडल्या नाहीत.',
  },
};

export function getIvrLanguage(value: unknown): IvrLanguage {
  return value === 'hi' || value === 'mr' ? value : 'en';
}

export function getIvrMessage(language: IvrLanguage, key: string) {
  return ivrMessages[language][key] ?? ivrMessages.en.invalidInput;
}
