import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify"; 
import { axiosInstance } from "../../lib/axios";


const authSlice = createSlice({
  name: "auth",
  initialState: {
    loading: false,
    user: null,
    isAuthenticated: false,
  },
  reducers: {
    loginRequest(state){
      state.loading = true;
    },
    loginSuccess(state,action){
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    loginFailed(state){
      state.loading = false;
    },
    getUserRequest(state){
      state.loading = true;
    },
    getUserSuccess(state,action){
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    getUserFailed(state){
      state.loading = false;
      state.user = null;
      state.isAuthenticated = false;
    },
    logoutRequest(state){
      state.loading = true;
    },
    logoutSuccess(state){
      state.loading = false;
      state.user = null;
      state.isAuthenticated = false;
    },
    logoutFailed(state){
      state.loading = false;
    },
    forgotPasswordRequest(state){
      state.loading = true;
    },
    forgotPasswordSuccess(state){
      state.loading = false;
    },
    forgotPasswordFailed(state){
      state.loading = false;
    },
    resetPasswordRequest(state){
      state.loading = true;
    },
    resetPasswordSuccess(state, action){
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    resetPasswordFailed(state){
      state.loading = false;
    },
    updateProfileRequest(state){
      state.loading = true;
    },
    updateProfileSuccess(state, action){
      state.loading = false;
      state.user = action.payload;
    },
    updateProfileFailed(state){
      state.loading = false;
    },
    updatePasswordRequest(state){
      state.loading = true;
    },
    updatePasswordSuccess(state){
      state.loading = false;
    },
    updatePasswordFailed(state){
      state.loading = false;
    },
    resetAuthSlice(state)
    {
      state.loading = false;
    },
  },
});

export const login = (data)=> async(dispatch)=>{
  dispatch(authSlice.actions.loginRequest());
  try{
    const res = await axiosInstance.post("/auth/login",data);
      if(res.data.user?.role !== "Admin")
      {
        dispatch(authSlice.actions.loginFailed());
        toast.error("You are not authorized to access the admin dashboard.");
        return;
      }
      else
      {
        dispatch(authSlice.actions.loginSuccess(res.data.user));
        toast.success(res.data.message || "Logged in successfully!");
      }
  }catch (error)
  { 
    dispatch(authSlice.actions.loginFailed());
    toast.error(error?.response?.data?.message || error.message || "Login failed.");
  }
};
export const getUser = ()=> async(dispatch)=>{
  dispatch(authSlice.actions.loginRequest());
  try{
    await axiosInstance.get("/auth/me").then((res)=>
    {
      dispatch(authSlice.actions.getUserSuccess(res.data.user));
    });
  } catch(){
    dispatch(authSlice.actions.getUserFailed());
  }
};
export const logout = ()=> async(dispatch)=>{
  dispatch(authSlice.actions.logoutRequest());
  try{
    await axiosInstance.post("/auth/logout").then((res)=>
    {
      dispatch(authSlice.actions.logoutSuccess());
      toast.success(res.data.message);
      dispatch(authSlice.actions.resetAuthSlice());
    });
  } catch(error){
    dispatch(authSlice.actions.getUserFailed());
    toast.error(error.respose.data.message || "Logout failed.");
    dispatch(authSlice.actions.resetAuthSlice());
  }
};

export const forgotPassword = (email)=> async(dispatch)=>{
  dispatch(authSlice.actions.forgotPasswordRequest());
  try{
    await axiosInstance.post("/auth/password/forgot?frontendUrl=http://localhost:5173",email).then((res)=>{
      dispatch(authSlice.actions.forgotPasswordSuccess());
      toast.success(res.data.message);
    });
  }catch (error)
  { 
    dispatch(authSlice.actions.forgotPasswordFailed());
    toast.error(error.response.data.message || "Cannot request for reset password.");
  }
};

export const resetPassword = (newData,token)=> async(dispatch)=>{
  dispatch(authSlice.actions.resetPasswordRequest());
  try{
    await axiosInstance.put(`/auth/password/reset/${token}`,newData ).then((res)=>{
      dispatch(authSlice.actions.resetPasswordSuccess(res.data.user));
      toast.success(res.data.message);
    });
  }catch (error)
  { 
    dispatch(authSlice.actions.resetPasswordFailed());
    toast.error(error.response.data.message || "Failed to reset password.");
  }
};

export const updateAdminProfile = (data)=> async(dispatch)=>{
  dispatch(authSlice.actions.updatePasswordRequest());
  try{
    await axiosInstance.put(`/auth/profile/update`,data).then((res)=>{
      dispatch(authSlice.actions.updateProfileSuccess(res.data.user));
      toast.success(res.data.message);
    });
  }catch (error)
  { 
    dispatch(authSlice.actions.updateProfileFailed());
    toast.error(error.response.data.message || "Failed to update profile");
  }
};

export const updateAdminPassword = (data)=> async(dispatch)=>{
  dispatch(authSlice.actions.updatePasswordRequest());
  try{
    await axiosInstance.put(`/auth/password/update`,data).then((res)=>{
      dispatch(authSlice.actions.updatePasswordSuccess(res.data.user));
      toast.success(res.data.message);
    });
  }catch (error)
  { 
    dispatch(authSlice.actions.updatePasswordFailed());
    toast.error(error.response.data.message || "Failed to update password");
  }
};

export const resetAuthSlice = () => async(dispatch)=>
{
  dispatch(authSlice.actions.resetAuthSlice());
};

export default authSlice.reducer;
