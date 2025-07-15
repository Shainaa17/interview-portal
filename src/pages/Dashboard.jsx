// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '5:30–6:00', '6:00–6:30', '6:30–7:00',
  '7:00–7:30', '7:30–8:00', '8:00–8:30'
];

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [slots, setSlots] = useState([]);
  const [bookedSlot, setBookedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      navigate('/'); // Redirect to login if email is missing
      return;
    }
    fetchSlots();
  }, [email]);

  const fetchSlots = async () => {
    const snapshot = await getDocs(collection(db, 'slots'));
    const slotList = [];
    let userBooked = null;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.bookedBy?.includes(email)) {
        userBooked = docSnap.id;
      }
      slotList.push({ id: docSnap.id, ...data });
    });

    setBookedSlot(userBooked);
    setSlots(slotList);
    setLoading(false);
  };

  const handleBooking = async (slotId) => {
    if (!email || bookedSlot) return;

    const slotRef = doc(db, 'slots', slotId);
    const slotSnap = await getDocs(collection(db, 'slots'));
    let selectedSlot;

    slotSnap.forEach((docSnap) => {
      if (docSnap.id === slotId) {
        selectedSlot = docSnap.data();
      }
    });

    if (selectedSlot?.seatsLeft > 0) {
      await updateDoc(slotRef, {
        seatsLeft: selectedSlot.seatsLeft - 1,
        bookedBy: [...selectedSlot.bookedBy, email]
      });
      setBookedSlot(slotId);
      fetchSlots();
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>⏳ Loading...</p>;

  return (
    <div style={{ padding: '30px' }}>
      {bookedSlot ? (
        <div style={{
          border: '2px solid green',
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto',
          borderRadius: '8px',
          textAlign: 'center',
          backgroundColor: '#e6ffe6'
        }}>
          <h3>✅ Thank you for registering!</h3>
          <p><strong>Time:</strong> {slots.find(s => s.id === bookedSlot)?.time}</p>
          <p><strong>Day:</strong> {slots.find(s => s.id === bookedSlot)?.day}</p>
          <p>We look forward to seeing you 🎉</p>
        </div>
      ) : (
        <>
          <h2>Book Your Interview Slot</h2>
          {days.map((day) => (
            <div key={day}>
              <h3>{day}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {timeSlots.map((time) => {
                  const slot = slots.find(
                    (s) => s.day === day && s.time === time
                  );

                  if (!slot) return null;

                  return (
                    <div key={time}
                      style={{
                        border: '1px solid #ccc',
                        padding: '10px',
                        borderRadius: '5px',
                        width: '160px',
                        background: slot.seatsLeft === 0
                          ? '#f8d7da'
                          : '#fff',
                        textAlign: 'center'
                      }}
                    >
                      <p><strong>{time}</strong></p>
                      <p>{slot.seatsLeft} seats remaining</p>
                      <button
                        onClick={() => handleBooking(slot.id)}
                        disabled={slot.seatsLeft === 0 || bookedSlot !== null}
                      >
                        Book
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default Dashboard;
