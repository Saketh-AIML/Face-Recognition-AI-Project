import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/home";
import Login from "../pages/login";
import Dashboard from "../pages/dashboard";
import UserManagement from "../pages/user-management";
import Register from "../pages/register";
import LoginHistory from "../pages/LoginHistory";
import WelcomePage  from "../pages/welcomepage";
import AdminLogin from "../pages/admin-login";

import BackendLogs from "../pages/backend-logs";
import LiveFaceRecognition from "../../src/pages/LiveFaceRecognition";



const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "login-history",
        element: <LoginHistory />,
      },
      {
        path: "admin-login",
        element: <AdminLogin />, 
      },
      {
        path: "backend-logs",
        element: <BackendLogs />,
      },
      {
        path: "welcomepage",
        element: <WelcomePage />,
      },
      {
        path: "live-face-recognition",
        element: <LiveFaceRecognition />,
      },
      {
        path: "user-management",
        element: <UserManagement />,
      },
      
      
      
    ]
  }
]);

export default router;