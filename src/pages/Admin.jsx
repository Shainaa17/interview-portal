// src/pages/Admin.jsx
import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

function Admin() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resettingAll, setResettingAll] = useState(false);

  const fetchBookings = async () => {
    const snapshot = await getDocs(collection(db, 'slots'));
    const list = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.bookedBy && data.bookedBy.length > 0) {
        data.bookedBy.forEach(email => {
          list.push({
            slotId: docSnap.id,
            email,
            day: data.day,
            time: data.time
          });
        });
      }
    });

    setBookings(list);
    setLoading(false);
  };

  const handleResetAll = async () => {
    setResettingAll(true);
    const snapshot = await getDocs(collection(db, 'slots'));

    for (const slot of snapshot.docs) {
      await updateDoc(doc(db, 'slots', slot.id), {
        seatsLeft: 5,
        bookedBy: []
      });
    }

    await fetchBookings();
    setResettingAll(false);
    alert("✅ All slots reset.");
  };

  const handleResetSingle = async (slotId) => {
    await updateDoc(doc(db, 'slots', slotId), {
      seatsLeft: 5,
      bookedBy: []
    });

    await fetchBookings();
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin Panel</h2>

      <button
        onClick={handleResetAll}
        disabled={resettingAll}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        {resettingAll ? 'Resetting...' : 'Reset All Bookings'}
      </button>

      <h3>📋 Booked Slots</h3>
      {loading ? (
        <p>Loading...</p>
      ) : bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Day</th>
              <th>Time Slot</th>
              <th>Reset Slot</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => (
              <tr key={i}>
                <td>{b.email}</td>
                <td>{b.day}</td>
                <td>{b.time}</td>
                <td>
                  <button
                    onClick={() => handleResetSingle(b.slotId)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    🧹 Reset
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Admin;
