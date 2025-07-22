import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  arrayRemove,
  getDoc
} from 'firebase/firestore';


const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeOrder = [
  '5:30-6:00',
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
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'bookings'));
    const list = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        uid: data.uid,
        day: data.day,
        time: data.time,
        slotId: data.slotId
      });
    });

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

  const resetBooking = async (bookingId, slotId, userEmailToReset) => {
    if (!window.confirm(`Are you sure you want to reset the booking for ${userEmailToReset}?`)) return;

    const slotRef = doc(db, 'slots', slotId);
    const bookingRef = doc(db, 'bookings', bookingId);

    try {
      // 1. Remove the specific booking document
      await deleteDoc(bookingRef);

      // 2. Increment seatsLeft AND remove userEmail from bookedBy array in the slot
      const slotDocSnap = await getDoc(slotRef);
      if (slotDocSnap.exists()) {
        const slotData = slotDocSnap.data();
        const currentSeats = slotData.seatsLeft || 0;

        await updateDoc(slotRef, {
          seatsLeft: currentSeats + 1,
          bookedBy: arrayRemove(userEmailToReset)
        });
      } else {
        console.warn(`Slot document with ID ${slotId} not found.`);
      }

      fetchBookings();
    } catch (error) {
      console.error("Error resetting booking:", error);
      alert("Failed to reset booking. See console for details.");
    }
  };

  const resetAll = async () => {
    if (!window.confirm("Are you sure you want to reset ALL bookings? This action cannot be undone.")) return;

    setLoading(true);
    try {
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const slotsSnap = await getDocs(collection(db, 'slots'));

      const deleteBookingPromises = bookingsSnap.docs.map(docSnap =>
        deleteDoc(doc(db, 'bookings', docSnap.id))
      );

      const slotResetPromises = slotsSnap.docs.map(docSnap =>
        updateDoc(doc(db, 'slots', docSnap.id), {
          seatsLeft: 5, // Or your initial max seats
          bookedBy: []
        })
      );

      await Promise.all([...deleteBookingPromises, ...slotResetPromises]);
      alert("All bookings have been reset!");
      fetchBookings();
    } catch (error) {
      console.error("Error resetting all bookings:", error);
      alert("Failed to reset all bookings. See console for details.");
      setLoading(false);
    }
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
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email (User ID)</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Day</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Time</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{b.uid}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{b.day}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{b.time}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  {/* Moved comment here for clarity */}
                  {/* Pass user's email for arrayRemove */}
                  <button
                    onClick={() => resetBooking(b.id, b.slotId, b.uid)}
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