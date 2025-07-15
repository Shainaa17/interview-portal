// src/App.js
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadEmails from './pages/UploadEmails';
import Seed from './pages/Seed';
import { db } from './firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import Admin from './pages/Admin';





function App() {
  useEffect(() => {
    const uploadApprovedEmails = async () => {
      try {
        const response = await fetch('/approvedEmails.txt');
        const text = await response.text();

        const emails = text
          .split('\n')
          .map(e => e.trim())
          .filter(e => e.length > 0 && e.includes('@'));

        for (const email of emails) {
          const docRef = doc(db, 'approvedStudents', email);
          await setDoc(docRef, { email });
        }

        console.log('✅ Approved emails uploaded successfully');
      } catch (error) {
        console.error('❌ Failed to upload emails:', error);
      }
    };

    uploadApprovedEmails();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload-emails" element={<UploadEmails />} />
        <Route path="/seed" element={<Seed />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
