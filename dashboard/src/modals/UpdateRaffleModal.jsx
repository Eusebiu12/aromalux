import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleUpdateRaffleModal } from "../store/slices/extraSlice";
import { updateRaffle } from "../store/slices/raffleSlice";
import { LoaderCircle, Trash2 } from "lucide-react";

const UpdateRaffleModal = ({ selectedRaffle }) => {
    const dispatch = useDispatch();
    const { loading, isUpdating } = useSelector((state) => state.raffle);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        product_id: "",
        max_tickets: "",
        start_date: "",
        end_date: "",
      
        existingImages: [], 
        newImages: [],     
    });

    useEffect(() => {
        if (selectedRaffle) {
            
           
            let initialImages = [];
            try {
                
                const images = typeof selectedRaffle.images === 'string' 
                    ? JSON.parse(selectedRaffle.images) 
                    : selectedRaffle.images;
                
               
                initialImages = (images || []).map(img => ({ ...img, deleted: false }));
            } catch (error) {
                console.error("Error parsing existing raffle images:", error);
            }

            setFormData({
                title: selectedRaffle.title || "",
                description: selectedRaffle.description || "",
                product_id: selectedRaffle.product_id || "",
                max_tickets: selectedRaffle.max_tickets || "",
                start_date: "", 
                end_date: "", 
                existingImages: initialImages, 
                newImages: [],              
            });
        }
    }, [selectedRaffle]);

    const handleFileChange = (e) => {
        setFormData({ ...formData, newImages: Array.from(e.target.files) });
    };

    const toggleDeleteImage = (publicId) => {
        const updatedImages = formData.existingImages.map((img) =>
            img.public_id === publicId ? { ...img, deleted: !img.deleted } : img
        );
        setFormData({ ...formData, existingImages: updatedImages });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedRaffle?.id) {
            console.error("Cannot update raffle: selectedRaffle.id is undefined");
            return;
        }

        const data = new FormData();
        data.append("title", formData.title);
        data.append("description", formData.description);
        if (formData.product_id) data.append("product_id", formData.product_id);
        data.append("max_tickets", formData.max_tickets);

        if (formData.start_date) data.append("start_date", formData.start_date);
        if (formData.end_date) data.append("end_date", formData.end_date);

       
        if (formData.newImages.length > 0) {
            formData.newImages.forEach((file) => data.append("new_images", file));
        }
        
        
        data.append("existing_images_state", JSON.stringify(formData.existingImages));


        dispatch(updateRaffle(data, selectedRaffle.id));
    };


    const imagesToDisplay = formData.existingImages.filter(img => !img.deleted);
    const deletedImagesCount = formData.existingImages.filter(img => img.deleted).length;


    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative overflow-y-auto max-h-[90vh]">
                <button
                    onClick={() => dispatch(toggleUpdateRaffleModal())}
                    className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-xl"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-bold mb-4 text-center">Update Raffle</h2>

                {!selectedRaffle?.id ? (
                    <p className="text-center text-red-500">
                        No raffle selected. Please select a raffle to update.
                    </p>
                ) : (
                    <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
                        
                       
                        <input
                            type="text"
                            placeholder="Raffle Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="border px-4 py-2 rounded"
                        />
                        <textarea
                            placeholder="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="border px-4 py-2 rounded"
                            rows={4}
                        />
                        <input
                            type="text"
                            placeholder="Product ID (optional)"
                            value={formData.product_id}
                            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                            className="border px-4 py-2 rounded"
                        />
                        <input
                            type="number"
                            placeholder="Max Tickets"
                            value={formData.max_tickets}
                            onChange={(e) => setFormData({ ...formData, max_tickets: e.target.value })}
                            className="border px-4 py-2 rounded"
                            min="1"
                        />

                        {/* Start Date */}
                        <label className="text-sm text-gray-500 pt-2">Start Date (leave blank to keep current)</label>
                        <input
                            type="datetime-local"
                            value={formData.start_date || ""}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="border px-4 py-2 rounded"
                            min={new Date().toISOString().slice(0, 16)}
                        />

                        {/* End Date */}
                        <label className="text-sm text-gray-500">End Date (leave blank to keep current)</label>
                        <input
                            type="date"
                            value={formData.end_date ? formData.end_date.slice(0, 10) : ""}
                            onChange={(e) => {
                                if (e.target.value) {
                                    const endDate = new Date(e.target.value);
                                    endDate.setHours(23, 59, 59, 0);
                                    setFormData({ ...formData, end_date: endDate.toISOString() });
                                } else {
                                    setFormData({ ...formData, end_date: "" });
                                }
                            }}
                            className="border px-4 py-2 rounded"
                            min={new Date().toISOString().slice(0, 10)}
                        />
                        
                     
                        <h3 className="text-lg font-semibold mt-4 border-t pt-4">Edit Images ({imagesToDisplay.length} current, {deletedImagesCount} marked for deletion)</h3>

                        {/* Afișarea imaginilor existente */}
                        <div className="flex flex-wrap gap-3 p-2 border rounded bg-gray-50">
                            {formData.existingImages.map((img) => (
                                <div 
                                    key={img.public_id} 
                                    className={`relative w-24 h-24 ${img.deleted ? 'opacity-30' : ''}`}
                                >
                                    <img
                                        src={img.url}
                                        alt="Current Raffle Image"
                                        className="w-full h-full object-cover rounded"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleDeleteImage(img.public_id)}
                                        className={`absolute top-0 right-0 p-1 rounded-full ${img.deleted ? 'bg-red-500 text-white' : 'bg-white text-red-500 hover:bg-red-500 hover:text-white'}`}
                                        title={img.deleted ? 'Undo Delete' : 'Mark for Deletion'}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {img.deleted && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white font-bold text-xs rounded">
                                            DELETED
                                        </div>
                                    )}
                                </div>
                            ))}
                            {/* Mesaj dacă nu sunt imagini existente */}
                            {formData.existingImages.length === 0 && <p className="text-sm text-gray-400">No existing images.</p>}
                        </div>


                        {/* Încărcare imagini noi */}
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            className="border px-4 py-2 rounded"
                        />
                        {formData.newImages.length > 0 && (
                            <p className="text-sm text-green-600">
                                {formData.newImages.length} new file(s) ready to upload.
                            </p>
                        )}
                        
                        {/* -------------------------------------------------- */}

                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded mt-4"
                        >
                            {isUpdating ? (
                                <>
                                    <LoaderCircle className="w-6 h-6 animate-spin" />
                                    Updating
                                </>
                            ) : (
                                "Update Raffle"
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UpdateRaffleModal;