import React from 'react'
import { useState } from 'react'
import Signup from './components/Signup'
import { BrowserRouter as Router, Routes, Route, BrowserRouter} from 'react-router-dom'
import Login from './components/Login'
import Home from './pages/Home'
import Test from './components/test'

function App() {
  const [count, setCount] = useState(0)

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
