// src/pages/Login.jsx
import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const docRef = doc(db, 'approvedStudents', email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        localStorage.setItem('email', email);
        navigate('/dashboard');
      } else {
        setError('❌ You are not approved to login.');
      }
    } catch (err) {
      setError('❌ Something went wrong. Check console.');
      console.error(err);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: '100px',
    }}>
      <h2>🎉 Congratulations on clearing the test!</h2>
      <p>Let’s move to the next round.</p>
      <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '10px', fontSize: '16px', width: '250px' }}
        />
        <br /><br />
        <button
          type="submit"
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          Login
        </button>
      </form>
      {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
    </div>
  );
}

export default Login;
