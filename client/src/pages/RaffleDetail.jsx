import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, Share2, Heart, Frown, Clock, Calendar, Ticket } from "lucide-react"; 
import { useDispatch, useSelector } from "react-redux";
import { fetchRaffleDetails } from "../store/slices/raffleSlice";
import { toast } from "react-toastify";

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString("ro-RO", options);
};

const RaffleDetail = () => {
    const { raffleId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const { raffle, loading } = useSelector((state) => state.raffle);
    const [fetchError, setFetchError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState("description");

    // LOGICA DE PRELUARE A DATELOR
    useEffect(() => {
        if (!raffleId || raffleId === 'undefined') {
            setFetchError("ID-ul tombolei lipsește. Vă rugăm să verificați URL-ul.");
            return; 
        }
        setFetchError(null);
        
        dispatch(fetchRaffleDetails(raffleId))
            .unwrap()
            .catch((error) => {
                const errorMessage = error.message || "A apărut o eroare necunoscută.";
                setFetchError(errorMessage);
                toast.error(
                    errorMessage.includes("404") 
                    ? "Tombola nu a fost găsită." 
                    : `Eroare server: ${errorMessage}`
                );
            });

    }, [dispatch, raffleId]); 

    // HANDLERE PENTRU ACȚIUNI
    const handleCopyURL = () => {
        const currentURL = window.location.href;
        navigator.clipboard.writeText(currentURL)
            .then(() => toast.success("URL copiat!"))
            .catch((err) => console.error("Failed to copy:", err));
    };

    const handleBuyProduct = () => {
        if (raffle.product_id) {
            navigate(`/product/${raffle.product_id}`);
        } else {
            toast.info("Această tombolă nu are un produs direct asociat pentru cumpărare.");
        }
    };

    // CALCUL DATE & PROGRES
    const ticketsIssued = raffle?.tickets_issued || 0;
    const maxTickets = raffle?.max_tickets || 1;
    const progressPercentage = Math.min(100, Math.floor((ticketsIssued / maxTickets) * 100));
    const hasAssociatedProduct = !!raffle?.product_id;

    // RENDERAREA STĂRILOR (Loading / Error)
    if (loading) {
        return ( 
            <div className="flex items-center justify-center h-screen"> 
                <Loader className="w-10 h-10 animate-spin text-primary" /> 
            </div>
        );
    }

    if (fetchError || !raffle) {
        const displayMessage = fetchError || "Tombola nu a fost găsită (Verificați ID-ul).";
        return (
            <div className="min-h-screen pt-20 flex flex-col items-center justify-center text-center">
                <Frown className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Oops! Ceva nu a mers bine.</h2>
                <p className="text-muted-foreground mb-6">{displayMessage}</p>
                <button
                    onClick={() => navigate("/raffles")}
                    className="bg-primary text-white px-6 py-3 rounded-lg shadow-md hover:bg-opacity-90 transition"
                >
                    Înapoi la Lista de Tombole
                </button>
            </div>
        );
    }
    
    // RENDERAREA DATELOR (Succes)
    return ( 
        <div className="min-h-screen pt-20"> 
            <div className="container mx-auto px-4 py-8"> 
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    {/* Images */} 
                    <div> 
                        <div className="glass-card p-4 mb-4">
                            {raffle.images && raffle.images[selectedImage] ? ( 
                                <img
                                    src={raffle.images[selectedImage].url}
                                    alt={raffle.title}
                                    className="w-full h-96 object-contain rounded-lg"
                                />
                            ) : ( 
                                <div className="glass-card min-h-[418px] flex items-center justify-center text-muted-foreground">
                                    Imagine indisponibilă
                                </div>
                            )} 
                        </div> 
                        <div className="flex space-x-2">
                            {raffle.images && raffle.images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                        selectedImage === index ? "border-primary" : "border-transparent hover:border-muted"
                                    }`}
                                >
                                    <img
                                        src={img.url}
                                        alt={`${raffle.title} ${index + 1}`}
                                        className="w-full h-full object-contain"
                                    /> 
                                </button>
                            ))} 
                        </div> 
                    </div>

                    {/* Raffle Details */}
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-4">{raffle.title}</h1>
                        
                        {/* Detalii Produs Asociat */}
                        <div className="mb-4">
                            {raffle.product_name && (
                                <span className="text-muted-foreground font-semibold">
                                    Produs: {raffle.product_name}
                                </span>
                            )}
                        </div>
                        
                        {/* Acțiuni (Buton Cumpără) */}
                        <div className="flex items-center space-x-4 mb-4"> 
                            
                            {/* Buton Cumpără Produs (Dinamic) */}
                            <button 
                                onClick={handleBuyProduct}
                                disabled={!hasAssociatedProduct}
                                className={`px-6 py-3 rounded-lg font-bold transition shadow-lg 
                                    ${hasAssociatedProduct 
                                        ? 'bg-primary text-white hover:bg-primary/90' 
                                        : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    }`}
                            >
                                {hasAssociatedProduct 
                                    ? `Cumpără produsul: ${raffle.product_name}` 
                                    : `Fără produs asociat`
                                }
                            </button>

                            {/* Wishlist & Share */}
                            <button
                                className="flex items-center space-x-2 text-muted-foreground hover:text-red-500 transition"
                                onClick={() => toast.info("Adăugat la lista de dorințe!")}
                            >
                                <Heart className="w-5 h-5" />
                                <span>Wishlist</span>
                            </button>
                            <button
                                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition"
                                onClick={handleCopyURL}
                            >
                                <Share2 className="w-5 h-5" />
                                <span>Distribuie</span>
                            </button>
                        </div>

                        <div className="glass-panel p-6 mt-6 border border-border rounded-lg">
                            <h3 className="text-xl font-bold text-foreground mb-4">Progres și Detalii Tombolă</h3>

                            <div className="flex flex-col gap-6">
                                
                                <div className="w-full">
                                    <span className="text-sm font-medium text-foreground mb-2 block">
                                        {ticketsIssued} bilete vândute din {maxTickets}
                                    </span>
                                    <div className="w-full bg-muted h-3 rounded-lg overflow-hidden shadow-inner">
                                        <div
                                            className="h-full rounded-lg bg-primary transition-all duration-500 ease-out"
                                            style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-2 block">
                                        Progres: {progressPercentage}%
                                    </span>
                                </div>
                                
                                {/* 2. GRILA CU DETALII CHEIE */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    
                                    {/*Bilete Max */}
                                    <div className="flex items-center gap-3 bg-accent/50 p-3 rounded-lg">
                                        <Ticket className="w-5 h-5 text-primary flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Bilete Max</p>
                                            <p className="text-lg font-bold text-foreground">{maxTickets}</p>
                                        </div>
                                    </div>

                                    {/* Data Început */}
                                    <div className="flex items-center gap-3 bg-accent/50 p-3 rounded-lg">
                                        <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Început</p>
                                            <p className="text-sm font-bold text-foreground">{formatDate(raffle.start_date)}</p>
                                        </div>
                                    </div>

                                    {/*Data Final */}
                                    <div className="flex items-center gap-3 bg-accent/50 p-3 rounded-lg">
                                        <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Termen Limită</p>
                                            <p className="text-sm font-bold text-foreground">{formatDate(raffle.end_date)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div> {/* End Raffle Details column */}
                </div>

                {/* Tabs */}
                <div className="glass-panel">
                    <div className="flex border-b border-[hsla(var(--glass-border))]">
                        {["description"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-4 font-medium capitalize transition-all ${
                                    activeTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="p-6">
                        {activeTab === "description" && (
                            <div>
                                <h3 className="text-xl font-semibold text-foreground mb-4">Descriere Tombolă</h3>
                                <p className="text-muted-foreground">{raffle.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RaffleDetail;