import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";

import SideBar from "./components/SideBar";
import Dashboard from "./components/Dashboard"
import Orders from "./components/Orders"
import Users from "./components/Users"
import Profile from "./components/Profile"
import Products from "./components/Products"

import Raffle from "./components/Raffle";

import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { getUser } from "./store/slices/authSlice";
import { fetchAllUsers } from "./store/slices/adminSlice";
import { fetchAllProducts } from "./store/slices/productsSlice";
import { getDashboardStats } from "./store/slices/adminSlice";
import { fetchAllRaffles } from "./store/slices/raffleSlice";

function App() {

  const {openedComponent} = useSelector((state) => state.extra);
  const {user,isAuthenticated} = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(()=>
  {
    dispatch(getUser());
  },[]);
  useEffect(()=>{
    if(isAuthenticated){
      dispatch(getDashboardStats());
      dispatch(fetchAllUsers());
      dispatch(fetchAllProducts());
      dispatch(fetchAllRaffles());
    }
  },[isAuthenticated])

  const renderDashboardContent = () =>{
    switch (openedComponent){
      case "Dashboard":
      return <Dashboard/>;
      case "Orders":
      return <Orders/>;
      case "Users":
      return <Users/>;
      case "Profile":
      return <Profile/>;
      case "Products":
      return <Products/>;
      case "Raffle":
      return <Raffle/>;

      default:
        return <Dashboard/>;
    }
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/password/reset/:token" element={<ResetPassword />} />
        
        {/* Protected Admin Route */}
        <Route
          path="/"
          element={
            isAuthenticated && user?.role === "Admin" ? (
              <div className="flex min-h-screen">
                <SideBar />
                {renderDashboardContent()}
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      <ToastContainer theme="dark" />
    </Router>
  );
}
 
export default App;
