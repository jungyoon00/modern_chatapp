import useGlobalState from "../store/zustandStore";
import { useState } from "react";

import UserPage from "./components/UserPage";
import HomePage from "./components/HomePage";
import ChatPage from "./components/ChatPage";

import "../style/Home.css";

import { IoMdHome } from "react-icons/io";
import { MdAccountCircle } from "react-icons/md";
import { IoChatbox } from "react-icons/io5";

function Home() {
    const globalID = useGlobalState((state) => state.globalID);
    const [view, setView] = useState('chat');

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
            </div>
        </div>
    )
}

export default Home;