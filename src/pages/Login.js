import useGlobalState from "../store/zustandStore";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { database } from "../firebaseDB/firebaseConfig";
import bcrypt from "bcryptjs";
import "../style/Login.css";

function Login() {
    const navigate = useNavigate();

    const setActivate = useGlobalState((state) => state.setActivate);
    const setGlobalID = useGlobalState((state) => state.setGlobalID);

    const [userID, setUserID] = useState("");
    const [userPW, setUserPW] = useState("");
    
    const handleUserID = (e) => {
        setUserID(e.target.value);
    }
    const handleUserPW = (e) => {
        setUserPW(e.target.value);
    }
    
    async function loginAccount(userData) {
        try {
            if (!userData.userID || !userData.userPW) {
                console.error("Invalid user data");
                return;
            }
    
            const userDocRef = doc(database, "accounts", userData.userID);
            const userDoc = await getDoc(userDocRef);
    
            if (!userDoc.exists()) {
                console.error("User ID does not exist");
                return;
            }
    
            const userDocData = userDoc.data();
            const hashedPW = userDocData.password;

            bcrypt.compare(userPW, hashedPW, (err, result) => {
                if (result === true) {
                    console.log("Password match");
                } else {
                    console.error("Password does not match");
                    return;
                }
            });

            setGlobalID(userData.userID);
            setActivate(true);
            navigate("/home");
        } catch (e) {
            console.error("Error reading document: ", e);
        }
    }

    const onClickConfirmBtn = () => {
        const userData = { userID, userPW };
        loginAccount(userData);
    }

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <h3 className="title">Login</h3>
                <div className="box">
                <input
                    type="text"
                    className="id"
                    placeholder="ID"
                    autoComplete="off"
                    value={userID}
                    onChange={handleUserID}
                />
                <input
                    type="password"
                    className="password"
                    placeholder="PASSWORD"
                    autoComplete="off"
                    value={userPW}
                    onChange={handleUserPW}
                />
                <button className="confirm" onClick={onClickConfirmBtn}>Confirm</button>
                </div>
                <div className="signup-link">
                    <a href="/signup">Sign up</a>
                </div>
            </div>
        </div>
    )
}

export default Login;