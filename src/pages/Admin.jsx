import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteField // Import deleteField if you prefer to remove the field entirely
} from 'firebase/firestore'; // Make sure deleteField is imported

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
// Ensure this timeOrder exactly matches your Firebase 'time' field values
// and the slotTimings array in Dashboard.jsx
const timeOrder = [
  '5:30-6:00', // Assuming standard hyphen based on your last Dashboard.jsx
  '6:00-6:30',
  '6:30-7:00',
  '7:00-7:30',
  '7:30-8:00',
  '8:00-8:30'
];

function Admin() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true); // Set loading true at the start of fetch
    const snapshot = await getDocs(collection(db, 'slots'));
    const list = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const slotId = docSnap.id;

      // Check if bookedBy exists and is a string (meaning it's a UID)
      if (data.bookedBy && typeof data.bookedBy === 'string') {
        list.push({
          id: slotId,
          day: data.day,
          time: data.time,
          bookedBy: data.bookedBy // Storing the UID here
        });
      }
      // If data.bookedBy is an array (from old system or direct admin changes)
      // you might add logic here to handle it, but it contradicts "one user, one slot"
      // else if (Array.isArray(data.bookedBy) && data.bookedBy.length > 0) {
      //     data.bookedBy.forEach(emailOrUID => {
      //         list.push({ id: slotId, day: data.day, time: data.time, bookedBy: emailOrUID });
      //     });
      // }
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

  // Reset a specific slot by setting bookedBy to null and incrementing seatsLeft
  const resetSlot = async (slotId, bookedById) => {
    // Confirm with admin before resetting
    if (!window.confirm(`Are you sure you want to reset the slot booked by ${bookedById}?`)) {
      return;
    }

    const slotRef = doc(db, 'slots', slotId);
    let currentSeatsLeft = 0; // Default

    // Get the current seatsLeft before updating
    const slotSnap = await getDocs(collection(db, 'slots')); // Re-fetching all is inefficient but works for now
    const slotDoc = slotSnap.docs.find(d => d.id === slotId);

    if (slotDoc) {
      currentSeatsLeft = slotDoc.data().seatsLeft || 0;
    }

    // Update the document
    await updateDoc(slotRef, {
      bookedBy: null, // Set bookedBy to null (or deleteField(bookedBy) if you prefer to remove the field)
      seatsLeft: currentSeatsLeft + 1
    });

    fetchBookings(); // Refresh list after update
  };

  // Reset all bookings by setting bookedBy to null and seatsLeft to 5 for all slots
  const resetAll = async () => {
    if (!window.confirm("Are you sure you want to reset ALL bookings and set seats back to 5 for all slots? This cannot be undone!")) {
      return;
    }

    const snapshot = await getDocs(collection(db, 'slots'));
    const promises = [];

    snapshot.forEach((docSnap) => {
      const ref = doc(db, 'slots', docSnap.id);
      promises.push(updateDoc(ref, {
        bookedBy: null, // Set bookedBy to null for all
        seatsLeft: 5 // Reset seatsLeft to initial value (adjust if your initial is different)
      }));
    });

    await Promise.all(promises);
    fetchBookings(); // Refresh list
  };

  const thStyle = {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #ddd'
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #ddd'
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={thStyle}>Booked By (User ID)</th> {/* Changed from Email to User ID */}
              <th style={thStyle}>Day</th>
              <th style={thStyle}>Time</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => (
              <tr key={b.id + b.bookedBy}> {/* Use a more unique key */}
                <td style={tdStyle}>{b.bookedBy}</td> {/* Displaying User ID */}
                <td style={tdStyle}>{b.day}</td>
                <td style={tdStyle}>{b.time}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => resetSlot(b.id, b.bookedBy)}
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

export default Admin;