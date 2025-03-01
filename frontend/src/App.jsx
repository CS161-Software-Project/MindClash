import React, { useEffect } from 'react'
import { useState } from 'react'
import Signup from './components/Signup'
import { BrowserRouter as Router, Routes, Route, BrowserRouter} from 'react-router-dom'
import Login from './components/Login'
import Home from './pages/Home'
import Test from './components/test'
import Loader from "./pages/Loader"

function App() {
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    setTimeout(()=>{
      setLoading(false);
    },2000);
  },[]);

  if(loading){
    return <Loader text='Initializing MindClash...'/>
  }

  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/test' element={<Test />} />
      </Routes>
    </Router>
  )
}

export default App
