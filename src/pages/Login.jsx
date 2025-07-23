// src/pages/Login.jsx
import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import isteLogo from '../ISTE Thapar Chapter Logo blue.png';  // image in base (src/) folder

function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isHover, setIsHover] = useState(false); // hover state for button
  const [isFocused, setIsFocused] = useState(false); // focus state for input
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
      {/* Logo image outside the card */}
      <img src={isteLogo} alt="ISTE Thapar Chapter Logo" style={styles.image} />

      {/* Congratulations heading outside the card */}
      <h2 style={{ textAlign: 'center', marginTop: '10px', marginBottom: '30px', fontFamily: 'sans-serif' }}>
        🎉 Congratulations on clearing the test!
      </h2>

      <div style={styles.card}>
        <h3 style={{ marginBottom: '25px', marginTop: '-5px' }}>
          Let’s move to the next round now.
        </h3>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your approved email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              ...styles.input,
              borderColor: isFocused ? '#2712beff' : '#ccc',
              boxShadow: isFocused ? '0 0 5px #1e17d5ff' : 'none',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              outline: 'none'
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <button
            type="submit"
            style={{
              ...styles.button,
              backgroundColor: isHover ? '#1827caff' : '#4CAF50',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
          >
            Login
          </button>
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
    flexDirection: 'column',  // stack vertically
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'sans-serif'
  },
  image: {
    width: '200px',
    marginBottom: '20px',
    borderRadius: '10px',
    objectFit: 'contain',
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
    padding: '12px 16px',
    fontSize: '16px',
    marginBottom: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    boxSizing: 'border-box'
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
