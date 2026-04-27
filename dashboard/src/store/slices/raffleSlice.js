import { createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";
import {
  toggleCreateRaffleModal,
  toggleUpdateRaffleModal,
} from "./extraSlice";

const raffleSlice = createSlice({
  name: "raffle",
  initialState: {
    loading: false,
    raffles: [],
    totalRaffles: 0,
    fetchingRaffles: false,
    isDeleting: false,
     isUpdating: false,
  },

  reducers: {
    // CREATE
    createRaffleRequest(state) {
      state.loading = true;
    },
    createRaffleSuccess(state, action) {
      state.loading = false;
      state.raffles = [action.payload, ...state.raffles];
    },
    createRaffleFailed(state) {
      state.loading = false;
    },

    // GET ALL
    getAllRafflesRequest(state) {
      state.fetchingRaffles = true;
    },
    getAllRafflesSuccess(state, action) {
      state.fetchingRaffles = false;
      state.raffles = action.payload.raffles;
      state.totalRaffles = action.payload.totalRaffles;
    },
    getAllRafflesFailed(state) {
      state.fetchingRaffles = false;
    },

    // UPDATE
    updateRaffleRequest(state) {
      state.isUpdating = true;
    },
    updateRaffleSuccess(state, action) {
      state.isUpdating = false;
      if (action.payload.updatedRaffle) {
        state.raffles = state.raffles.map((raffle) =>
          raffle.id === action.payload.updatedRaffle.id
            ? action.payload.updatedRaffle
            : raffle
        );
      }
    },
    updateRaffleFailed(state) {
      state.isUpdating = false;
    },

    // DELETE
    deleteRaffleRequest(state) {
      state.isDeleting = true;
    },
    deleteRaffleSuccess(state, action) {
      state.isDeleting = false;
      state.raffles = state.raffles.filter(
        (raffle) => raffle.id !== action.payload
      );
      state.totalRaffles = Math.max(0, state.totalRaffles - 1);
    },
    deleteRaffleFailed(state) {
      state.isDeleting = false;
    },
  },
});


// CREATE
export const createNewRaffle = (data) => async (dispatch) => {
  dispatch(raffleSlice.actions.createRaffleRequest());

  try {
    const res = await axiosInstance.post("/raffle/admin/create", data);
    dispatch(raffleSlice.actions.createRaffleSuccess(res.data.raffle));
    toast.success(res.data.message || "Tombola a fost creată cu succes.");
    dispatch(toggleCreateRaffleModal());
  } catch (error) {
    dispatch(raffleSlice.actions.createRaffleFailed());
    toast.error(error.response?.data?.message || "Eroare la crearea tombolei.");
  }
};

// GET ALL
export const fetchAllRaffles = (page = 1) => async (dispatch) => {
  dispatch(raffleSlice.actions.getAllRafflesRequest());

  try {
    const res = await axiosInstance.get(`/raffle?page=${page}`);
    dispatch(raffleSlice.actions.getAllRafflesSuccess(res.data));
  } catch (error) {
    dispatch(raffleSlice.actions.getAllRafflesFailed());
    toast.error(
      error.response?.data?.message || "Eroare la afisarea tombolelor."
    );
  }
};

// UPDATE
export const updateRaffle = (data, id) => async (dispatch) => {
  dispatch(raffleSlice.actions.updateRaffleRequest());

  try {
    const res = await axiosInstance.put(`/raffle/admin/update/${id}`, data);
    dispatch(raffleSlice.actions.updateRaffleSuccess(res.data));
    toast.success(res.data.message || "Tombola actualizată cu succes.");
    dispatch(toggleUpdateRaffleModal());
  } catch (error) {
    dispatch(raffleSlice.actions.updateRaffleFailed());
    toast.error(
      error.response?.data?.message || "Eroare la actualizarea tombolei."
    );
  }
};

// DELETE
export const deleteRaffle = (id, page) => async (dispatch, getState) => {
  dispatch(raffleSlice.actions.deleteRaffleRequest());

  try {
     await axiosInstance.delete(`/raffle/admin/delete/${id}`);

    dispatch(raffleSlice.actions.deleteRaffleSuccess(id));
    toast.success("Tombola a fost ștearsă cu succes.");

    const state = getState();
    const updatedTotal = state.raffle.totalRaffles;
    const maxPage = Math.ceil(updatedTotal / 10) || 1;
    const validPage = Math.min(page, maxPage);

    dispatch(fetchAllRaffles(validPage));
  } catch (error) {
    dispatch(raffleSlice.actions.deleteRaffleFailed());
    toast.error(error.response?.data?.message || "Eroare la ștergerea tombolei.");
  }
};

export default raffleSlice.reducer;
