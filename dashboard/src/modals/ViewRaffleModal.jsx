import React from "react";
import { useDispatch } from "react-redux";
import { toggleViewRaffleModal } from "../store/slices/extraSlice";

const ViewRaffleModal = ({ selectedRaffle }) => {
    const dispatch = useDispatch();

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh] relative">
          
                <button
                    onClick={() => dispatch(toggleViewRaffleModal())}
                    className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-xl"
                >
                    &times;
                </button>

            
                <h2 className="text-2xl font-bold mb-4 text-center">
                    {selectedRaffle.title}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Images */}
                    {selectedRaffle.images && selectedRaffle.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            {selectedRaffle.images.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img?.url}
                                    alt={`Raffle ${idx}`}
                                    className="w-full h-48 object-cover rounded"
                                />
                            ))}
                        </div>
                    )}

                    {/* Info */}
                    <div className="space-y-2">
                        <p>
                            <strong>ID:</strong> {selectedRaffle.id}
                        </p>
                        <p>
                            <strong>Description:</strong> {selectedRaffle.description || "-"}
                        </p>
                        <p>
                            <strong>Product ID:</strong>{" "}
                            {selectedRaffle.product_id || "None"}
                        </p>
                    
                        <div className="py-2 flex justify-between border-t border-b border-gray-200 mt-2">
                            <p className="font-semibold text-lg">
                                🎫 Total Tickets:
                            </p>
                            <span className="font-bold text-lg text-blue-600">
                                {selectedRaffle.max_tickets || 0}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <p className="font-semibold">
                                💰 Sold:
                            </p>
                            <span className="font-bold text-green-600">
                                {selectedRaffle.tickets_issued || 0}
                            </span>
                        </div>
                        

                        <p>
                            <strong>Start Date:</strong>{" "}
                            {new Date(selectedRaffle.start_date).toLocaleString()}
                        </p>
                        <p>
                            <strong>End Date:</strong>{" "}
                            {selectedRaffle.end_date
                                ? new Date(selectedRaffle.end_date).toLocaleString()
                                : "Not set"}
                        </p>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewRaffleModal;