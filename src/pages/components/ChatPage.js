import React, { useEffect, useState, useRef } from "react";
import { database } from "../../firebaseDB/firebaseConfig";
import { collection, doc, onSnapshot, orderBy, query, getDoc, addDoc, serverTimestamp, limit, updateDoc } from "firebase/firestore";
import "../../style/ChatPage.css";

import { CiLock } from "react-icons/ci";
import { CiUnlock } from "react-icons/ci";
import { IoSettingsSharp } from "react-icons/io5";

function ChatPage(props) {
    const defaultProfileImg = "https://i.imgur.com/vGQOCga.jpeg";
    const userID = props.userID;
    const [rooms, setRooms] = useState([]);
    const [datas, setDatas] = useState([]);
    const [roomID, setRoomID] = useState("");
    const [getPW, setGetPW] = useState("");
    const [selectedRoomID, setSelectedRoomID] = useState(null);
    const [selectedRoomProfiles, setSelectedRoomProfiles] = useState({});
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [showPWView, setShowPWView] = useState(false);
    const [roomName, setRoomName] = useState("");
    const [friends, setFriends] = useState([]);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const bottomRef = useRef(null);
    const [locked, setLocked] = useState(false);
    const [roomPW, setRoomPW] = useState("");
    const [roomHidden, setRoomHidden] = useState(false);
    const [showSettingView, setShowSettingView] = useState(false);

    const [userData, setUserData] = useState({});
    const [showCard, setShowCard] = useState(false);

    const [createUser, setCreateUser] = useState("");

    useEffect(() => {
        const unsubscribe = onSnapshot(
            doc(database, "UserInfo", props.userID), 
            (snapshot) => {
                const data = snapshot.data();
                if (data && data.rooms) {
                    setRooms(data.rooms);
                } else {
                    setRooms([]);
                }
                if (data && data.friends) {
                    setFriends(data.friends);
                }
            }
        );
        return () => unsubscribe();
    }, [props.userID]);

    async function getRoomInfo(rooms) {
        const datas = await Promise.all(rooms.map(async (room) => {
            if (!room) return {};
            const content = await getDoc(doc(database, "ChatRooms", room));
            const get = content.data();
            return {
                title: get.title,
                id: room,
                createdBy: get.createdBy,
                members: get.members,
            };
        }));
        setDatas(datas);
    }

    useEffect(() => {
        if (rooms.length > 0) {
            getRoomInfo(rooms);
        }
    }, [rooms]);

    function fetchMessages(roomID) {
        const docRef = doc(database, "ChatRooms", roomID);
        const messagesRef = collection(docRef, "history");

        const q = query(messagesRef, orderBy("time", "asc"), limit(500)); // 오래된 메시지 순으로 정렬

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMessages(messages);
        });

        return unsubscribe;
    }

    async function getRoomProfiles(roomID) {
        const docRef = doc(database, "ChatRooms", roomID);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();

        const members = data.members;

        const profiles = {};
        members.forEach(async (member) => {
            const docRef = doc(database, "UserInfo", member);
            const docSnap = await getDoc(docRef);
            const data = docSnap.data();
            profiles[member] = data.profileImage;
        });
        setSelectedRoomProfiles(profiles);
        console.log(profiles);
    }

    function handleChatRoom(e) {
        const roomID = e.target.value;
        setRoomID(roomID);

        const roomRef = doc(database, "ChatRooms", roomID);
        getDoc(roomRef).then((docSnap) => {
            const data = docSnap.data();
            if (data.locked) {
                setSelectedRoomID(null);
                setShowPWView(true);
            } else {
                enterChatRoom(roomID);
            }
        });
    }

    function enterChatRoom(roomID) {
        setSelectedRoomID(roomID);
        getRoomProfiles(roomID);

        if (selectedRoomID) {
            fetchMessages(selectedRoomID)();
        }

        const unsubscribe = fetchMessages(roomID);
        
        return () => unsubscribe();
    }

    async function handleSendMessage() {
        if (!newMessage.trim()) return;
        
        const docRef = doc(database, "ChatRooms", selectedRoomID);
        const messagesRef = collection(docRef, "history");

        await addDoc(messagesRef, {
            userID: props.userID,
            content: newMessage,
            time: serverTimestamp(),
        });

        setNewMessage("");
    }

    function handleKeyPress(e) {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    }

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({behavior: "smooth"});
        }
    }, [messages]);

    const togglePopup = () => {
        setShowPopup(!showPopup);
        setSelectedFriends([]);
        setRoomName("");
        setRoomPW("");
    }

    function handleFriendSelect(friendID) {
        setSelectedFriends((prev) => 
          prev.includes(friendID) ? prev.filter((id) => id !== friendID) : [...prev, friendID]);
    }

    const joinRoom = async (members, roomID) => {
        try {
            members.forEach(async (member) => {
                const userRef = doc(database, "UserInfo", member);
                const userSnap = await getDoc(userRef);
                const data = userSnap.data();

                await updateDoc(userRef, {
                    rooms: [...data.rooms, roomID],
                });
            })

            const roomRef = doc(database, "ChatRooms", roomID);
            const roomSnapshot = await getDoc(roomRef);
            const roomData = roomSnapshot.data();
    
            await updateDoc(roomRef, {
                members: [...(roomData?.members || []), userID],
            });
        } catch (error) {
            console.error("Error joining room:", error);
        }
    };

    async function createRoom() {
        if (!roomName.trim()) {
            alert("Please enter a room name.");
            return;
        }
    
        const newRoomRef = await addDoc(collection(database, "ChatRooms"), {
          createdBy: props.userID,
          members: [props.userID, ...selectedFriends],
          title: roomName,
          time: serverTimestamp(),
          locked: locked,
          password: roomPW,
          hidden: roomHidden,
        });

        const members = [props.userID, ...selectedFriends];
    
        setRooms([...rooms, newRoomRef.id]);
        joinRoom(members, newRoomRef.id);
        setRoomPW("");
        setRoomHidden(false);
        setLocked(false);
        togglePopup();
    }

    function handleLocking() {
        setLocked(!locked);
    }

    function handleRoomPW(e) {
        setRoomPW(e.target.value);
    }

    function handleSetting() {
        setShowSettingView(!showSettingView);
    }

    function checkRoomPW() {
        const roomRef = doc(database, "ChatRooms", roomID);
        getDoc(roomRef).then((docSnap) => {
            const data = docSnap.data();
            if (data.locked) {
                if (data.password === getPW) {
                    enterChatRoom(roomID);
                } else {
                    alert("Password does not match.");
                }
            }
        });
        setShowPWView(false);
    }

    async function getUserData(userID) {
        const docRef = doc(database, "UserInfo", userID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            setUserData(docSnap.data());
        } else {
            console.log("No such document!");
        }
    }

    const toggleCard = (userID) => {
        getUserData(userID);
        setShowCard((prev) => !prev);
    }

    const closeCard = () => {
        setUserData({});
        setShowCard(false);
    }

    const handleRoomHidden = (e) => {
        setRoomHidden(e.target.checked);
    }

    async function changeRoomSetting() {
        const roomRef = doc(database, "ChatRooms", roomID);

        await updateDoc(roomRef, {
            hidden: roomHidden,
        });

        setShowSettingView(false);
    }

    return (
        <div className="chat-wrapper">
            <div className="rooms-view">
                <div className="create-room">
                    <button className="create-button" onClick={togglePopup}>+</button>
                </div>
                {datas.map((data) => (
                    <div key={data.id}>
                        <button className="room-list" value={data.id} onClick={(e) => {handleChatRoom(e); setCreateUser(data.createdBy);}}>
                            {data.title}
                        </button>
                    </div>
                ))}
            </div>
            <div className="chats-view">
                <div className="chat-output">
                    {selectedRoomID ? (
                        <div className="chat-elements">
                            {userID === createUser &&
                                <button
                                    className="chat-settings-btn"
                                    onClick={() => handleSetting()}
                                >
                                    <IoSettingsSharp size={20} color="black" />
                                </button>
                            }
                            <ul>
                                {messages.map((message) => (
                                    <li
                                        key={message.id}
                                        className={message.userID === props.userID ? "sent" : "received"}
                                    >
                                        <p>
                                            <span>
                                                {message.userID === props.userID ? "" : <>
                                                <img 
                                                    className="small-profile"
                                                    alt="profile"
                                                    src={selectedRoomProfiles[message.userID] || defaultProfileImg}
                                                    onClick={() => toggleCard(message.userID)}
                                                ></img>
                                                <strong>{message.userID}</strong>
                                            </>}
                                            </span>
                                            {message.content}
                                        </p>
                                        <small>
                                            {message.time
                                                ? new Date(message.time.seconds * 1000).toLocaleString()
                                                : "Sending..."}
                                        </small>
                                    </li>
                                ))}
                                <div ref={bottomRef}></div>
                            </ul>
                        </div>
                    ) : (
                        <div className="placeholder">Select a chat room to view messages.</div>
                    )}
                </div>
                {selectedRoomID && (
                    <div className="chat-input">
                        <input 
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Message"
                        />
                        <button className="emoji" onClick={() => alert("현재 개발 중인 기능입니다.\n학생들의 얼굴로 이모티콘 제작 예정입니다. \n자원/추천 받습니다.")}>🔥</button>
                        <button className="chat-enter" onClick={handleSendMessage}>Enter</button>
                    </div>
                )}
            </div>

            {/* Dard Background */}
            <div
                className={`overlay ${showCard ? "show" : ""}`}
                onClick={closeCard}
            ></div>
            {/* Card */}
            <div className={`card-slide-container ${showCard ? "show" : ""}`}>
                <div className="card-profile-frame">
                    <div className="card-profile-header">
                        <div className="card-profile-icon">
                            {userData.profileImage ? (
                                <img
                                    src={userData.profileImage}
                                    alt="User Profile"
                                    className="card-profile-image"
                                />
                            ) : (
                                <div className="card-placeholder-icon">No Image</div>
                            )}
                        </div>
                        <div className="card-profile-name">{userData.name}</div>
                    </div>
                    <div className="card-user-info">
                        <div>Email | {userData.email}</div>
                        <div>Instagram | {userData.instagram}</div>
                        <div>More | {userData.more}</div>
                    </div>
                </div>
            </div>

            {showPopup && (
                <div className="popup-create-room">
                    <h3>Create Chat Room</h3>
                    <input
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Enter room name"
                        className="room-name-input"
                    />
                    <div className="friend-list-container">
                        <ul>
                            {friends.map((friend) => (
                                <li key={friend}>
                                    <span>{friend}</span>
                                    <input
                                        type="checkbox"
                                        checked={selectedFriends.includes(friend)}
                                        onChange={() => handleFriendSelect(friend)}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="locked-setting">
                        <button className="toggleLocker" onClick={handleLocking}>{locked ? <CiLock size={22} /> : <CiUnlock size={22} />}</button>
                        <input className={locked ? "roomPW-input" : "blind"} type="password" placeholder="Enter password" disabled={!locked} value={roomPW} onChange={handleRoomPW} />
                    </div>
                    <div className="hidden-setting">
                        <span>현재 멤버들 이외의 계정에게 이 방 숨기기</span>
                        <input className="hidden-check" type="checkbox" onChange={handleRoomHidden} />
                    </div>
                    <div className="button-container">
                        <button onClick={createRoom}>Create Room</button>
                        <button className="close-popup" onClick={togglePopup}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {showPWView && (
                <div className="popup-enter-room">
                    <h3>Enter Chat Room</h3>
                    <input
                        type="password"
                        value={getPW}
                        onChange={(e) => setGetPW(e.target.value)}
                        placeholder="Enter room's password"
                        className="roomPW-input"
                    />
                    <div className="button-container">
                        <button className="popup-enter" onClick={checkRoomPW}>Enter</button>
                        <button className="close-popup" onClick={() => setShowPWView(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {showSettingView && (
                <div className="popup-setting-room">
                    <h3>Settings</h3>
                    <div className="hidden-setting">
                        <span>현재 멤버들 이외의 계정에게 이 방 숨기기</span>
                        <input className="hidden-check" type="checkbox" onChange={handleRoomHidden} />
                    </div>
                    <div className="button-container">
                        <button className="popup-confirm" onClick={changeRoomSetting}>Confirm</button>
                        <button className="close-popup" onClick={() => setShowSettingView(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatPage;