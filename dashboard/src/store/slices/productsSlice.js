import { createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toggleCreateProductModal, toggleUpdateProductModal } from "./extraSlice";
import { toast } from "react-toastify";
import axios from "axios";

const productSlice = createSlice({
  name: "product",
  initialState: {
    loading: false,
    fetchingProducts: false,
    products: [],
    totalProducts: 0,
  },
  reducers: {
    createProductRequest(state){
      state.loading = true;
    },
    createProductSuccess(state,action){
      state.loading = false;
      state.products = [action.payload, ...state.products];
    },
    createProductFailed(state){
      state.loading = false;
    },
    getAllProductsRequest(state){
      state.fetchingProducts = true;
    },
    getAllProductsSuccess(state,action){
      state.fetchingProducts = false;
      state.products = action.payload.products;
      state.totalProducts = action.payload.totalProducts;
    },
    getAllProductsFailed(state){
      state.fetchingProducts = false;
    },
    updateProductRequest(state){
      state.loading = true;
    },
    updateProducSuccess(state, action){
      state.loading = false;
      if(action.payload.updateProduct){
      state.products = state.products.map(product =>
      product.id === action.payload.updateProduct.id ? action.payload.updateProduct : product
    );
      }
    },
    updateProducFailed(state){
      state.loading = false;
    },
    deleteProductRequest(state){
      state.loading = true;
    },
    deleteProducSuccess(state,action){
      state.loading = false;
      state.products = state.products.filter(product => product.id !== action.payload);
      state.totalProducts = Math.max(0,state.totalProducts -1);
    },
    deleteProducFailed(state){
      state.loading = false;
    },
  },
});

export const createNewProduct = (data)=>async(dispatch)=>{
  dispatch(productSlice.actions.createProductRequest());
  await axiosInstance.post("/product/admin/create",data).then(res=>{
    dispatch(productSlice.actions.createProductSuccess(res.data.product));
    toast.success(res.data.message || "Product created successfully.");
    dispatch(toggleCreateProductModal());
  }).catch((error)=>
  {
    dispatch(productSlice.actions.createProductFailed());
    toast.error(error.response?.data?.message || "Failed to create product.");
  }
  );
};

export const fetchAllProducts = (page) => async (dispatch) =>{
  dispatch(productSlice.actions.getAllProductsRequest());
  await axiosInstance.get(`/product?page=${page || 1}`).then(res=>{
    dispatch(productSlice.actions.getAllProductsSuccess(res.data));
  }).catch((error)=>{
    dispatch(productSlice.actions.getAllProductsFailed());
  });
};

export const updateProduct = (data,id)=>async(dispatch)=>{
  dispatch(productSlice.actions.updateProductRequest());
  await axiosInstance.put(`/product/admin/update/${id}`,data).then(res=>{
    dispatch(productSlice.actions.updateProducSuccess(res.data));
    toast.success(res.data.message || "Product updated successfully.");
    dispatch(toggleUpdateProductModal());
  }).catch((error)=>
  {
    dispatch(productSlice.actions.updateProducFailed());
    console.log("UPDATE ERROR:", error.response?.data || error);
    toast.error(error.response?.data?.message || "Failed to update product.");
  }
  );
};

export const deleteProduct = (id,page)=>async(dispatch,getState)=>{
  dispatch(productSlice.actions.deleteProductRequest());
  await axiosInstance.delete(`/product/admin/delete/${id}`).then(res=>
  {
    dispatch(productSlice.actions.deleteProducSuccess(id));
    toast.success(res.data.message || "Product deleted successfully.");

    const state = getState();
    const updatedTotal = state.product.totalProducts;
    const updatedMaxPage = Math.ceil(updatedTotal / 10) || 1;
    const validPage = Math.min(page, updatedMaxPage);
    dispatch(fetchAllProducts(validPage));
   }).catch((error)=>{
  dispatch(productSlice.actions.deleteProductFailed());
  toast.error(error.response?.data?.message || "Failed to delete product."); 
  })
};
  

export default productSlice.reducer;
