import React, { useState } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

function UploadEmails() {
  const [status, setStatus] = useState('');

  const handleUpload = async () => {
    setStatus('⏳ Uploading...');

    try {
      const response = await fetch('/approvedEmails.txt');
      const text = await response.text();
      const emails = text
        .split('\n')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      for (const email of emails) {
        const docRef = doc(db, 'approvedStudents', email);
        await setDoc(docRef, { email });
      }

      setStatus('✅ All emails uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      setStatus('❌ Upload failed. See console.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Upload Approved Emails to Firestore</h2>
      <button
        onClick={handleUpload}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        Upload Emails
      </button>
      <p style={{ marginTop: '20px' }}>{status}</p>
    </div>
  );
}

export default UploadEmails;
