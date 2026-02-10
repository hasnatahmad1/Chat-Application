import { Routes, Route } from 'react-router'
import { LoginPage } from './pages/loginpage/LoginPage'
import { SignUpPage } from './pages/signuppage/SignUpPage'
import { Home } from './pages/homepage/Home'
import './App.css'


function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}

export default App
