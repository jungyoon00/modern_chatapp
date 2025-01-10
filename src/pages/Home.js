import useGlobalState from "../store/zustandStore";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import UserPage from "./components/UserPage";
import HomePage from "./components/HomePage";
import ChatPage from "./components/ChatPage";

import "../style/Home.css";

import { IoMdHome } from "react-icons/io";
import { MdAccountCircle } from "react-icons/md";
import { IoChatbox } from "react-icons/io5";
import { MdOutlineLogout } from "react-icons/md";

function Home() {
    const globalID = useGlobalState((state) => state.globalID);
    const setGlobalID = useGlobalState((state) => state.setGlobalID);
    const setActivate = useGlobalState((state) => state.setActivate);
    const [view, setView] = useState('chat');

    const navigator = useNavigate();

    function logout() {
        setGlobalID("");
        setActivate(false);
        navigator("/");
    }

    return (
        <div className="home-frame">
            <div className="home-wrapper">
                {(view === 'account') && <UserPage userID={globalID} />}
                {(view === 'home') && <HomePage userID={globalID} />}
                {(view === 'chat') && <ChatPage userID={globalID} />}
            </div>
            <div className="home-nav">
                <button className="home" onClick={() => setView("home")}><IoMdHome size={30} color="black" /></button>
                <button className="account" onClick={() => setView("account")}><MdAccountCircle size={30} color="black" /></button>
                <button className="chat" onClick={() => setView("chat")}><IoChatbox size={30} color="black" /></button>
                <button className="logout" onClick={logout}><MdOutlineLogout size={30} color="black" /></button>
            </div>
        </div>
    )
}

export default Home;