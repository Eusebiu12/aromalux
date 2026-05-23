import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleCreateRaffleModal } from "../store/slices/extraSlice";
import { createNewRaffle } from "../store/slices/raffleSlice";
import { LoaderCircle } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

const CreateRaffleModal = () => {
const dispatch = useDispatch();
const { loading } = useSelector((state) => state.raffle);
const { user } = useSelector((state) => state.auth);


// const handleStartDateChange = (e) => {
//   const selectedStartDate = e.target.value; 
//   setFormData({ ...formData, start_date: selectedStartDate });
// };

// const handleEndDateChange = (e) => {
//   const selectedDate = e.target.value; 
//   const endDateTime = `${selectedDate}T23:59:59`;
//   setFormData({ ...formData, end_date: endDateTime });
// };




const [formData, setFormData] = useState({
title: "",
description: "",
product_id: "",
max_tickets: 9999,
start_date: "",
end_date: "", 
image: null,
});

const handleSubmit = (e) => {
e.preventDefault();


if (!user?.id) return alert("User not authenticated!");

const data = new FormData();
data.append("title", formData.title);
data.append("description", formData.description);

// only append product_id if it exists
if (formData.product_id && formData.product_id.trim() !== "") {
  data.append("product_id", formData.product_id);
}

data.append("max_tickets",  Number(formData.max_tickets));
data.append("start_date", formData.start_date);
data.append("end_date", formData.end_date);   
data.append("created_by", user.id); 

// multiple images
  if (formData.images && formData.images.length > 0) {
    formData.images.forEach((file) => data.append("images", file));
  }


dispatch(createNewRaffle(data));

};

return (
   <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4">
     <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative">
<button
onClick={() => dispatch(toggleCreateRaffleModal())}
className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-xl"
>
  &times;
 </button>

    <h2 className="text-2xl font-bold mb-4 text-center">Create Raffle</h2>

    <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Raffle Title"
        value={formData.title}
        onChange={(e) =>
          setFormData({ ...formData, title: e.target.value })
        }
        className="border px-4 py-2 rounded"
        required
      />

      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        className="border px-4 py-2 rounded"
        rows={4}
      />

      <input
        type="text"
        placeholder="Product ID (optional)"
        value={formData.product_id}
        onChange={(e) =>
          setFormData({ ...formData, product_id: e.target.value })
        }
        className="border px-4 py-2 rounded"
      />

      <input
        type="number"
        placeholder="Max Tickets"
        value={formData.max_tickets}
        onChange={(e) =>
          setFormData({ ...formData, max_tickets: e.target.value })
        }
        className="border px-4 py-2 rounded"
        min="1"
      />

    <input
  type="datetime-local"
  value={formData.start_date || ""}
  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
  className="border px-4 py-2 rounded"
  min={new Date().toISOString().slice(0,16)}
/>



<input
  type="date"
  value={formData.end_date ? formData.end_date.slice(0,10) : ""}
  onChange={(e) => {
    if (e.target.value) {
     
      const endDateTimeStr = `${e.target.value}T23:59:59`;
      setFormData({ ...formData, end_date: endDateTimeStr });
    } else {
      setFormData({ ...formData, end_date: "" });
    }
  }}
  className="border px-4 py-2 rounded"
  min={new Date().toISOString().slice(0,10)}
/>


      <input
        type="file" multiple
        accept="image/*"
        onChange={(e) =>
          setFormData({ ...formData, images: Array.from(e.target.files) })
        }
        className="border px-4 py-2 rounded"
      />

      <button
        type="submit"
        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded"
      >
        {loading ? (
          <>
            <LoaderCircle className="w-6 h-6 animate-spin" />
            Creating
          </>
        ) : (
          "Create Raffle"
        )}
      </button>
    </form>
  </div>
</div>

);
};

export default CreateRaffleModal;
