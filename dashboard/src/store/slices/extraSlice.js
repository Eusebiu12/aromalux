import { createSlice } from "@reduxjs/toolkit";

const extraSlice = createSlice({
  name: "extra",
  initialState: {
    openedComponent: "Dashboard",
    isNavbarOpened: false,
    isViewProductModalOpened: false,
    isCreateProductModalOpened: false,
    isUpdateProductModalOpened: false,

    // Raffle Modals
    isViewRaffleModalOpened: false,
    isCreateRaffleModalOpened: false,
    isUpdateRaffleModalOpened: false,
  },
  reducers: {
    toggleComponent: (state,action)=>{
      state.openedComponent = action.payload;
    },
    toggleNavBar: (state)=>{
      state.isNavbarOpened = !state.isNavbarOpened;
    },
    toggleCreateProductModal: (state)=>{
      state.isCreateProductModalOpened = !state.isCreateProductModalOpened;
    },
    toggleViewProductModal: (state)=>{
      state.isViewProductModalOpened =!state.isViewProductModalOpened;
    },
    toggleUpdateProductModal: (state)=>{
      state.isUpdateProductModalOpened = !state.isUpdateProductModalOpened;
    },

    // RAFFLE MODALS
    toggleCreateRaffleModal: (state) => {
      state.isCreateRaffleModalOpened = !state.isCreateRaffleModalOpened;
    },
    toggleViewRaffleModal: (state) => {
      state.isViewRaffleModalOpened = !state.isViewRaffleModalOpened;
    },
    toggleUpdateRaffleModal: (state) => {
      state.isUpdateRaffleModalOpened = !state.isUpdateRaffleModalOpened;
    },
  },
});

export const {
  toggleComponent,
  toggleCreateProductModal,
  toggleNavbar,
  toggleUpdateProductModal,
  toggleViewProductModal,

  // Raffle modals
  toggleCreateRaffleModal,
  toggleViewRaffleModal,
  toggleUpdateRaffleModal,
} = extraSlice.actions;

export default extraSlice.reducer;
