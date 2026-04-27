import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const fetchMyOrders = createAsyncThunk("order/orders/me",async(_,thunkAPI)=>{
 try{
 const res = await axiosInstance.get("/order/orders/me");
 console.log("API RESPONSE:", res.data);
 return res.data.myOrders;
 }catch(error){
 return thunkAPI.rejectWithValue(error.response.data.message);
 }
});

// ➡️ Funcția `placeOrder` este menținută, dar așteptăm `sessionId` în răspuns
export const placeOrder = createAsyncThunk("order/new",async(data,thunkAPI)=>{
 try{
    // Răspunsul așteptat de la backend: { success: true, sessionId: 'cs_...', total_price: 125 }
 const res = await axiosInstance.post("/order/new",data);
 toast.success(res.data.message);
 return res.data; // Aici ar trebui să fie inclus `sessionId`
 }catch(error){
 toast.error(error.response.data.message || "Failed to place order,try again.");
 return thunkAPI.rejectWithValue(error.response.data.message);
 }
});

const orderSlice = createSlice({
 name: "order",
 initialState: {
 myOrders: [],
 fetchingOrders: false,
 placingOrder: false,
 finalPrice: null,
 orderStep: 1,
 
    // ➡️ MODIFICAT: `sessionId` înlocuiește `paymentIntent`
 sessionId: null, 
 currentOrderId: null,
 },
 reducers: {
 toggleOrderStep(state)
 {
 state.orderStep = 1;
 },
    // ➡️ NOU: Utility pentru a seta sessionId direct (opțional, dar util pentru debug/siguranță)
    setSessionId: (state, action) => {
        state.sessionId = action.payload;
    }
 },
 extraReducers: (builder) => {
 builder.addCase(fetchMyOrders.pending, (state) => {
 state.fetchingOrders = true;
 })
 builder.addCase(fetchMyOrders.fulfilled, (state,action) => {
 state.fetchingOrders = false;
 state.myOrders = action.payload;
 }) 
 builder.addCase(fetchMyOrders.rejected, (state) => {
 state.fetchingOrders = false;
 })
 builder.addCase(placeOrder.pending, (state) => {
 state.placingOrder = true;
})
    
    // ➡️ MODIFICAT: Gestionarea răspunsului de succes de la placeOrder
 builder.addCase(placeOrder.fulfilled, (state,action) => {
 state.placingOrder = false;
 state.finalPrice = action.payload.total_price;
 
        // ➡️ SALVĂM NOUL ID DE SESIUNE STRIPE CHECKOUT
        // Presupunem că backend-ul trimite { sessionId: 'cs_test_...', total_price: 125 }
 state.sessionId = action.payload.sessionId; 

 state.currentOrderId = action.payload.orderId; 
 state.orderStep = 2; // Trecem la pasul de plată/redirecționare
  })
 builder.addCase(placeOrder.rejected, (state) => {
 state.placingOrder = false;
 })
 },
});

export default orderSlice.reducer;
export const {toggleOrderStep, setSessionId} = orderSlice.actions;