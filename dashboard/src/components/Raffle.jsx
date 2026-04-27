import React, { useState, useEffect } from "react";
import { LoaderCircle, Plus } from "lucide-react";

import CreateRaffleModal from "../modals/CreateRaffleModal";
import UpdateRaffleModal from "../modals/UpdateRaffleModal";
import ViewRaffleModal from "../modals/ViewRaffleModal";

import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";

import {
  toggleCreateRaffleModal,
  toggleUpdateRaffleModal,
  toggleViewRaffleModal
} from "../store/slices/extraSlice";

import {
  fetchAllRaffles,
  deleteRaffle
} from "../store/slices/raffleSlice";

const Raffles = () => {
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [maxPage, setMaxPage] = useState(1);
  const [page, setPage] = useState(1);

  const dispatch = useDispatch();

  const {
    isViewRaffleModalOpened,
    isCreateRaffleModalOpened,
    isUpdateRaffleModalOpened,
  } = useSelector((state) => state.extra);

  const {
    loading,
    raffles,
    totalRaffles,
    fetchingRaffles,
    isDeleting,
    isUpdating,
  } = useSelector((state) => state.raffle);

  useEffect(() => {
    dispatch(fetchAllRaffles(page));
  }, [dispatch, page]);

  useEffect(() => {
    if (totalRaffles !== undefined) {
      setMaxPage(Math.ceil(totalRaffles / 10) || 1);
    }
  }, [totalRaffles]);

  useEffect(() => {
    if (page > maxPage) setPage(maxPage);
  }, [maxPage, page]);

  return (
    <>
      <main className="p-[10px] pl-[10px] md:pl-[17rem] w-full">
        <div className="flex-1 md:p-6">
          <Header />
          <h1 className="text-2xl font-bold">All Raffles</h1>
          <p className="text-sm text-gray-600 mb-6">Manage your website raffles.</p>

          <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <div className={`overflow-x-auto rounded-lg ${fetchingRaffles ? "p-0 shadow-none" : (raffles && raffles.length > 0 ? "shadow-lg" : "shadow-none")}`}>
              {fetchingRaffles ? (
                <div className="w-40 h-40 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : raffles && raffles.length > 0 ? (
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-blue-100 text-gray-700">
                    <tr>
                      <th className="py-3 px-4 text-left">Image</th>
                      <th className="py-3 px-4 text-left">Title</th>
                      <th className="py-3 px-4 text-left">Total Tickets</th>
                      <th className="py-3 px-4 text-left">Sold</th>
                      <th className="py-3 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raffles.map((raffle, index) => (
                      <tr key={raffle.id || index} className="border-t hover:bg-gray-50"
                        onClick={() => {
                          setSelectedRaffle(raffle);
                          dispatch(toggleViewRaffleModal());
                        }}>
                        <td className="py-3 px-4">
                          <img
                            src={raffle?.images?.[0]?.url || "/placeholder.png"}
                            alt={raffle.title || "Raffle"}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </td>
                        <td className="px-3 py-4">{raffle.title || "-"}</td>
                        <td className="px-3 py-4">{raffle.max_tickets ?? "-"}</td>
                        <td className="px-3 py-4">{raffle.tickets_issued ?? "-"}</td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            className="text-white rounded-md cursor-pointer px-3 py-2 font-semibold bg-blue-gradient"
                            disabled={isUpdating || isDeleting}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRaffle(raffle);
                              dispatch(toggleUpdateRaffleModal());
                            }}>
                            {isUpdating && selectedRaffle?.id === raffle.id ? (
                          <>
                           <LoaderCircle className="w-6 h-6 animate-spin" /> Updating...
                            </>
                           ) : "Update"}
                              </button>
                          <button
                            className="text-white rounded-md cursor-pointer px-3 py-2 font-semibold bg-red-gradient flex gap-2 items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRaffle(raffle);
                              dispatch(deleteRaffle(raffle.id, page));
                            }}
                            disabled={isDeleting}
                            >
                            {selectedRaffle?.id === raffle.id && isDeleting ? (
                              <>
                                <LoaderCircle className="w-6 h-6 animate-spin" /> Deleting...
                              </>
                            ) : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <h3 className="text-2xl font-bold text-gray-600">No raffles found.</h3>
                  <p className="text-gray-500 mt-2">Create a new raffle to get started.</p>
                </div>
              )}
            </div>

            {/* PAGINATION */}
            {!fetchingRaffles && raffles && raffles.length > 0 && (
              <div className="flex justify-center mt-6 gap-4">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1 || maxPage === 1}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">Page {page}</span>
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={page === maxPage || maxPage === 1}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => dispatch(toggleCreateRaffleModal())}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg z-50 transition-all duration-300"
          title="Create New Raffle"
        >
          <Plus size={20} />
        </button>
      </main>

      {isCreateRaffleModalOpened && <CreateRaffleModal />}
      {isUpdateRaffleModalOpened && <UpdateRaffleModal selectedRaffle={selectedRaffle} />}
      {isViewRaffleModalOpened && <ViewRaffleModal selectedRaffle={selectedRaffle} />}
    </>
  );
};

export default Raffles;
