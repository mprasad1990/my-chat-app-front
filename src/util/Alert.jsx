import React, { useContext } from 'react'
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import AlertContext from '../../context/alert/AlertContext';

export default function Alert(props) {

  const alertContext = useContext(AlertContext);

  const onCloseToast = () => {
    alertContext.setAlertMessage({show:false, type: "success", message: ""});
  }

  const showToastMessage = () => { 

    if(props.type==="success"){
      toast.success(props.message, {
        autoClose: 2000,
        position: toast.TOP_CENTER,
        onClose: onCloseToast,
        toastId: "success"
      });
    }
    else{
      toast.error(props.message, {
        autoClose: 2000,
        position: toast.TOP_CENTER,
        onClose: onCloseToast,
        toastId: "error"
      });
    }
    
  };

  toast.dismiss();

  if(props.message && props.message !== ""){
    showToastMessage();
  }

  return (
    <div>
      <ToastContainer />
    </div>
  )

}
