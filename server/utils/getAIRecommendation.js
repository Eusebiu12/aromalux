import { GoogleGenerativeAI } from "@google/generative-ai";


export async function getAIRecommendation(req, res, userPrompt, products) {
  const API_KEY = process.env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    console.error("EROARE: GEMINI_API_KEY nu este definită în fișierul .env");
    return { success: false, products: [] };
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  
 
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
   
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

  
    const result = await model.generateContent(geminiPrompt);
    let aiText = result.response.text();
    
    
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(aiText);
    const recommendedIds = parsedData.products || [];

    
    const matchingProducts = products.filter(p => 
        recommendedIds.some(aiId => String(aiId) === String(p.id))
    );

    return { success: true, products: matchingProducts };

  } catch (error) {
    console.error("AI Recommendation System Error:", error.message);
    return { success: false, products: [] };
  }
}