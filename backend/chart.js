import translate from '@iamtraction/google-translate';

// ---------- Sample Data ----------
const stations = [
  { stationCode: "001", stationName: "Dhond", dataTime: "2025-09-10", dataValue: 5.2, unit: "m" },
  { stationCode: "002", stationName: "Pune", dataTime: "2025-09-11", dataValue: 3.8, unit: "m" },
  { stationCode: "003", stationName: "Delhi", dataTime: "2025-09-12", dataValue: 7.1, unit: "m" }
];

// ---------- Chatbot Logic ----------
async function chatbotResponse(userText) {
  try {
    // Step 1: Detect language & translate input to English
    const transIn = await translate(userText, { to: 'en' });
    const translatedText = transIn.text.toLowerCase();
    const detectedLang = transIn.from.language.iso;

    // Step 2: Find station in English text
    let response = "Sorry, I didn't understand your question.";
    for (let row of stations) {
      if (translatedText.includes(row.stationName.toLowerCase())) {
        response = `Water level at ${row.stationName} is ${row.dataValue} ${row.unit} (measured on ${row.dataTime}).`;
        break;
      }
    }

    // Step 3: Translate response back to user's original language
    const transOut = await translate(response, { to: detectedLang });
    return transOut.text;
  } catch (err) {
    console.error("❌ Error details:", err);
    return "⚠ Error in translation or chatbot logic.";
  }
}

// ---------- Auto Run with Multiple Languages ----------
async function runDemo() {
  console.log("🌍 INGRES Multilingual Chatbot Demo (Node.js)\n");

  const queries = [
    "पुणे में पानी का स्तर क्या है?",           // Hindi
    "What is the water level at Delhi?",      // English
    "¿Cuál es el nivel de agua en Dhond?",   // Spanish
    "पुण्यातील पाण्याची पातळी काय आहे?",        // Marathi
    "டெல்லியில் தண்ணீரின் அளவு என்ன?",          // Tamil
    "Quel est le niveau d'eau à Pune ?"      // French
  ];

  for (let q of queries) {
    const reply = await chatbotResponse(q);
    console.log(`👤 User: ${q}`);
    console.log(`🤖 Bot: ${reply}\n`);
  }
}

runDemo();
