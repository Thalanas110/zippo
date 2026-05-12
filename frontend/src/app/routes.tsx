import { createBrowserRouter, Navigate } from "react-router";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AppLayout from "./pages/AppLayout";
import Home from "./pages/Home";
import GiftInput from "./pages/GiftInput";
import Recommendations from "./pages/Recommendations";
import Delivery from "./pages/Delivery";
import Confirmed from "./pages/Confirmed";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import VendorDashboard from "./pages/VendorDashboard";
import RiderDashboard from "./pages/RiderDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/app",
    Component: AppLayout,
    children: [
      { index: true, element: <Navigate to="/app/home" replace /> },
      { path: "home",            Component: Home },
      { path: "gift",            Component: GiftInput },
      { path: "recommendations", Component: Recommendations },
      { path: "delivery",        Component: Delivery },
      { path: "confirmed",       Component: Confirmed },
      { path: "orders",          Component: Orders },
      { path: "profile",         Component: Profile },
    ],
  },
  {
    path: "/vendor/dashboard",
    Component: VendorDashboard,
  },
  {
    path: "/rider/dashboard",
    Component: RiderDashboard,
  },
  {
    path: "/admin/dashboard",
    Component: AdminDashboard,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
