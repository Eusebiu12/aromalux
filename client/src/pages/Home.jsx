import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import HeroSlider from "../components/Home/HeroSlider";
import CategoryGrid from "../components/Home/CategoryGrid";
import ProductSlider from "../components/Home/ProductSlider";
import FeatureSection from "../components/Home/FeatureSection";
import NewsletterSection from "../components/Home/NewsletterSection";
import { fetchAllProducts } from "../store/slices/productSlice";

const Index = () => {
  const dispatch = useDispatch();

  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { topRatedProducts, newProducts } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchAllProducts({}));
  }, [dispatch]);

  const handleAISearch = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setLoadingAi(true);
    setHasSearched(true);
    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/products/ai-search",
        { userPrompt: aiQuery },
        { withCredentials: true }
      );
      if (data.success) setAiResults(data.products);
    } catch (error) {
      console.error("AI Search Error:", error.response?.status || error.message);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    
    <div className="min-h-screen bg-background">

      <HeroSlider />

      <div className="container mx-auto px-4 pt-10">

        
        <div className="glass-panel mb-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-serif mb-2 text-foreground">
              Găsește lumânarea perfectă cu AI
            </h2>
            <p className="text-muted-foreground mb-6">
              Spune-ne cum te simți sau ce ambianță vrei să creezi.
            </p>

            <form onSubmit={handleAISearch} className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                className="flex-1 p-4 rounded-xl border border-border bg-input text-foreground
                           focus:outline-none focus:ring-2 focus:ring-ring transition-colors
                           placeholder:text-muted-foreground"
                placeholder="Ex: Ceva dulce care să miroasă a prăjituri de Crăciun..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={loadingAi}
                className="gradient-primary text-primary-foreground font-bold px-8 py-4
                           rounded-xl hover:glow-on-hover animate-smooth
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingAi ? "AI-ul analizează..." : "Caută cu AI"}
              </button>
            </form>
          </div>
        </div>

        {hasSearched && (
          <div className="mb-16 animate-fade-in">
            {aiResults.length > 0 ? (
              <ProductSlider title="Recomandări Inteligente pentru tine" products={aiResults} />
            ) : (
              !loadingAi && (
                <div className="text-center py-10 glass-panel">
                  <p className="text-muted-foreground">
                    AI-ul nu a găsit potriviri exacte, dar iată colecția noastră:
                  </p>
                </div>
              )
            )}
            <hr className="mt-12 border-border" />
          </div>
        )}

        <CategoryGrid />

        {newProducts && newProducts.length > 0 && (
          <div className="mt-16">
            <ProductSlider title="New Arrivals" products={newProducts} />
          </div>
        )}

        {topRatedProducts && topRatedProducts.length > 0 && (
          <div className="mt-16">
            <ProductSlider title="Top Rated Products" products={topRatedProducts} />
          </div>
        )}

        <FeatureSection />
        <NewsletterSection />
      </div>
    </div>
  );
};

export default Index;