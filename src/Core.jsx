import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Alert from './util/Alert';
import Login from './Login';
import Signup from './Signup';
import Chat from './Chat';
import LoginContext from '../context/login/LoginContext';
import AlertContext from '../context/alert/AlertContext';
import UpdateProfile from './UpdateProfile';
import UpdateAvatar from './UpdateAvatar';

export default function Core() {

    const loginContext  = useContext(LoginContext);
    const alertContext = useContext(AlertContext);

    const isLoggedIn    = loginContext.loginState.isLoggedIn;
    const token         = loginContext.loginState.token;
    console.log("isLoggedIn: ", isLoggedIn);
    console.log("token: ", token);
    return (
        <BrowserRouter>
            <div>
                {alertContext.alertMessage.show && <Alert type={alertContext.alertMessage.type} message={alertContext.alertMessage.message}/>}
                {
                    (isLoggedIn === true && token !== "") && <Routes>
                        <Route path="/chat" element={ <Chat /> } />
                        <Route path="/update-profile" element={ <UpdateProfile /> } />
                        <Route path="/update-avatar" element={ <UpdateAvatar /> } />
                        <Route path="*" element={<Navigate to="/chat"/>}></Route>
                    </Routes>
                }
                {
                    (isLoggedIn === false && token === "") && <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="*" element={<Navigate to="/"/>}></Route>
                    </Routes>
                }
            </div>
        </BrowserRouter>
    )
}
