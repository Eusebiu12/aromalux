import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

// Importuri Componente
import HeroSlider from "../components/Home/HeroSlider";
import CategoryGrid from "../components/Home/CategoryGrid";
import ProductSlider from "../components/Home/ProductSlider";
import FeatureSection from "../components/Home/FeatureSection";
import NewsletterSection from "../components/Home/NewsletterSection";

// Importuri Redux
import { fetchAllProducts } from "../store/slices/productSlice";

const Index = () => {
  const dispatch = useDispatch();
  
  // State-uri pentru căutarea AI
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Datele din Redux pentru restul paginii
  const { topRatedProducts, newProducts } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchAllProducts({}));
  }, [dispatch]);

  // Funcția care apelează Backend-ul (Port 4000)
  const handleAISearch = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setLoadingAi(true);
    setHasSearched(true);
    
    try {
      // MODIFICARE AICI: Verifică pluralul 'products' și scoate slash-ul de la final
      const { data } = await axios.post(
  "http://localhost:4000/api/v1/products/ai-search", // Trebuie să aibă 's' la final
  { userPrompt: aiQuery },
  { withCredentials: true }
);

      if (data.success) {
        setAiResults(data.products);
      }
    } catch (error) {
      console.error("AI Search Error:", error.response?.status || error.message);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Banner Principal */}
      <HeroSlider />
      
      <div className="container mx-auto px-4 pt-10">
        
        {/* 2. Secțiunea de Căutare AI (Adăugată acum) */}
        <div className="bg-orange-50 p-8 rounded-2xl shadow-sm mb-12 border border-orange-100">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-serif mb-2 text-orange-900">Găsește lumânarea perfectă cu AI</h2>
            <p className="text-orange-700/80 mb-6">
              Spune-ne cum te simți sau ce ambianță vrei să creezi.
            </p>
            
            <form onSubmit={handleAISearch} className="flex flex-col md:flex-row gap-3">
              <input 
                type="text"
                className="flex-1 p-4 rounded-xl border-2 border-orange-200 focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="Ex: Ceva dulce care să miroasă a prăjituri de Crăciun..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
              />
              <button 
                type="submit"
                disabled={loadingAi}
                className="bg-orange-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-orange-700 transition-all disabled:bg-orange-300"
              >
                {loadingAi ? "AI-ul analizează..." : "Caută cu AI"}
              </button>
            </form>
          </div>
        </div>

        {/* 3. Rezultate AI (Apar doar dacă se face o căutare) */}
        {hasSearched && (
          <div className="mb-16 animate-fade-in">
            {aiResults.length > 0 ? (
              <ProductSlider title="Recomandări Inteligente pentru tine" products={aiResults} />
            ) : (
              !loadingAi && (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">AI-ul nu a găsit potriviri exacte, dar iată colecția noastră:</p>
                </div>
              )
            )}
            <hr className="mt-12 border-gray-100" />
          </div>
        )}

        {/* 4. Categorii */}
        <CategoryGrid />

        {/* 5. Noutăți (Produse noi) */}
        {newProducts && newProducts.length > 0 && (
          <div className="mt-16">
            <ProductSlider title="New Arrivals" products={newProducts} />
          </div>
        )}

        {/* 6. Top Rated (Produse populare) */}
        {topRatedProducts && topRatedProducts.length > 0 && (
          <div className="mt-16">
            <ProductSlider title="Top Rated Products" products={topRatedProducts} />
          </div>
        )}

        {/* 7. Secțiuni de Branding și Newsletter */}
        <FeatureSection />
        <NewsletterSection />
      </div>
    </div>
  );
};

export default Index;