import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import useGlobalState from "./store/zustandStore";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";

function App() {
  const activate = useGlobalState((status) => status.activate);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={activate ? <Home /> : <Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
