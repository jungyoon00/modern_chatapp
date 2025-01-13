import React, { useEffect, useState } from "react";
import { doc, onSnapshot, getDoc, collection, updateDoc } from "firebase/firestore";
import { database } from "../../firebaseDB/firebaseConfig";
import "../../style/HomePage.css";

import { FaPlus } from "react-icons/fa";
import { FaMinus } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";

function MyPage(props) {
    const userID = props.userID;
    const defaultProfileImg = "https://i.imgur.com/vGQOCga.jpeg";

    const [friendNum, setFriendNum] = useState(0);
    const [chatNum, setChatNum] = useState(0);
    const [waitingNum, setWaitingNum] = useState(0);
    const [friends, setFriends] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [showFriendPopup, setShowFriendPopup] = useState(false);
    const [showChatPopup, setShowChatPopup] = useState(false);
    const [allAccounts, setAllAccounts] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [allWaitings, setAllWaitings] = useState([]);
    const [allAsked, setAllAsked] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showRemoveFriendPopup, setShowRemoveFriendPopup] = useState(false);
    const [showLeaveChatPopup, setShowLeaveChatPopup] = useState(false);
    const [showWaitingPopup, setShowWaitingPopup] = useState(false);

    const [userData, setUserData] = useState({});
    const [showCard, setShowCard] = useState(false);

    useEffect(() => {
        // Fetch user data (friends and rooms)
        const unsubscribe = onSnapshot(doc(database, "UserInfo", userID), (snapshot) => {
            const data = snapshot.data();
            if (data) {
                setFriends(data.friends || []);
                setRooms(data.rooms || []);
                setFriendNum(data.friends?.length || 0);
                setChatNum(data.rooms?.length || 0);
                setWaitingNum(data.friends_queue?.length || 0);
            }
        });

        return () => unsubscribe();
    }, [userID]);

    // 실시간으로 모든 계정 가져오기
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(database, "UserInfo"), (snapshot) => {
            const accounts = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllAccounts(accounts);
        });

        return () => unsubscribe();
    }, []);

    // 실시간으로 모든 채팅방 가져오기
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(database, "ChatRooms"), (snapshot) => {
            const rooms = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllRooms(rooms);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(database, "UserInfo", userID), async (snapshot) => {
            const data = snapshot.data();
            const friends_queue = data?.friends_queue || [];
    
            // Fetch user data for each userID in friends_queue
            const waitingUsers = await Promise.all(
                friends_queue.map(async (friendID) => {
                    const docRef = doc(database, "UserInfo", friendID);
                    const docSnap = await getDoc(docRef);
    
                    if (docSnap.exists()) {
                        return { userID: friendID, ...docSnap.data() };
                    } else {
                        console.log(`No document found for userID: ${friendID}`);
                        return null;
                    }
                })
            );
    
            // Filter out any null results and update the state
            setAllWaitings(waitingUsers.filter((user) => user !== null));
        });
    
        return () => unsubscribe();
    }, [userID]);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(database, "UserInfo", userID), (snapshot) => {
            const data = snapshot.data();
            setAllAsked(data.friends_asked || []);
        });
        
        return () => unsubscribe
    }, []);

    const toggleFriendPopup = () => {
        setShowFriendPopup(!showFriendPopup);
        setSearchQuery("");
    };

    const toggleChatPopup = () => {
        setShowChatPopup(!showChatPopup);
        setSearchQuery("");
    };

    const toggleRemoveFriendPopup = () => {
        setShowRemoveFriendPopup(!showRemoveFriendPopup);
    };
    
    const toggleLeaveChatPopup = () => {
        setShowLeaveChatPopup(!showLeaveChatPopup);
    };

    const toggleWaitingPopup = () => {
        setShowWaitingPopup(!showWaitingPopup);
        setSearchQuery("");
    };

    const askFriend = async (friendID) => {
        try {
            const userRef = doc(database, "UserInfo", userID);
            const friendRef = doc(database, "UserInfo", friendID);
    
            // 상대방의 친구 요청 목록 업데이트
            const friendSnapshot = await getDoc(friendRef);
            const friendData = friendSnapshot.data();
    
            await updateDoc(friendRef, {
                friends_queue: [...(friendData?.friends_queue || []), userID],
            });

            const userSnapshot = await getDoc(userRef);
            const userData = userSnapshot.data();

            await updateDoc(userRef, {
                friends_asked: [...(userData.friends_asked || []), friendID],
            });

        } catch (error) {
            console.error("Error asking friend:", error);
        }
    }

    const removeFriendAsked = async (friendID) => {
        try {
            const friendRef = doc(database, "UserInfo", friendID);

            const friendSnapshot = await getDoc(friendRef);
            const friendData = friendSnapshot.data();

            await updateDoc(friendRef, {
                friends_asked: friendData.friends_asked.filter((id) => id !== userID),
            });

        } catch (error) {
            console.error("Error removing friend asked:", error);
        }
    }

    const slapFriend = async (friendID) => {
        try {
            const userRef = doc(database, "UserInfo", userID);

            const userSnapshot = await getDoc(userRef);
            const userData = userSnapshot.data();

            await updateDoc(userRef, {
                friends_queue: userData.friends_queue.filter((id) => id !== friendID),
            });

            removeFriendAsked(friendID);

        } catch (error) {
            console.error("Error slapping friend:", error);
        }
    }

    const addFriend = async (friendID) => {
        try {
            const userRef = doc(database, "UserInfo", userID);
            const friendRef = doc(database, "UserInfo", friendID);
    
            // 나의 친구 목록 업데이트
            await updateDoc(userRef, {
                friends: [...friends, friendID],
            });
    
            // 상대방 친구 목록 업데이트
            const friendSnapshot = await getDoc(friendRef);
            const friendData = friendSnapshot.data();
    
            await updateDoc(friendRef, {
                friends: [...(friendData?.friends || []), userID],
            });

            slapFriend(friendID);
            toggleWaitingPopup();
        } catch (error) {
            console.error("Error adding friend:", error);
        }
    };

    const removeFriend = async (friendID) => {
        try {
            const userRef = doc(database, "UserInfo", userID);
            const friendRef = doc(database, "UserInfo", friendID);
    
            // 나의 친구 목록 업데이트
            const updatedFriends = friends.filter((id) => id !== friendID);
            await updateDoc(userRef, { friends: updatedFriends });
    
            // 상대방 친구 목록 업데이트
            const friendSnapshot = await getDoc(friendRef);
            const friendData = friendSnapshot.data();
            const updatedFriendList = (friendData?.friends || []).filter((id) => id !== userID);
            await updateDoc(friendRef, { friends: updatedFriendList });
    
            setFriends(updatedFriends); // 로컬 상태 업데이트
        } catch (error) {
            console.error("Error removing friend:", error);
        }
    };
    
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
    
            toggleChatPopup();
        } catch (error) {
            console.error("Error joining room:", error);
        }
    };

    const leaveRoom = async (roomID) => {
        try {
            const userRef = doc(database, "UserInfo", userID);
            const roomRef = doc(database, "ChatRooms", roomID);
    
            // 나의 채팅방 목록 업데이트
            const updatedRooms = rooms.filter((id) => id !== roomID);
            await updateDoc(userRef, { rooms: updatedRooms });
    
            // 채팅방의 members 업데이트
            const roomSnapshot = await getDoc(roomRef);
            const roomData = roomSnapshot.data();
            const updatedMembers = (roomData?.members || []).filter((id) => id !== userID);
            await updateDoc(roomRef, { members: updatedMembers });
    
            setRooms(updatedRooms); // 로컬 상태 업데이트
        } catch (error) {
            console.error("Error leaving room:", error);
        }
    };

    const filteredAccounts = allAccounts.filter(
        (account) => account.id !== userID && !friends.includes(account.id)
    );

    const removeFilteredAccounts = allAccounts.filter(
        (account) => account.id !== userID && friends.includes(account.id)
    )

    const filteredRooms = allRooms.filter((room) => {
        if (room.hidden) {
            // room.hidden이 true인 경우 추가 조건: userID가 room.members에 포함되어야 함
            return !rooms.includes(room.id) && room.members?.includes(userID);
        }
        // room.hidden이 false인 경우 기존 조건 유지
        return !rooms.includes(room.id);
    });

    const removeFilteredRooms = allRooms.filter((room) => rooms.includes(room.id));

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

    return (
        <div className="mypage-wrapper">
            <div className="nums">
                <div className="friends-num">
                    <div className="toolbar">
                        <span>Friends</span>
                        <div className="button-group">
                            <button className="add-friend" onClick={toggleFriendPopup}><FaPlus /></button>
                            <button className="del-friend" onClick={toggleRemoveFriendPopup}><FaMinus /></button>
                        </div>
                    </div>
                    <span>{friendNum}</span>
                </div>
                <div className="chats-num">
                    <div className="toolbar">
                        <span>Chats</span>
                        <div className="button-group">
                            <button className="add-chat" onClick={toggleChatPopup}><FaPlus /></button>
                            <button className="del-chat" onClick={toggleLeaveChatPopup}><FaMinus /></button>
                        </div>
                    </div>
                    <span>{chatNum}</span>
                </div>
                <div className="waiting-num">
                    <div className="toolbar">
                        <span>Waitings</span>
                        <div className="button-group">
                            <button className="check-waiting" onClick={toggleWaitingPopup}><FaCheck /></button>
                        </div>
                    </div>
                    <span>{waitingNum}</span>
                </div>
            </div>

            {/* Remove Friend Popup */}
            {showRemoveFriendPopup && (
                <div className="popup">
                    <h3>Remove Friends</h3>
                    <input
                        type="text"
                        placeholder="Search for friends..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <ul className="popup-list">
                        {removeFilteredAccounts
                            .filter((account) => account.id.includes(searchQuery))
                            .map((account) => (
                                <li key={account.id}>
                                    <img 
                                        className="small-profile"
                                        alt="profile"
                                        src={account.profileImage || defaultProfileImg}
                                        onClick={() => toggleCard(account.id)}
                                    ></img>
                                    {account.id}
                                    <button onClick={() => removeFriend(account.id)}>Remove</button>
                                </li>
                            ))}
                    </ul>
                    <div className="splitter"></div>
                    <button className="close-popup" onClick={toggleRemoveFriendPopup}>Close</button>
                </div>
            )}
    
            {/* Leave Chat Room Popup */}
            {showLeaveChatPopup && (
                <div className="popup">
                    <h3>Leave Chat Rooms</h3>
                    <input
                        type="text"
                        placeholder="Search for friends..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <ul className="popup-list">
                        {removeFilteredRooms
                            .filter((room) => room.title.includes(searchQuery))
                            .map((room) => (
                                <li key={room.id}>
                                    {room.title}
                                    <button onClick={() => leaveRoom(room.id)}>Leave</button>
                                </li>
                            ))}
                    </ul>
                    <div className="splitter"></div>
                    <button className="close-popup" onClick={toggleLeaveChatPopup}>Close</button>
                </div>
            )}
            
            {/* Friend Popup */}
            {showFriendPopup && (
                <div className="popup">
                    <h3>Add Friends</h3>
                    <input
                        type="text"
                        placeholder="Search for friends..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <ul className="popup-list">
                        {filteredAccounts
                            .filter((account) => account.id.includes(searchQuery))
                            .map((account) => (
                                <li
                                    key={account.id}
                                    className={allAsked.includes(account.id) ? "asked" : ""}
                                >
                                    <img 
                                        className="small-profile"
                                        alt="profile"
                                        src={account.profileImage || defaultProfileImg}
                                        onClick={() => toggleCard(account.id)}
                                    ></img>
                                    {account.id}
                                    <button className={allAsked.includes(account.id) ? "disabled" : ""} onClick={() => askFriend(account.id)}>Add</button>
                                </li>
                            ))}
                    </ul>
                    <div className="splitter"></div>
                    <button className="close-popup" onClick={toggleFriendPopup}>Close</button>
                </div>
            )}

            {/* Chat Popup */}
            {showChatPopup && (
                <div className="popup">
                    <h3>Join Chat Room</h3>
                    <input
                        type="text"
                        placeholder="Search for chat rooms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <ul className="popup-list">
                        {filteredRooms
                            .filter((room) => room.title.includes(searchQuery))
                            .map((room) => (
                                <li key={room.id}>
                                    {room.title}
                                    <button onClick={() => joinRoom(room.id)}>Join</button>
                                </li>
                            ))}
                    </ul>
                    <div className="splitter"></div>
                    <button className="close-popup" onClick={toggleChatPopup}>Close</button>
                </div>
            )}

            {/* Waiting Popup */}
            {showWaitingPopup && (
                <div className="popup">
                    <h3>Accept Friends</h3>
                    <input
                        type="text"
                        placeholder="Search for waiting friends..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <ul className="popup-list">
                        {allWaitings
                            .filter((waiting) => waiting.userID.includes(searchQuery))
                            .map((waiting) => (
                                <li key={waiting.userID}>
                                    <img 
                                        className="small-profile"
                                        alt="profile"
                                        src={waiting.profileImage || defaultProfileImg}
                                        onClick={() => toggleCard(waiting.userID)}
                                    ></img>
                                    {waiting.userID}
                                    <span className="waiting-buttons">
                                        <button onClick={() => addFriend(waiting.userID)}>Accept</button>
                                        <button onClick={() => slapFriend(waiting.userID)}>Decline</button>
                                    </span>
                                </li>
                            ))}
                    </ul>
                    <div className="splitter"></div>
                    <button className="close-popup" onClick={toggleWaitingPopup}>Close</button>
                </div>
            )}

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
                                    src={userData.profileImage || defaultProfileImg}
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
        </div>
    )
}

export default MyPage;