import { createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toggleCreateProductModal, toggleUpdateProductModal } from "./extraSlice";
import { toast } from "react-toastify";

const productSlice = createSlice({
  name: "product",
  initialState: {
    loading: false,
    fetchingProducts: false,
    products: [],
    totalProducts: 0,
  },
  reducers: {
    createProductRequest(state) {
      state.loading = true;
    },
    createProductSuccess(state, action) {
      state.loading = false;
      state.products = [action.payload, ...state.products];
    },
    createProductFailed(state) {
      state.loading = false;
    },
    getAllProductsRequest(state) {
      state.fetchingProducts = true;
    },
    getAllProductsSuccess(state, action) {
      state.fetchingProducts = false;
      state.products = action.payload.products;
      state.totalProducts = action.payload.totalProducts;
    },
    getAllProductsFailed(state) {
      state.fetchingProducts = false;
    },
    updateProductRequest(state) {
      state.loading = true;
    },
    updateProductSuccess(state, action) {
      state.loading = false;
      if (action.payload.updateProduct) {
        state.products = state.products.map((product) =>
          product.id === action.payload.updateProduct.id
            ? action.payload.updateProduct
            : product
        );
      }
    },
    updateProductFailed(state) {
      state.loading = false;
    },
    deleteProductRequest(state) {
      state.loading = true;
    },
    deleteProductSuccess(state, action) {
      state.loading = false;
      state.products = state.products.filter(
        (product) => product.id !== action.payload
      );
      state.totalProducts = Math.max(0, state.totalProducts - 1);
    },
    deleteProductFailed(state) {
      state.loading = false;
    },
  },
});

// --- ACTIONS ---

// Create New Product
export const createNewProduct = (data) => async (dispatch) => {
  dispatch(productSlice.actions.createProductRequest());
  // Corectat: /products/admin/create
  await axiosInstance
    .post("/products/admin/create", data)
    .then((res) => {
      dispatch(productSlice.actions.createProductSuccess(res.data.product));
      toast.success(res.data.message || "Product created successfully.");
      dispatch(toggleCreateProductModal());
    })
    .catch((error) => {
      dispatch(productSlice.actions.createProductFailed());
      toast.error(error.response?.data?.message || "Failed to create product.");
    });
};

// Fetch All Products (Paginat)
export const fetchAllProducts = (page) => async (dispatch) => {
  dispatch(productSlice.actions.getAllProductsRequest());
  // Corectat: /products?page=...
  await axiosInstance
    .get(`/products?page=${page || 1}`)
    .then((res) => {
      dispatch(productSlice.actions.getAllProductsSuccess(res.data));
    })
    .catch((error) => {
      dispatch(productSlice.actions.getAllProductsFailed());
      console.error("Fetch Products Error:", error.response?.data || error);
    });
};

// Update Product
export const updateProduct = (data, id) => async (dispatch) => {
  dispatch(productSlice.actions.updateProductRequest());
  // Corectat: /products/admin/update/
  await axiosInstance
    .put(`/products/admin/update/${id}`, data)
    .then((res) => {
      dispatch(productSlice.actions.updateProductSuccess(res.data));
      toast.success(res.data.message || "Product updated successfully.");
      dispatch(toggleUpdateProductModal());
    })
    .catch((error) => {
      dispatch(productSlice.actions.updateProductFailed());
      console.error("UPDATE ERROR:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to update product.");
    });
};

// Delete Product
export const deleteProduct = (id, page) => async (dispatch, getState) => {
  dispatch(productSlice.actions.deleteProductRequest());
  // Corectat: /products/admin/delete/
  await axiosInstance
    .delete(`/products/admin/delete/${id}`)
    .then((res) => {
      dispatch(productSlice.actions.deleteProductSuccess(id));
      toast.success(res.data.message || "Product deleted successfully.");

      const state = getState();
      const updatedTotal = state.product.totalProducts;
      const updatedMaxPage = Math.ceil(updatedTotal / 10) || 1;
      const validPage = Math.min(page, updatedMaxPage);
      dispatch(fetchAllProducts(validPage));
    })
    .catch((error) => {
      dispatch(productSlice.actions.deleteProductFailed());
      toast.error(error.response?.data?.message || "Failed to delete product.");
    });
};

export default productSlice.reducer;