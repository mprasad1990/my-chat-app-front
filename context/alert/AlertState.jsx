import { useState } from "react";
import AlertContext from "./AlertContext";

const AlertState = ({ children }) => {

    const [alertMessage, setAlertMessage] = useState({
        show: false,
        type: "success",
        message: ""
    });

    return (
      <AlertContext.Provider value={{alertMessage, setAlertMessage}}>
        {children}
      </AlertContext.Provider>
    );

}

export default AlertState;