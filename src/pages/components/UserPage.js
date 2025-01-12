import React, { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { database } from "../../firebaseDB/firebaseConfig";
import "../../style/UserPage.css";

function UserPage(props) {
    const defaultProfileImg = "https://i.imgur.com/vGQOCga.jpeg";
    const userID = props.userID;
    const [userData, setUserData] = useState({});
    const [isEditing, setIsEditing] = useState(false); // 수정 모드 상태
    const [editData, setEditData] = useState({}); // 수정할 데이터 상태
    const [uploadImgUrl, setUploadImgUrl] = useState("");
    const [originImg, setOriginImg] = useState("");

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(database, "UserInfo", userID), (snapshot) => {
            const getData = snapshot.data();
            if (getData) {
                let data = {
                    userID: userID,
                    userName: getData.name,
                    userEmail: getData.email,
                    userInsta: getData.instagram,
                    userMore: getData.more,
                    profileImage: getData.profileImage || defaultProfileImg, // 프로필 이미지 URL
                };
                setUserData(data);
                setOriginImg(data.profileImage);
                if (!isEditing) setEditData(data);
            } else {
                console.log("등록된 정보가 없습니다");
            }
        });
        return () => unsubscribe(); // 구독 해제
    }, [userID, isEditing]);

    // 입력값 변경 핸들러
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Edit 버튼 클릭 핸들러
    const onClickEditInfo = () => {
        setIsEditing(true); // 수정 모드로 전환
    };

    const onClickQuitEdit = () => {
        setIsEditing(false);
        setEditData({});
        setUploadImgUrl("");
    };

    // Save 버튼 클릭 핸들러
    const onClickSaveInfo = async () => {
        setIsEditing(false); // 편집 모드 종료
        const userDocRef = doc(database, "UserInfo", userID);
        try {
            await updateDoc(userDocRef, {
                name: editData.userName,
                email: editData.userEmail,
                instagram: editData.userInsta,
                more: editData.userMore,
                profileImage: uploadImgUrl || editData.profileImage, // 프로필 이미지 URL 저장
            });
            console.log("Document successfully updated!");
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    };

    const onchangeImageUpload = async (e) => {
        const {files} = e.target;
        const uploadFile = files[0];
        if (uploadFile) {
            const formData = new FormData();
            formData.append("image", uploadFile);

            try {
                if (originImg !== "") {
                    const deleteHash = originImg.split('/').pop().split('.')[0];
                    await fetch(`https://api.imgur.com/3/image/${deleteHash}`, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Client-ID ${process.env.REACT_APP_IMGUR_CLIENT_ID}`,
                        },
                    });
                }
            } catch (e) {
                console.error("There was no image to delete.");
            }

            const res = await fetch("https://api.imgur.com/3/image", {
                method: "POST",
                headers: {
                    Authorization: `Client-ID ${process.env.REACT_APP_IMGUR_CLIENT_ID}`,
                    Accept: 'application/json',
                },
                body: formData,
            });
            const result = await res.json();
            const { link } = result.data;

            setUploadImgUrl(link);
        }
    }

    return (
        <div className="user-wrapper">
            {isEditing ? (
                // 수정 모드일 때 입력 필드 표시
                <div className="profile-edit-frame">
                    <div className="img-field profile-icon">
                        {uploadImgUrl ? (
                                <img
                                    src={uploadImgUrl}
                                    alt="Profile"
                                    className="profile-image"
                                    onClick={() => document.getElementById("profileImageInput").click()}
                                />
                            ) : (
                                <div className="placeholder-icon" onClick={() => document.getElementById("profileImageInput").click()}>No Image</div>
                            )}
                        <input
                            type="file"
                            accept="image/*"
                            name="profileImage"
                            id="profileImageInput"
                            style={{display: "none"}}
                            onChange={onchangeImageUpload}
                        />
                    </div>
                    <div className="edit-field">
                        <div>
                            NAME: <input type="text" name="userName" value={editData.userName} onChange={handleChange} />
                        </div>
                        <div>
                            Email: <input type="text" name="userEmail" value={editData.userEmail} onChange={handleChange} />
                        </div>
                        <div>
                            Instagram: <input type="text" name="userInsta" value={editData.userInsta} onChange={handleChange} />
                        </div>
                        <div>
                            More: <input type="text" name="userMore" value={editData.userMore} onChange={handleChange} />
                        </div>
                        <div className="btns">
                            <button className="editInfo" onClick={onClickSaveInfo}>Save</button>
                            <button className="quitEdit" onClick={onClickQuitEdit}>Quit</button>
                        </div>
                    </div>
                </div>
            ) : (
                // 일반 모드일 때 텍스트만 표시
                <div className="profile-frame">
                    <div className="profile-header">
                        <div className="profile-icon">
                            {userData.profileImage ? (
                                <img src={userData.profileImage} alt="User Profile" className="profile-image" />
                            ) : (
                                <div className="placeholder-icon">No Image</div>
                            )}
                        </div>
                        <div className="profile-name">{userData.userName}</div>
                    </div>
                    <div className="user-info">
                        <div>Email     | {userData.userEmail}</div>
                        <div>Instagram | {userData.userInsta}</div>
                        <div>More      | {userData.userMore}</div>
                    </div>
                    <button className="editInfo" onClick={onClickEditInfo}>Edit</button>
                </div>
            )}
        </div>
    );
}

export default UserPage;
