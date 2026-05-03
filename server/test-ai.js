const API_KEY = "AIzaSyCov111zfskevIeA0p5GDHPc_n8sU-DJOk"; 

async function aflaModelele() {
  console.log("🔍 Întreb Google ce modele ai voie să folosești...");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();
    
    if (data.error) {
      console.log("❌ Eroare Google:", data.error.message);
      return;
    }

    console.log("\n✅ AI VOIE SĂ FOLOSEȘTI URMĂTOARELE MODELE:");
    // Extragem și afișăm doar numele modelelor
    data.models.forEach(model => {
       console.log(`- ${model.name.replace('models/', '')}`);
    });
    
  } catch (error) {
    console.log("❌ EROARE:", error.message);
  }
}

aflaModelele();