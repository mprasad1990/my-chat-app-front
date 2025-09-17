import LoginContext from "./LoginContext";
import { useState } from "react";

const LoginState = ({ children }) => {

  const state = {
    "isLoggedIn": ((localStorage.getItem("isLoggedIn")) ? true : false),
    "token": (localStorage.getItem("token") || ""),
    "user": (localStorage.getItem("user") || "")
  }

  const [loginState, setLoginState] = useState(state);

  const updateLoginState = (isLoggedIn, token, user) => {

    setLoginState({ isLoggedIn, token, user });

    if(isLoggedIn === true){
      localStorage.setItem("isLoggedIn", true);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
    else{
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    
  }

  return (
    <LoginContext.Provider value={{ loginState, updateLoginState }}>
      {children}
    </LoginContext.Provider>
  )

}

export default LoginState;