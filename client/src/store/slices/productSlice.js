import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";
import { toggleAIModal } from "./popupSlice";

export const fetchAllProducts = createAsyncThunk(
  "product/fetchAll",
   async({
    availability = "",
    price = "0-1000",
    category = "",
    ratings = "",
    search = "",
    page = 1,
   }, thunkAPI) => {
    try {
      const params = new URLSearchParams();

      if( category ) params.append("category", category);
      if( price ) params.append("price", price);
      if( search ) params.append("search", search);
      if( ratings ) params.append("ratings", ratings);
      if( availability ) params.append("availability", availability);
      if( page ) params.append("page", page);

      const res = await axiosInstance.get(`/product?${params.toString()}`);

      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response.data.message || "Failed to fetch products."
      );
    }
   }
  );

  export const fetchProductDetails = createAsyncThunk(
    "products/singleProduct", async(id,thunkAPI) =>{
      try {
        const res = await axiosInstance.get(`/product/singleProduct/${id}`);
        return res.data.product;
      } catch (error) {
        return thunkAPI.rejectWithValue(
        error.response.data.message || "Failed to fetch product details."
      );
      }
    } );

    export const postReview = createAsyncThunk(
    "product/post-new/review", async({productId,review},thunkAPI) =>{
      try {
        const res = await axiosInstance.put(`/product/post-new/review/${productId}`,review);

        const state=thunkAPI.getState();
        const authUser = state.auth.authUser;

        toast.success(res.data.message);
        return{
          newReview: res.data.review,
          authUser,
        } ;
      } catch (error) {
        toast.error(error.response.data.message || "Failed to post review.");
        return thunkAPI.rejectWithValue(
        error.response.data.message || "Failed to post review."
      );
      }
    } );

    export const deleteReview = createAsyncThunk(
    "product/delete/review", async({productId,reviewId},thunkAPI) =>{
      try {
        const res = await axiosInstance.delete(`/product/delete/review/${productId}`);
        toast.success(res.data.message);
        return reviewId;
      } catch (error) {
        toast.error(error.response.data.message || "Failed to delete review.");
        return thunkAPI.rejectWithValue(
        error.response.data.message || "Failed to delete review."
      );
      }
    } );

    export const fetchProductWithAI = createAsyncThunk(
    "product/ai-serach", async(userPrompt,thunkAPI) =>{
      try {
        const res = await axiosInstance.get(`/product/ai-search/`, {userPrompt,});
        thunkAPI.dispatch(toggleAIModal());
        return res.data;
      } catch (error) {
        toast.error(error.response.data.message);
        return thunkAPI.rejectWithValue(
        error.response.data.message || "Failed to fetch AI Filtered products."
      );
      }
    } );

const productSlice = createSlice({
  name: "product",
  initialState: {
    loading: false,
    products: [],
    productDetails: {},
    totalProducts: 0,
    topRatedProducts: [],
    newProducts: [],
    aiSearching: false,
    isReviewDeleting: false,
    isPostingReview: false,
    productReviews: [],
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchAllProducts.pending,(state) => {
      state.loading = true;
    })
    .addCase(fetchAllProducts.fulfilled,(state,action) => {
      state.loading = false;
      state.products = action.payload.products;
      state.newProducts = action.payload.newProducts;
      state.topRatedProducts = action.payload.topRatedProducts;
      state.totalProducts = action.payload.totalProducts;
    })
    .addCase(fetchAllProducts.rejected,(state) => {
      state.loading = false;
    })
    .addCase(fetchProductDetails.pending,(state) => {
      state.loading = true;
    })
    .addCase(fetchProductDetails.fulfilled,(state,action) => {
      state.loading = false;
      state.productDetails = action.payload;  
      state.productReviews = action.payload.reviews || []; 
    })
    .addCase(fetchProductDetails.rejected,(state) => {
      state.loading = false;
    })
    .addCase(postReview.pending, (state) => {
      state.isPostingReview = true;
    } )
    .addCase(postReview.fulfilled, (state, action) => {
    state.isPostingReview = false;
    
    const {newReview,authUser} = action.payload;

    const existingReviewIndex = state.productReviews.findIndex((rev) => rev.reviewer?.id === newReview.user_id);

      if(existingReviewIndex !== -1) {
        state.productReviews[existingReviewIndex].rating = Number(newReview.rating);
        state.productReviews[existingReviewIndex].comment = newReview.comment;
      }
      else
      {
        state.productReviews = [
          {
            ...newReview,
            reviewer: {
              id: authUser?.id,
              name: authUser?.name,
              avatar: authUser?.avatar?.url,

            },
          },
          ...state.productReviews,
        ];
      }
  } )
    .addCase(postReview.rejected, (state) => {
      state.isPostingReview =false;
    } )
    .addCase(deleteReview.pending, (state) => {
      state.isReviewDeleting = true;
    } )
    .addCase(deleteReview.fulfilled, (state, action) => {
    state.isReviewDeleting = false;
    state.productReviews = state.productReviews.filter(
      (review) => review.review_id !== action.payload);
  } )
    .addCase(deleteReview.rejected, (state) => {
      state.isReviewDeleting =false;
    } )
    .addCase(fetchProductWithAI.pending, (state) => {
      state.isReviewDeleting = true;
    } )
    .addCase(fetchProductWithAI.fulfilled, (state, action) => {
    state.isReviewDeleting = false;
    state.products = action.payload.products;
    state.totalProducts = action.payload.products.length;
  } )
    .addCase(fetchProductWithAI.rejected, (state) => {
      state.isReviewDeleting =false;
    } )
  },
});

export default productSlice.reducer;
