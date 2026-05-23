import { useState, useEffect } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadStripe } from "@stripe/stripe-js";
import { placeOrder } from "../store/slices/orderSlice";

const STRIPE_PK = "pk_test_51SSxGWQqkq6ox4sNePXhCqY8XtPhtdw2sBtGT2H83aDBBaxrQMVVhxR9wYrUVw04WwR4safAAba6y9YX2jCTyiRK00P1LCNfbI";

const Payment = () => {
    
    const [stripePromise, setStripePromise] = useState(null); 
    const [isLoading, setIsLoading] = useState(false); 
    
    const { authUser } = useSelector((state) => state.auth);
    const navigateTo = useNavigate();
    const dispatch = useDispatch();

    const { cart } = useSelector((state) => state.cart);
    const { orderStep, sessionId } = useSelector((state) => state.order); 
    
    const [shippingDetails, setShippingDetails] = useState({
        fullName: "",
        state: "Timiș",
        phone: "",
        address: "",
        city: "",
        zipCode: "",
        country: "Romania"
    });

    const handleDetailChange = (field, value) => {
        setShippingDetails(prev => ({
            ...prev,
            [field]: value
        }));
    };

    useEffect(() => {
        if (!authUser) {
            navigateTo("/products");
        }
    }, [authUser, navigateTo]);

    // 1. Inițializare Stripe.js
    useEffect(() => {
        loadStripe(STRIPE_PK)
            .then(stripe => setStripePromise(stripe))
            .catch(err => console.error("Stripe Load Error:", err));
    }, []);

   
    useEffect(() => {
        if (sessionId && stripePromise) {
            stripePromise.redirectToCheckout({ sessionId: sessionId });
        }
    }, [sessionId, stripePromise]); 

  
    let total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    let shippingPrice = 0;
    if (total < 120 && total > 0) {
        shippingPrice = 30; 
    }
    total = total + shippingPrice;

    
    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        
        if (!shippingDetails.fullName || !shippingDetails.address || !shippingDetails.phone || !shippingDetails.city || !shippingDetails.zipCode) {
             alert("Please fill in all required shipping details.");
             return;
        }

        setIsLoading(true);
        
        const formData = new FormData();
        formData.append("full_name", shippingDetails.fullName);
        formData.append("state", shippingDetails.state);
        formData.append("city", shippingDetails.city);
        formData.append("country", shippingDetails.country);
        formData.append("address", shippingDetails.address);
        formData.append("pincode", shippingDetails.zipCode);
        formData.append("phone", shippingDetails.phone);
        formData.append("orderedItems", JSON.stringify(cart));

        await dispatch(placeOrder(formData));
        
        setIsLoading(false);
    };

    if(cart.length === 0) {
        return(
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="text-center glass-panel max-w-md">
                    <h1 className="text-3xl font-bold text-foreground mb-4">No Items in Cart.</h1>
                    <p className="text-muted-foreground mb-8">
                        Add some items to your cart before processing to checkout.</p>
                    <Link to={"/products"} className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg text-primary-foreground
                        gradient-primary hover:glow-on-hover animate-smooth font-semibold">
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    return <>
    
    <div className="min-h-screen pt-20">
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* HEADER */}
                <div className="flex items-center space-x-4 mb-8">
                    <Link to={"/cart"} className="p-2 glass-card hover:glow-on-hover animate-smooth">
                    <ArrowLeft className="w-5 h-5 text-primary">
                    </ArrowLeft>
                    </Link>
                </div>
                {/* PROGRESS STEPS */}
            <div className="flex items-center justify-center mb-12">
                <div className="flex items-center space-x-4">
                    {/* STEP 1 */}
                    <div className={`flex items-center space-x-2 ${orderStep >= 1 
                    ? "text-primary" 
                    : "text-muted-foreground" }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            orderStep >= 1 
                            ? "gradient-primary text-primary-foreground"
                            : "bg-secondary"
                        }`}>
                            {orderStep > 1 ? <Check className="w-5 h-5" /> : "1"}
                        </div>
                        <span className="font-medium">Details</span>
                    </div>
                    <div className={`w-12 h-0 ${orderStep >= 2 
                    ? "bg-primary"
                    : "bg-border"}`}/>
                        { /* STEP 2 */}
                        <div className={`flex items-center space-x-2 ${orderStep >= 2 
                    ? "text-primary" 
                    : "text-muted-foreground" }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            orderStep >= 2 
                            ? "gradient-primary text-primary-foreground"
                            : "bg-secondary"
                        }`}>
                            2
                            </div>
                            <span className="font-medium">Payment</span>
                        </div>

                    </div>
                </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        <div className="lg:col-span-2">
                            {
                                orderStep === 1 ? (
                                    
                                    <form onSubmit={handlePlaceOrder} className="glass-panel">
                                        <h2 className="text-xl font-semibold text-foreground mb-6">
                                            Shipping Information
                                        </h2>
                                        <div className="mb-6">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                    Full Name *
                                                    </label>
                                                    <input type="text" required 
                                                    value={shippingDetails.fullName}
                                                    onChange={(e) => handleDetailChange('fullName', e.target.value)}
                                                    className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground"
                                                    />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                    State (Județ) *
                                                </label>
                                                <select
                                                    required
                                                    value={shippingDetails.state}
                                                    onChange={(e) => handleDetailChange('state', e.target.value)}
                                                    className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground"
                                                >
                                                    <option value="București">București</option>
                                                    <option value="Alba">Alba</option>
                                                    <option value="Arad">Arad</option>
                                                    <option value="Arges">Arges</option>
                                                    <option value="Timiș">Timiș</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                    Phone *
                                                </label>
                                                <input type="tel" required 
                                                value={shippingDetails.phone}
                                                onChange={(e) => handleDetailChange('phone', e.target.value)}
                                                className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground"
                                                />
                                            </div>
                                        </div> 
                                        <div className="mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                    Address*
                                                </label>
                                                <input type="text" required 
                                                value={shippingDetails.address}
                                                onChange={(e) => handleDetailChange('address', e.target.value)}
                                                className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground"
                                                />
                                            </div>
                                        </div> 

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                    City *
                                                </label>
                                                <input type="text" required 
                                                value={shippingDetails.city}
                                                onChange={(e) => handleDetailChange('city', e.target.value)}
                                                className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                    ZIP Code *
                                                </label>

                                                <input type="text" required 
                                                value={shippingDetails.zipCode}
                                                onChange={(e) => handleDetailChange('zipCode', e.target.value)}
                                                className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground"
                                                />
                                            </div> 
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                    Country *
                                                </label>
                                                <select
                                                    required
                                                    value={shippingDetails.country}
                                                    onChange={(e) => handleDetailChange('country', e.target.value)}
                                                    className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground"
                                                >
                                                    <option value="Romania">Romania</option>
                                                </select>
                                            </div> 
                                        </div> 
                                        <button 
                                            type="submit" 
                                            disabled={isLoading}
                                            className="w-full py-3 gradient-primary
                                                text-primary-foreground rounded-lg hover:glow-on-hover animate-smooth font-semibold"
                                        >
                                            {isLoading ? "Processing..." : "Continue to Payment (Stripe)"}
                                        </button>
                                    </form>
                                ) : (
                                    
                                    <div className="glass-panel text-center p-10">
                                        <h2 className="text-2xl font-bold mb-4 text-primary">Redirecting to Stripe...</h2>
                                        <p className="text-muted-foreground">
                                            Please wait while we secure your payment session.
                                        </p>
                                        
                                        {sessionId && (
                                            <p className="mt-4">
                                                <a href={`https://checkout.stripe.com/pay/${sessionId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">
                                                    Click here if you are not redirected automatically.
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                )
                            }
                        </div>

                        {/* ORDER SUMMARY */}
                        <div className="lg:col-span-1">
                            <div className="glass-panel sticky top-24">
                                <h2 className="text-xl font-semibold text-foreground"> Order Summary </h2>
                                <div className="space-y-4 mb-6">
                                    {
                                        cart.map(item => {
                                            return(
                                                <div key={item.product.id} className="flex items-center space-x-3">
                                                    <img src={item.product.images[0].url}
                                                        alt={item.product.name}
                                                        className="w-12 h-12 object-cover rounded"/>
                                                    <div className="flex-1 min-w-8">
                                                        <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                                                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                                    </div>
                                                    <p className="text-sm font-semibold">
                                                        {Number(item.product.price) * item.quantity} RON
                                                    </p>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                                <div className="space-y-2 border-t border-[hsla(var(--glass-border))] pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground"> Subtotal </span>
                                        <span>{(total - shippingPrice).toFixed(2)} RON</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground"> Shipping </span>
                                        <span className="font-semibold text-green-500">
                                            {shippingPrice === 0 ? "Free" : `${shippingPrice.toFixed(2)} RON`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-2">
                                        <span>Total</span>
                                        <span>{total.toFixed(2)} RON</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    
    </>;
};

export default Payment;