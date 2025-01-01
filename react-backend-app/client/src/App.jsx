import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JamRoomFinder from './JamRoomFinder';
import JamRoomDetails from './components/JamRoomDetails'; // New detailed page

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JamRoomFinder />} />
        <Route path="/jam-room/:id" element={<JamRoomDetails />} />
      </Routes>
    </Router>
  );
}

export default App;