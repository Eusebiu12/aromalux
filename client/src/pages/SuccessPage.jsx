// src/pages/SuccessPage.jsx (Exemplu)
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { clearCart } from '../store/slices/cartSlice';

const SuccessPage = () => {
    const navigateTo = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id');

        if (sessionId) {
            toast.success("Payment Successful! Your order is being processed.", {
                autoClose: 5000, 
                position: "top-right", 
            });

            dispatch(clearCart()); 
            
            const timer = setTimeout(() => {
                navigateTo('/');
            }, 500);

            return () => clearTimeout(timer);
        } else {
            navigateTo('/cart');
        }
    }, [navigateTo, location.search, dispatch]);

    return (
        <div className="min-h-screen pt-40 text-center">
            <h1 className="text-3xl text-primary">Confirming Payment...</h1>
            <p className="text-muted-foreground mt-2">You will be redirected shortly.</p>
        </div>
    );
};

export default SuccessPage;