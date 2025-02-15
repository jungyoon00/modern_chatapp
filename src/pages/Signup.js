import { useState } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { database } from "../firebaseDB/firebaseConfig";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";
import "../style/Signup.css";

function Signup() {
    const navigate = useNavigate();

    const [userID, setUserID] = useState("");
    const [userPW, setUserPW] = useState("");
    const [userPWCheck, setUserPWCheck] = useState("");
    const [showModal, setShowModal] = useState(false);

    const handleUserID = (e) => {
        setUserID(e.target.value);
    }
    const handleUserPW = (e) => {
        setUserPW(e.target.value);
    }
    const handleUserPWCheck = (e) => {
        setUserPWCheck(e.target.value);
    }

    const userAdder = async (userID) => {
        try {
            // Firestore의 UserInfo 컬렉션에 userID를 문서 ID로 사용하여 저장
            await setDoc(doc(database, "UserInfo", userID), {profileImage: "", name: userID, email: "", instagram: "", more: "", friends: [], rooms: [], friends_queue: [], friends_asked: [], bg_color: "#ffffff", bg_img: ""});
        } catch (error) {
            console.error("Error creating user: ", error);
        }
    };

    async function createAccount(userData) {
        try {
            if (!userData.userID || !userData.userPW) {
                console.error("Invalid user data");
                return;
            }
    
            const userDocRef = doc(database, "accounts", userData.userID);
            const userDoc = await getDoc(userDocRef);
    
            if (userDoc.exists()) {
                console.error("User ID already exists");
                return;
            }
    
            await setDoc(userDocRef, {
                id: userData.userID,
                password: userData.userPW,
            });

            userAdder(userData.userID);
    
            console.log("Document successfully written!");
        } catch (e) {
            console.error("Error writing document: ", e);
        }
    }

    const onClickConfirmBtn = () => {
        if (userPW !== userPWCheck) {
            console.error("Password does not match");
            return;
        }

        const hashedPW = bcrypt.hashSync(userPW, 10);
        const userData = { userID: userID, userPW: hashedPW };
        createAccount(userData);
        setShowModal(true);
    }

    return (
        <div className="signup-wrapper">
            <div className="signup-container">
                <h3 className="title">SignUp</h3>
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
                    <input
                        type="password"
                        className="password"
                        placeholder="REPEAT"
                        autoComplete="off"
                        value={userPWCheck}
                        onChange={handleUserPWCheck}
                    />
                    <button className="confirm" onClick={onClickConfirmBtn}>Confirm</button>
                </div>
                <div className="login-link">
                    <a href="/login">Login</a>
                </div>
            </div>

            {showModal &&
            <div className="modal" style={{ display: showModal ? "block" : "none" }}>
                <div className="modal-content">
                    <h3>Alert</h3>
                    <p>Your account is created.</p>
                    <button className="modal-close" onClick={() => {setShowModal(false); navigate("/login")}}>OK</button>
                </div>
            </div>}
        </div>
    );
}

export default Signup;