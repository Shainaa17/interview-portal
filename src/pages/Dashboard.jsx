// src/pages/Dashboard.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc
} from 'firebase/firestore';
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

   // Seed any missing slots
  const seedSlotsIfNotPresent = useCallback(async () => {
    const slotsRef = collection(db, 'slots');
    const snapshot = await getDocs(slotsRef);

    const existing = new Set();
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      existing.add(`${data.day}-${data.time}`);
    });

    for (const day of days) {
      for (const time of timeSlots) {
        const key = `${day}-${time}`;
        if (!existing.has(key)) {
          await addDoc(slotsRef, {
            day,
            time,
            seatsLeft: 5,
            bookedBy: [],
          });
        }
      }
    }
    console.log('✅ All slots ensured.');
  }, []);
   // Fetch all slots and find if this user is already booked
  const fetchSlots = useCallback(async () => {
    const slotsRef = collection(db, 'slots');
    const snapshot = await getDocs(slotsRef);

    const slotList = [];
    let userBooked = null;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.bookedBy?.includes(email)) {
        userBooked = docSnap.id;
      }
      slotList.push({ id: docSnap.id, ...data });
    });
// Sort by day then time
    slotList.sort((a, b) => {
      const dayDiff = days.indexOf(a.day) - days.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
    });

    setBookedSlot(userBooked);
    setSlots(slotList);
    setLoading(false);
  }, [email]);
// Booking logic
  const handleBooking = async (slotId) => {
    if (!email || bookedSlot) return;

    const slotRef = doc(db, 'slots', slotId);
    const snapshot = await getDocs(collection(db, 'slots'));

    let selectedSlot = null;
    snapshot.forEach((docSnap) => {
      if (docSnap.id === slotId) {
        selectedSlot = docSnap.data();
      }
    });

    if (selectedSlot?.seatsLeft > 0 && !selectedSlot.bookedBy.includes(email)) {
      await updateDoc(slotRef, {
        seatsLeft: selectedSlot.seatsLeft - 1,
        bookedBy: [...selectedSlot.bookedBy, email],
      });

      setBookedSlot(slotId);
      await fetchSlots(); // refresh
    }
  };

  useEffect(() => {
    if (!email) {
      navigate('/');
      return;
    }

    const init = async () => {
      await seedSlotsIfNotPresent();
      await fetchSlots();
    };

    init();
  }, [email, navigate, fetchSlots, seedSlotsIfNotPresent]);

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
          <p><strong>Day:</strong> {slots.find(s => s.id === bookedSlot)?.day}</p>
          <p><strong>Time:</strong> {slots.find(s => s.id === bookedSlot)?.time}</p>
          <p>We look forward to seeing you 🎉</p>
        </div>
      ) : (
        <>
          <h2 style={{ textAlign: 'center' }}>Book Your Interview Slot</h2>
          {days.map((day) => {
            const slotsForDay = slots.filter(s => s.day === day);
            return (
              <div key={day}>
                <h3>{day}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {timeSlots.map((time) => {
                    const slot = slotsForDay.find(s => s.time === time);
                    if (!slot) return null;

                    return (
                      <div key={time}
                        style={{
                          border: '1px solid #ccc',
                          padding: '10px',
                          borderRadius: '5px',
                          width: '160px',
                          background: slot.seatsLeft === 0 ? '#f8d7da' : '#fff',
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
            );
          })}
        </>
      )}
    </div>
  );
}

export default Dashboard;
