import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeOrder = [
  '5:30–6:00',
  '6:00–6:30',
  '6:30–7:00',
  '7:00–7:30',
  '7:30–8:00',
  '8:00–8:30'
];

function Admin() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const snapshot = await getDocs(collection(db, 'slots'));
    const list = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const slotId = docSnap.id;

      data.bookedBy?.forEach(email => {
        list.push({
          id: slotId,
          day: data.day,
          time: data.time,
          email
        });
      });
    });

    // Sorting logic
    list.sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return timeOrder.indexOf(a.time) - timeOrder.indexOf(b.time);
    });

    setBookings(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const resetSlot = async (slotId, email) => {
    const slotRef = doc(db, 'slots', slotId);
    const slotSnap = await getDocs(collection(db, 'slots'));

    const slotDoc = slotSnap.docs.find(d => d.id === slotId);
    const data = slotDoc.data();

    const updatedBookedBy = data.bookedBy.filter(e => e !== email);
    const updatedSeatsLeft = data.seatsLeft + 1;

    await updateDoc(slotRef, {
      bookedBy: updatedBookedBy,
      seatsLeft: updatedSeatsLeft
    });

    fetchBookings(); // Refresh list
  };

  const resetAll = async () => {
    const snapshot = await getDocs(collection(db, 'slots'));
    const promises = [];

    snapshot.forEach((docSnap) => {
      const ref = doc(db, 'slots', docSnap.id);
      promises.push(updateDoc(ref, {
        bookedBy: [],
        seatsLeft: 5
      }));
    });

    await Promise.all(promises);
    fetchBookings();
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>📋 Bookings Admin Panel</h2>
      <button
        onClick={resetAll}
        style={{
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          margin: '20px 0',
          cursor: 'pointer'
        }}
      >
        Reset All Bookings
      </button>

      {loading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Day</th>
              <th style={thStyle}>Time</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => (
              <tr key={i}>
                <td style={tdStyle}>{b.email}</td>
                <td style={tdStyle}>{b.day}</td>
                <td style={tdStyle}>{b.time}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => resetSlot(b.id, b.email)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ff9800',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Reset
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

const thStyle = {
  padding: '12px',
  textAlign: 'left',
  borderBottom: '2px solid #ddd'
};

const tdStyle = {
  padding: '12px',
  borderBottom: '1px solid #ddd'
};

export default Admin;
