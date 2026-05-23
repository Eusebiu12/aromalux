import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";



//1. Fetch All Raffles

export const fetchAllRaffles = createAsyncThunk(
 "raffle/fetchAll",
 async ({ page = 1, status = "", search = "" } = {}, thunkAPI) => {
 try {
 const params = new URLSearchParams();

 if (page) params.append("page", page);
 if (status) params.append("status", status);
 if (search) params.append("search", search);

 const res = await axiosInstance.get(`/raffle?${params.toString()}`);

 return res.data;
 } catch (error) {
 return thunkAPI.rejectWithValue(
 error.response?.data?.message || "Failed to fetch raffles."
);
 }
 }
);



//2. Fetch Single Raffle Details

export const fetchRaffleDetails = createAsyncThunk(
"raffle/details", // Numele acțiunii este adaptat
async (id, thunkAPI) => {
try {

const res = await axiosInstance.get(`/raffle/single/${id}`); 
return res.data.raffle; 
} catch (error) {
return thunkAPI.rejectWithValue(
error.response?.data?.message || "Failed to fetch raffle details." 
);
}
}
);


//3. Join Raffle 👈 AM ADAUGAT ACEASTA
export const joinRaffle = createAsyncThunk(
 "raffle/join",
 async (raffleId, thunkAPI) => {
 try {
 const res = await axiosInstance.post(`/raffle/join/${raffleId}`);
      toast.success("Successfully joined raffle!");
 return res.data.raffle;
 } catch (error) {
      const message = error.response?.data?.message || "Failed to join raffle.";
      toast.error(message);
 return thunkAPI.rejectWithValue(message);
 }
 }
);




const raffleSlice = createSlice({
 name: "raffle",
 initialState: {
 loading: false,
 raffles: [],
 totalRaffles: 0,
 joining: false,
    raffle: null,   
 },

 extraReducers: (builder) => {
 builder

 /* Fetch all */
 .addCase(fetchAllRaffles.pending, (state) => {
  state.loading = true;
 })
 .addCase(fetchAllRaffles.fulfilled, (state, action) => {
 state.loading = false;
 state.raffles = action.payload.raffles;
 state.totalRaffles = action.payload.totalRaffles;
 })
 .addCase(fetchAllRaffles.rejected, (state) => {
 state.loading = false;
})

 /* Fetch details */
 .addCase(fetchRaffleDetails.pending, (state) => {
 state.loading = true;
 })
 .addCase(fetchRaffleDetails.fulfilled, (state, action) => {
 state.loading = false;
 
state.raffle = action.payload;
 })
.addCase(fetchRaffleDetails.rejected, (state) => {
 state.loading = false;
 state.raffle = null;
})

 /* Join raffle */
 .addCase(joinRaffle.pending, (state) => {
 state.joining = true;
 })
 .addCase(joinRaffle.fulfilled, (state, action) => {
 state.joining = false;
 state.raffle = action.payload;
 })
 .addCase(joinRaffle.rejected, (state) => {
 state.joining = false;
 })
},
});

export default raffleSlice.reducer;