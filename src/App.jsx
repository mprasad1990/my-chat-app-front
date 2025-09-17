import LoginState from '../context/login/LoginState'
import AlertState from '../context/alert/AlertState'
import './App.css'
import Core from './Core'

function App() {

  return (
    <LoginState>
      <AlertState>
        <Core />
      </AlertState>
    </LoginState>
  )
}

export default App