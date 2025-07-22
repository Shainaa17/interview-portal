import React, { useEffect, useState } from "react";
import { db } from "../firebase/config"; // Ensure this path is correct
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import "../App.css"; // Ensure you have this file for your CSS

const Dashboard = () => {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [allIndividualSlotsData, setAllIndividualSlotsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingMessage, setBookingMessage] = useState("");
  // New state to control showing the confirmation card
  const [showConfirmationCard, setShowConfirmationCard] = useState(false);
  // New state to store details for the confirmation card
  const [bookedSlotDetails, setBookedSlotDetails] = useState(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  // This array MUST EXACTLY match the 'time' strings in your Firebase documents
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
      // console.log("Fetched all slots data:", slots); // Debug log
    } catch (error) {
      console.error("Error fetching slots:", error);
      setLoading(false);
      setBookingMessage("Failed to load slots. Please try again.");
    }
  };

  useEffect(() => {
    fetchAllSlots();
  }, []);

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

  const handleBookSlot = async (slotDocId, time, currentSeatsLeft) => {
    if (currentSeatsLeft <= 0) {
      setBookingMessage("No seats available for this slot.");
      return;
    }

    const confirmBooking = window.confirm(
      `Are you sure you want to book the ${time} slot on ${currentDay}?`
    );

    if (!confirmBooking) {
      return;
    }

    setBookingMessage("Booking your slot...");

    try {
      const slotDocRef = doc(db, "slots", slotDocId);
      const newSeatCount = currentSeatsLeft - 1;

      await updateDoc(slotDocRef, {
        seatsLeft: newSeatCount,
        // You might add bookedBy: "user_id_here" if you have user authentication
      });

      setAllIndividualSlotsData((prevSlotsData) =>
        prevSlotsData.map((slot) =>
          slot.id === slotDocId
            ? { ...slot, seatsLeft: newSeatCount }
            : slot
        )
      );

      // Successfully booked: Set details for confirmation card and show it
      setBookedSlotDetails({
        day: currentDay,
        time: time,
        seatsRemaining: newSeatCount, // Seats remaining in that slot
        // You can add more details here if available, e.g., user name, booking ID
      });
      setShowConfirmationCard(true); // Show the confirmation card
      setBookingMessage(""); // Clear general booking message

    } catch (error) {
      console.error("Error booking slot:", error);
      setBookingMessage("Error booking slot. Please try again.");
      setBookedSlotDetails(null); // Clear details if booking failed
      setShowConfirmationCard(false); // Make sure confirmation card is not shown
    }
  };

  // Removed handleBookAnotherSlot function as it's not needed for the confirmation card
  // if the user can't go back.

  // --- Confirmation Card Component ---
  const ConfirmationCard = ({ details }) => { // onBookAnother prop removed
    if (!details) return null; // Don't render if no details

    return (
      <div className="card confirmation-card">
        <h2 className="title">Booking Confirmed!</h2>
        <p>Thank you for booking your slot.</p>
        <div className="booking-details">
          <p><strong>Date:</strong> {details.day}</p>
          <p><strong>Time:</strong> {details.time}</p>
          <p><strong>Seats Remaining:</strong> {details.seatsRemaining}</p>
        </div>
        <p className="note-screenshot">
          <span className="warning">⚠️ Note:</span> Please take a screenshot of this confirmation for your records.
        </p>
        {/* "Book Another Slot" button removed as per requirement */}
      </div>
    );
  };

  // --- Main Dashboard Render ---
  return (
    <div className="container">
      {/* Conditional rendering based on showConfirmationCard state */}
      {showConfirmationCard ? (
        <ConfirmationCard details={bookedSlotDetails} /> // onBookAnother prop removed
      ) : (
        <> {/* Fragment for multiple elements */}
          <h1 className="title">Please Book Your Interview Slot</h1>
          <div className="card">
            <div className="card-header">
              {/* Keep navigation buttons */}
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

                  return (
                    <div
                      className={`slot ${isBookedOut ? "booked-out" : ""}`}
                      key={time}
                    >
                      <span>{time}</span>
                      <span>{seatsAvailable} seats</span>
                      <button
                        onClick={() =>
                          handleBookSlot(
                            specificSlot?.id,
                            time,
                            seatsAvailable
                          )
                        }
                        disabled={isBookedOut || !specificSlot || seatsAvailable === "N/A"}
                        className="book-button"
                      >
                        {isBookedOut ? "Booked Out" : "Book Now"}
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

      {/* Inline styles. Consider moving these to App.css for better separation of concerns. */}
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
          text-align: center; /* Center content in the card */
        }

        .card-header {
          display: flex;
          justify-content: space-between; /* Keep spacing for navigation buttons */
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
            background: #fecaca; /* Light red for booked out slots */
            color: #b91c1c;
        }

        .slot span {
            flex-grow: 1;
        }

        .book-button {
            background: #22c55e; /* Green for book button */
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s ease;
            margin-left: 1rem;
        }

        .book-button:hover:not(:disabled) {
            background: #16a34a; /* Darker green on hover */
        }

        .book-button:disabled {
            background: #9ca3af; /* Grey for disabled button */
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

        /* Styles for the new confirmation card */
        .confirmation-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px; /* Give it some height */
        }

        .confirmation-card .title {
            color: #22c55e; /* Green for success */
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

        /* Removed .book-another-button styles as button is removed */

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
