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

      if (!docSnap.exists()) {
        setError("You are not approved to log in.");
        return;
      }

      // ✅ Proceed to dashboard with email
      navigate('/dashboard', { state: { email } });

    } catch (err) {
      setError("Something went wrong during login.");
      console.error("Login Error:", err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>🎉 Congratulations on clearing the test!</h2>
        <p style={{ marginBottom: '20px' }}>Let’s move to the next round now.</p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your approved email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Login</button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f3ff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'sans-serif'
  },
  card: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
    width: '90%',
    maxWidth: '400px'
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    marginBottom: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: '16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  error: {
    color: 'red',
    marginTop: '10px'
  }
};

export default Login;
