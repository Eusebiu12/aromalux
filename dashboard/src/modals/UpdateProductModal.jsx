import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleUpdateProductModal } from "../store/slices/extraSlice";
import { LoaderCircle, Trash2 } from "lucide-react"; 
import { updateProduct } from "../store/slices/productsSlice";

const UpdateProductModal = ({ selectedProduct }) => {
   
    const { loading } = useSelector((state) => state.product); 
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: "", 
        existingImages: [], 
        newImages: [],     
    });

    const categoryOptions = [
        "Floral", "Sweet", "Winter Wonderland", "Wood", "Exotic", "Fruit", "Oriental", "Marine",
    ];

    useEffect(() => {
        if (selectedProduct) {
            let initialImages = [];
            try {
                
                const images = typeof selectedProduct.images === 'string' 
                    ? JSON.parse(selectedProduct.images) 
                    : selectedProduct.images;
                
                initialImages = (images || []).map(img => ({ ...img, deleted: false }));
            } catch (error) {
                console.error("Error parsing existing product images:", error);
            }
            const productStock = selectedProduct.stock ?? "";

            setFormData({
                name: selectedProduct.name || "",
                description: selectedProduct.description || "",
                price: selectedProduct.price || "",
                category: selectedProduct.category || "",
                stock: productStock, 
                existingImages: initialImages,
                newImages: [],
            });
        }
    }, [selectedProduct]);

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

        
        const data = new FormData();
        data.append("name", formData.name);
        data.append("description", formData.description);
        data.append("price", formData.price);
        data.append("category", formData.category);
        data.append("stock", formData.stock);

        // 1. Trimiterea imaginilor NOI
        if (formData.newImages.length > 0) {
            formData.newImages.forEach((file) => data.append("new_images", file));
        }
        
        // 2. Trimiterea stării imaginilor EXISTENTE
        data.append("existing_images_state", JSON.stringify(formData.existingImages));
        
        // Asigură-te că acțiunea updateProduct acceptă {data, productId}
        dispatch(updateProduct(data, selectedProduct.id)); 
    };

    const imagesToDisplay = formData.existingImages.filter(img => !img.deleted);
    const deletedImagesCount = formData.existingImages.filter(img => img.deleted).length;


    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative overflow-y-auto max-h-[90vh]">
                <button
                    onClick={() => dispatch(toggleUpdateProductModal())}
                    className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-xl"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold mb-4 text-center">Update Product</h2>

                <form
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    onSubmit={handleSubmit}
                >
                    {/* INPUTS PRINCIPALE */}
                    <input
                        type="text"
                        placeholder="Title"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="border px-4 py-2 rounded"
                    />
                    <select
                        className="w-full border p-2 rounded-lg"
                        value={formData.category}
                        onChange={(e) =>
                            setFormData({ ...formData, category: e.target.value })
                        }
                        required
                    >
                        {categoryOptions.map((cat, idx) => (
                            <option key={idx} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        placeholder="Price"
                        value={formData.price}
                        onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                        }
                        className="border px-4 py-2 rounded"
                    />
                    <input
                        type="number"
                        placeholder="Stock"
                        value={formData.stock} 
                        onChange={(e) =>
                            setFormData({ ...formData, stock: e.target.value })
                        }
                        className="border px-4 py-2 rounded"
                    />
                    
                    
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <h3 className="text-lg font-semibold mt-4 border-t pt-4">
                            Edit Images ({imagesToDisplay.length} current, {deletedImagesCount} marked for deletion)
                        </h3>

                        {/* Afișarea imaginilor existente */}
                        <div className="flex flex-wrap gap-3 p-2 border rounded bg-gray-50">
                            {formData.existingImages.map((img) => (
                                <div 
                                    key={img.public_id} 
                                    className={`relative w-24 h-24 ${img.deleted ? 'opacity-30' : ''}`}
                                >
                                    <img
                                        src={img.url}
                                        alt="Current Product Image"
                                        className="w-full h-full object-cover rounded"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleDeleteImage(img.public_id)}
                                       
                                        disabled={loading} 
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
                            {formData.existingImages.length === 0 && <p className="text-sm text-gray-400">No existing images.</p>}
                        </div>


                        {/* Încărcare imagini noi */}
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={loading} 
                            className="border px-4 py-2 rounded"
                        />
                        {formData.newImages.length > 0 && (
                            <p className="text-sm text-green-600">
                                {formData.newImages.length} new file(s) ready to upload.
                            </p>
                        )}
                    </div>
                    
                    {/* Textarea Description (Rămasă la final) */}
                    <textarea
                        placeholder="Description"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                        }
                        className="border px-4 py-2 rounded col-span-1 md:col-span-2"
                        rows={4}
                    />

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded col-span-1 md:col-span-2"
                    >
                        {loading ? (
                            <>
                                <LoaderCircle className="w-6 h-6 animate-spin" />
                                Updating
                            </>
                        ) : (
                            "Update Product"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UpdateProductModal;