import React, { useEffect, useState, useRef } from "react";
import { database } from "../../firebaseDB/firebaseConfig";
import { collection, doc, onSnapshot, orderBy, query, getDoc, addDoc, serverTimestamp, limit, updateDoc } from "firebase/firestore";
import "../../style/ChatPage.css";

import { CiLock } from "react-icons/ci";
import { CiUnlock } from "react-icons/ci";

function ChatPage(props) {
    const defaultProfileImg = "https://imgur.com/a/HC231Lj";
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

        const q = query(messagesRef, orderBy("time", "asc"), limit(300)); // 오래된 메시지 순으로 정렬

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

    const joinRoom = async (roomID) => {
        try {
            const userRef = doc(database, "UserInfo", userID);
            const roomRef = doc(database, "ChatRooms", roomID);
    
            // 나의 채팅방 목록 업데이트
            await updateDoc(userRef, {
                rooms: [...rooms, roomID],
            });
    
            // 채팅방의 members 업데이트
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
        });
    
        setRooms([...rooms, newRoomRef.id]);
        joinRoom(newRoomRef.id);
        setRoomPW("");
        togglePopup();
    }

    function handleLocking() {
        setLocked(!locked);
    }

    function handleRoomPW(e) {
        setRoomPW(e.target.value);
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

    return (
        <div className="chat-wrapper">
            <div className="rooms-view">
                <div className="create-room">
                    <button className="create-button" onClick={togglePopup}>+</button>
                </div>
                {datas.map((data) => (
                    <div key={data.id}>
                        <button className="room-list" value={data.id} onClick={handleChatRoom}>
                            {data.title}
                        </button>
                    </div>
                ))}
            </div>
            <div className="chats-view">
                <div className="chat-output">
                    {selectedRoomID ? (
                        <ul>
                            {messages.map((message) => (
                                <li
                                    key={message.id}
                                    className={message.userID === props.userID ? "sent" : "received"}
                                >
                                    <p>
                                        <span>
                                            {message.userID === props.userID ? "" : <>
                                            <img className="small-profile" src={selectedRoomProfiles[message.userID] || defaultProfileImg}></img>
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
                        <button className="emoji">🔥</button>
                        <button className="chat-enter" onClick={handleSendMessage}>Enter</button>
                    </div>
                )}
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
                        <button onClick={checkRoomPW}>Enter</button>
                        <button className="close-popup" onClick={() => setShowPWView(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatPage;