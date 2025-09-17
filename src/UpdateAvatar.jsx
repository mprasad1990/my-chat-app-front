import React, { useEffect, useContext, useCallback, useRef, useState, use } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AlertContext from '../context/alert/AlertContext';
import LoginContext from '../context/login/LoginContext';
import './UpdateAvatar.css';
import getCroppedImg from '../cropper/Crop';
import Slider from "@mui/material/Slider";
import Cropper from "react-easy-crop";
import {Modal, Button} from 'react-bootstrap';

export default function UpdateAvatar() {

  const alertContext  = useContext(AlertContext);
  const loginContext = useContext(LoginContext);

  const navigate = useNavigate();

  const [userDetails, setUserDetails] = useState([]);

  const aspectRatio = 1;
  const [cropWidth, cropHeight] = [250, 250];
  const [image, setImage] = useState('/images/profileplaceholder.jpg');
  const [crop, setCrop]   = useState({ x: 0, y: 0 });
  const [zoom, setZoom]   = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const inputFileRef = useRef(null);
  const triggerInputFileCLick = (event) => {
    inputFileRef.current.click();
  }

  const handleImageUpload = async (e) => {
    const selectedFile = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const base64Image = e.target.result;
      setImage(base64Image);
    };
    reader.readAsDataURL(selectedFile);
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const user  = JSON.parse(localStorage.getItem('user') || '{}');
      const res   = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/fetch-profile`, 
          {
              account_key: user.account_key || ''
          },
          {
              headers: { Authorization: `Bearer ${token}` }   
          }
      );
      const userDetails = res.data;
      setUserDetails(userDetails);
      if(userDetails.profile_image !== ""){
        var imageConfig = JSON.parse(userDetails.profile_image);
        setImage(userDetails.source_image);
        setCrop(imageConfig.crop);
        setZoom(imageConfig.zoom);
        setRotation(imageConfig.rotation);
        setCroppedAreaPixels(imageConfig.crop_area);
        setCroppedImage(userDetails.shared_image);
      }
    } 
    catch (err) {
      alertContext.setAlertMessage({ show:true, type: 'error', message: 'Failed to fetch profile. Please try again.' });
    }
  };


  useEffect(() => {

    fetchUserProfile();

    // eslint-disable-next-line
    
  }, [])

  const backToChat = () => {
    navigate('/chat');
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if(image.indexOf("profileplaceholder.jpg") >= 0){
      alertContext.setAlertMessage({show:true, type: "error", message: "Please select a profile image!"});
    }
    else {

      try {

        let currentCroppedImage = await getCroppedImg(image, croppedAreaPixels, rotation, cropWidth, cropHeight);

        let imageExtension  = 'jpg'; // fallback to png if not found
        let imageName       = `profile_image.${imageExtension}`;

        let imageConfig = {
          'name': imageName,
          'crop_area': croppedAreaPixels,
          'rotation': rotation,
          'zoom': zoom,
          'crop': crop,
        }
        
        const token = localStorage.getItem('token');
        const user  = JSON.parse(localStorage.getItem('user') || '{}');
        const res   = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/update-profile-image`,
          {
            image_config: JSON.stringify(imageConfig),
            source_image: image,
            cropped_image: currentCroppedImage
          },
          {
            headers: { Authorization: `Bearer ${token}` }   
          }
        );

        if(res.data.success){
          alertContext.setAlertMessage({ show:true, type: 'success', message: 'Profile image updated successfully!' });
        }
        else{
          alertContext.setAlertMessage({ show:true, type: 'error', message: 'Profile image updated failed!' });
        }

      } 
      catch (error) {
        alertContext.setAlertMessage({ show:true, type: 'error', message: 'Error updating profile image. Please try again.' });
      }
    }
  }

  const updateAvatar = async (index) => {
    const token = localStorage.getItem('token');
    const user  = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/update-avatar`, 
        {
          account_key: user.account_key || '',
          avatar: index
        },
        {
          headers: { Authorization: `Bearer ${token}` }   
        }
      );
      if(res.data.success){
        alertContext.setAlertMessage({ show:true, type: 'success', message: 'Avatar updated successfully!' });
        setUserDetails(prev => ({ ...prev, avatar: index }));
      }
      else{
        alertContext.setAlertMessage({ show:true, type: 'error', message: 'Avatar update failed!' });
      }
    } 
    catch (err) {
      alertContext.setAlertMessage({ show:true, type: 'error', message: 'Failed to update avatar. Please try again.' });
    }
  }

  const updateProfileImageSettings = async (e) => {
    const selectedValue = e.target.value;
    const token = localStorage.getItem('token');
    const user  = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/update-profile-image-settings`, 
        {
          account_key: user.account_key || '',
          profile_image_type: selectedValue
        },
        {
          headers: { Authorization: `Bearer ${token}` }   
        }
      );
      if(res.data.success){
        alertContext.setAlertMessage({ show:true, type: 'success', message: 'Profile image settings updated successfully!' });
        setUserDetails(prev => ({ ...prev, profile_image_type: selectedValue }));
      }
      else{
        alertContext.setAlertMessage({ show:true, type: 'error', message: 'Profile image settings update failed!' });
      }
    } 
    catch (err) {
      alertContext.setAlertMessage({ show:true, type: 'error', message: 'Failed to update profile image settings. Please try again.' });
    }
  }


  return (
    <div className="update-avatar-container">

      {/*Radio button to select single avatar among multiple */}
      
     

      <form className="update-avatar-form" >

        <div className="profile-image-settings">
          <div className="row">
            <div className="col-12 label">Profile Image Settings:</div>
            <div className="col-12">
              <select className="form-select" id="settings" name="settings" value={userDetails.profile_image_type || 'disabled'} onChange={updateProfileImageSettings}>
                <option key="disabled" value="disabled">Disabled</option>
                <option key="avatar" value="avatar">Avatar</option>
                <option key="profile_image" value="profile_image">Profile Image</option>
              </select>
            </div>
          </div>
        </div>

        <h2>Update Avatar</h2>
        <div className="mb-3">
          <div className="row">
            <div className="col-12">
              <div className="avatar-selection">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="avatar-option">
                    <label htmlFor={`avatar-${index}`}>
                      <img className="round-image-big" src={`/images/avatar-${index}.jpg`} alt={`Avatar ${index}`} />
                    </label>
                    <input
                      type="radio"
                      id={`avatar-${index}`}
                      name="avatar"
                      value={index}
                      checked={userDetails.avatar === index}
                      onChange={() => updateAvatar(index)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <h2>Update Profile Image</h2>
        <div className="mb-3">
          <div className="row">
            <div className="col-12">
              <div className="current-image">
                <div className="container" style={{ width: "300px", height: "300px" }}>
                  <div className="crop-container">
                    <Cropper
                      image={image}
                      crop={crop}
                      rotation={rotation}
                      zoom={zoom}
                      zoomSpeed={4}
                      maxZoom={3}
                      zoomWithScroll={true}
                      showGrid={true}
                      aspect={aspectRatio}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      onRotationChange={setRotation}
                    />
                  </div>
                </div>
                <div className="controls">
                  <label>
                    Rotate
                    <Slider
                      value={rotation}
                      min={0}
                      max={360}
                      step={1}
                      aria-labelledby="rotate"
                      onChange={(e, rotation) => setRotation(rotation)}
                      className="range"
                    />
                  </label>
                  <label>
                    Zoom
                    <Slider
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="zoom"
                      onChange={(e, zoom) => setZoom(zoom)}
                      className="range"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="update-avatar-actions">
          <button type="button" className="back-btn" onClick={backToChat}>
              Back to Chat
          </button>
          <button type="button" 
            className="upload-btn" onClick={triggerInputFileCLick}>
            Upload
            <input
                type="file"
                ref={inputFileRef}
                name="cover"
                onChange={handleImageUpload}
                accept="img/*"
                style={{ display: "none" }}
              />
          </button>
          <button type="submit" className="update-btn" onClick={handleFormSubmit}>
              Save
          </button>
        </div>
      </form>
    </div>
  )
}
