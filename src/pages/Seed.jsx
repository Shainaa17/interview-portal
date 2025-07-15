// src/pages/Seed.jsx
import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '5:30–6:00',
  '6:00–6:30',
  '6:30–7:00',
  '7:00–7:30',
  '7:30–8:00',
  '8:00–8:30',
];

function Seed() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const seedSlots = async () => {
      const slotsRef = collection(db, 'slots');
      const snapshot = await getDocs(slotsRef);

      // ✅ Don't reseed if already seeded
      if (!snapshot.empty) {
        console.log("⚠️ Slots already exist. Skipping seeding.");
        setDone(true);
        return;
      }

      for (const day of days) {
        for (const time of timeSlots) {
          await addDoc(slotsRef, {
            day,
            time,
            seatsLeft: 5,
            bookedBy: [],
          });
        }
      }

      setDone(true);
    };

    seedSlots();
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Seeding Interview Slots into Firestore...</h2>
      {done ? <p>✅ Seeding Complete!</p> : <p>⏳ Seeding in progress...</p>}
    </div>
  );
}

export default Seed;
