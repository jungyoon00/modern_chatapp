import { useNavigate } from "react-router-dom";

import "../style/Main.css"

function Main() {
    const navigate = useNavigate();

    return (
        <div className="main-frame">
            <div className="main-wrapper">
                <div className="left-section">
                    <p>Hello,</p>
                    <p>This is chatting app.</p>
                    <p>Isn't it?</p>
                </div>
                <div class="right-section">
                    <button className="login-button" onClick={() => navigate("/login")}>Login</button>
                    <button className="signup-button" onClick={() => navigate("/signup")}>Sign Up</button>
                </div>
            </div>
            <div className="footer">
                developed by <img src="https://i.imgur.com/6PYEWah.jpeg" alt="logo"></img>
                <a href="https://github.com/jungyoon00/modern_chatapp" target="_blank" rel="noopener noreferrer">JungYoon</a>
            </div>
        </div>
    )
}

export default Main;