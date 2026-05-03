import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Utilitar pentru filtrarea semantică a produselor folosind SDK-ul oficial Google Gemini.
 */
export async function getAIRecommendation(req, res, userPrompt, products) {
  const API_KEY = process.env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    console.error("EROARE: GEMINI_API_KEY nu este definită în fișierul .env");
    return { success: false, products: [] };
  }

  // Inițializăm asistentul folosind librăria oficială
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  // Magic! Aici folosim un model EXACT din lista ta validă:
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    // Trimitem doar datele esențiale ca să se miște rapid
    const minimizedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category
    }));

    const geminiPrompt = `
      Ești un asistent virtual expert pentru magazinul de lumânări artizanale AromaLux.
      
      PRODUSE DISPONIBILE: 
      ${JSON.stringify(minimizedProducts)}

      CERERE CLIENT: "${userPrompt}"

      SARCINA TA:
      1. Analizează intenția clientului.
      2. Identifică ID-urile produselor care se potrivesc cel mai bine.
      3. Returnează STRICT un obiect JSON de forma: {"products": [id1, id2]}
      4. NU folosi formatare markdown (fără \`\`\`json). Returnează DOAR textul brut JSON.
    `;

    // Cerem rezultatul de la AI
    const result = await model.generateContent(geminiPrompt);
    let aiText = result.response.text();
    
    // Curățăm textul ca să fim siguri că este JSON valid
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(aiText);
    const recommendedIds = parsedData.products || [];

    // Găsim produsele din baza ta de date pe baza ID-urilor date de AI
    const matchingProducts = products.filter(p => 
        recommendedIds.some(aiId => String(aiId) === String(p.id))
    );

    return { success: true, products: matchingProducts };

  } catch (error) {
    console.error("AI Recommendation System Error:", error.message);
    return { success: false, products: [] };
  }
}