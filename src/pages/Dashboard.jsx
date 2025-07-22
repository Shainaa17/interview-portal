import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { useLocation } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, getDoc, arrayUnion, addDoc, query, where } from "firebase/firestore";
import "../App.css";

const Dashboard = () => {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [allIndividualSlotsData, setAllIndividualSlotsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingMessage, setBookingMessage] = useState("");
  const [showConfirmationCard, setShowConfirmationCard] = useState(false);
  const [bookedSlotDetails, setBookedSlotDetails] = useState(null);
  const [hasUserBookedAnySlot, setHasUserBookedAnySlot] = useState(false);

  const location = useLocation();
  const userEmail = location.state?.email;

  // ✅ LOG: See the user email when Dashboard loads
  console.log("Dashboard Loaded. Current User Email:", userEmail);
  console.log("Initial hasUserBookedAnySlot state:", hasUserBookedAnySlot);


  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const slotTimings = ["5:30-6:00", "6:00-6:30", "6:30-7:00", "7:00-7:30", "7:30-8:00", "8:00-8:30"];

  const fetchAllSlots = async () => {
    setLoading(true);
    try {
      const slotsCollection = collection(db, "slots");
      const slotsSnapshot = await getDocs(slotsCollection);
      const slots = slotsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllIndividualSlotsData(slots);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setLoading(false);
      setBookingMessage("Failed to load slots. Please try again.");
    }
  };

  useEffect(() => {
    fetchAllSlots();
  }, []);

  useEffect(() => {
    if (userEmail) { // Only run this check if userEmail is available
      const checkIfAlreadyBookedAnySlot = async () => {
        // ✅ LOG: Confirm check is running for this email
        console.log("Running global booking check for:", userEmail);
        try {
          const bookingsRef = collection(db, "bookings");
          const q = query(bookingsRef, where("uid", "==", userEmail));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            // ✅ LOG: Confirm if a booking was found
            console.log(`Booking found for ${userEmail}! Setting hasUserBookedAnySlot to true.`);
            setHasUserBookedAnySlot(true);
            setBookingMessage("You have already booked one slot. Only one booking per user is allowed.");
          } else {
            // ✅ LOG: Confirm no booking was found
            console.log(`No existing booking found for ${userEmail}.`);
            setHasUserBookedAnySlot(false); // Ensure it's false if no booking found
          }
        } catch (error) {
          console.error("Error checking for existing user bookings:", error);
          setBookingMessage("Error checking previous bookings.");
        }
      };
      checkIfAlreadyBookedAnySlot();
    } else {
        // ✅ LOG: User email not available
        console.log("User email not available, skipping global booking check.");
    }
  }, [userEmail]); // Re-run this effect if userEmail changes

  const handlePrevious = () => {
    setCurrentDayIndex((prev) => (prev > 0 ? prev - 1 : days.length - 1));
    setBookingMessage("");
  };

  const handleNext = () => {
    setCurrentDayIndex((prev) => (prev < days.length - 1 ? prev + 1 : 0));
    setBookingMessage("");
  };

  const currentDay = days[currentDayIndex];

  const currentDaySpecificSlots = allIndividualSlotsData.filter(
    (slot) => slot.day === currentDay
  );

  const handleBookSlot = async (slotId, slotTimeForDisplay) => {
    // ✅ LOG: Check hasUserBookedAnySlot value at the start of booking attempt
    console.log("handleBookSlot called. hasUserBookedAnySlot at start:", hasUserBookedAnySlot);

    if (!userEmail) {
      alert("Error: Your email could not be retrieved. Please try logging in again.");
      setBookingMessage("Booking failed: User email not found.");
      return;
    }

    if (hasUserBookedAnySlot) {
      // ✅ LOG: Confirm if booking is being prevented
      console.log("Booking prevented: User already has a slot globally.");
      setBookingMessage("You have already booked a slot. Only one booking per user is allowed.");
      return;
    }

    setBookingMessage("Checking slot availability...");

    try {
      const slotDocRef = doc(db, "slots", slotId);
      const slotSnapshot = await getDoc(slotDocRef);

      if (!slotSnapshot.exists()) {
        alert("Slot does not exist.");
        setBookingMessage("Booking failed: Slot not found.");
        return;
      }

      const slotData = slotSnapshot.data();
      const currentSeatsLeft = slotData.seatsLeft;
      const bookedByArray = slotData.bookedBy || [];

      const alreadyBookedThisSpecificSlot = bookedByArray.includes(userEmail);

      if (alreadyBookedThisSpecificSlot) {
        alert(`You (${userEmail}) have already booked this specific slot.`);
        setBookingMessage("Booking failed: Already booked this specific slot by you.");
        return;
      }

      if (currentSeatsLeft <= 0) {
        alert("No seats left for this slot.");
        setBookingMessage("Booking failed: No seats available.");
        return;
      }

      const confirmBooking = window.confirm(
        `Are you sure you want to book the ${slotTimeForDisplay} slot on ${currentDay} for ${userEmail}?`
      );

      if (!confirmBooking) {
        setBookingMessage("Booking cancelled by user.");
        return;
      }

      setBookingMessage("Booking your slot...");

      const newSeatsLeft = currentSeatsLeft - 1;

      await updateDoc(slotDocRef, {
        seatsLeft: newSeatsLeft,
        bookedBy: arrayUnion(userEmail),
      });

      await addDoc(collection(db, "bookings"), {
        uid: userEmail,
        day: currentDay,
        time: slotTimeForDisplay,
        slotId: slotId,
        bookedAt: new Date(),
      });

      setAllIndividualSlotsData((prevSlotsData) =>
        prevSlotsData.map((slot) =>
          slot.id === slotId
            ? {
                ...slot,
                seatsLeft: newSeatsLeft,
                bookedBy: [...new Set([...bookedByArray, userEmail])]
              }
            : slot
        )
      );

      // ✅ Set hasUserBookedAnySlot to true AFTER a successful booking
      console.log("Booking successful. Setting hasUserBookedAnySlot to true.");
      setHasUserBookedAnySlot(true);

      setBookedSlotDetails({
        day: currentDay,
        time: slotTimeForDisplay,
        seatsRemaining: newSeatsLeft,
        email: userEmail,
      });

      setShowConfirmationCard(true);
      setBookingMessage("");

    } catch (error) {
      console.error("Error booking slot:", error);
      alert("An error occurred while booking the slot. Please try again.");
      setBookingMessage("Error booking slot. Please check console.");
      setBookedSlotDetails(null);
      setShowConfirmationCard(false);
    }
  };

  const ConfirmationCard = ({ details }) => {
    if (!details) return null;
    return (
      <div className="card confirmation-card">
        <h2 className="title">Booking Confirmed!</h2>
        <p>Thank you for booking your slot.</p>
        <div className="booking-details">
          <p><strong>Date:</strong> {details.day}</p>
          <p><strong>Time:</strong> {details.time}</p>
          <p><strong>Seats Remaining:</strong> {details.seatsRemaining}</p>
          {details.email && <p><strong>Booked By:</strong> {details.email}</p>}
        </div>
        <p className="note-screenshot">
          <span className="warning">⚠️ Note:</span> Please take a screenshot of this confirmation for your records.
        </p>
      </div>
    );
  };

  return (
    <div className="container">
      {showConfirmationCard ? (
        <ConfirmationCard details={bookedSlotDetails} />
      ) : (
        <>
          <h1 className="title">Please Book Your Interview Slot</h1>
          <div className="card">
            <div className="card-header">
              <button onClick={handlePrevious}>&larr;</button>
              <h2>{currentDay}</h2>
              <button onClick={handleNext}>&rarr;</button>
            </div>
            <div className="slots">
              {loading ? (
                <p>Loading...</p>
              ) : currentDaySpecificSlots.length > 0 ? (
                slotTimings.map((time, index) => {
                  const specificSlot = currentDaySpecificSlots.find(
                    (s) => {
                      const normalizedFirebaseTime = s.time.replace(/–|—/g, '-');
                      return normalizedFirebaseTime === time;
                    }
                  );

                  const seatsAvailable = specificSlot ? specificSlot.seatsLeft : "N/A";
                  const isBookedOut = seatsAvailable === 0;

                  // ✅ LOG: Check button state logic
                  const disableButton = isBookedOut || !specificSlot || seatsAvailable === "N/A" || hasUserBookedAnySlot;
                  const buttonText = isBookedOut ? "Booked Out" : (hasUserBookedAnySlot ? "Already Booked" : "Book Now");
                  console.log(`Slot: ${time}, hasUserBookedAnySlot: ${hasUserBookedAnySlot}, disableButton: ${disableButton}, buttonText: ${buttonText}`);


                  return (
                    <div
                      className={`slot ${isBookedOut ? "booked-out" : ""}`}
                      key={time}
                    >
                      <span>{time}</span>
                      <span>{seatsAvailable} seats</span>
                      <button
                        onClick={() =>
                          specificSlot?.id && handleBookSlot(specificSlot.id, time)
                        }
                        disabled={disableButton}
                        className="book-button"
                      >
                        {buttonText}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p>No slots available for {currentDay}</p>
              )}
            </div>
          </div>
          {bookingMessage && <p className="booking-message">{bookingMessage}</p>}
          <p className="warning">⚠️ Warning: Slot once booked cannot be changed</p>
        </>
      )}

      {/* Inline styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap');

        .container {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(to bottom right, #dbeafe, #eff6ff);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          box-sizing: border-box;
        }

        .title {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          color: #1e3a8a;
          text-shadow: 1px 1px 2px #60a5fa;
        }

        .card {
          background: white;
          padding: 2rem;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          width: 100%;
          animation: fadeIn 0.5s ease-in-out;
          text-align: center;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .card-header h2 {
          margin: 0;
          color: #1d4ed8;
        }

        .card-header button {
          background: #1d4ed8;
          color: white;
          border: none;
          border-radius: 50%;
          padding: 0.5rem 0.8rem;
          cursor: pointer;
          font-size: 1rem;
          transition: transform 0.2s ease;
        }

        .card-header button:hover {
          transform: scale(1.1);
        }

        .slots {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .slot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
          background: #e0f2fe;
          border-radius: 10px;
          box-shadow: inset 0 0 10px #bae6fd;
          transition: background 0.3s ease;
        }

        .slot.booked-out {
            background: #fecaca;
            color: #b91c1c;
        }

        .slot span {
            flex-grow: 1;
        }

        .book-button {
            background: #22c55e;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s ease;
            margin-left: 1rem;
        }

        .book-button:hover:not(:disabled) {
            background: #16a34a;
        }

        .book-button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }

        .warning {
          margin-top: 2rem;
          color: #b91c1c;
          font-weight: 500;
          text-align: center;
        }

        .booking-message {
            margin-top: 1rem;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            text-align: center;
            background-color: #dbeafe;
            color: #1e3a8a;
        }

        .confirmation-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px;
        }

        .confirmation-card .title {
            color: #22c55e;
            font-size: 2.2rem;
            margin-bottom: 1rem;
        }

        .booking-details {
            text-align: left;
            margin-top: 1rem;
            margin-bottom: 1.5rem;
            font-size: 1.1rem;
            color: #333;
        }

        .booking-details p {
            margin: 0.5rem 0;
        }

        .note-screenshot {
            margin-top: 1.5rem;
            font-size: 0.9rem;
            color: #555;
            font-style: italic;
        }

        .note-screenshot .warning {
            color: #b91c1c;
            font-weight: bold;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 480px) {
          .card {
            padding: 1.5rem;
          }
          .title {
            font-size: 1.5rem;
          }
          .confirmation-card .title {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;