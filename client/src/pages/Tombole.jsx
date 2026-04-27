import { Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllRaffles } from "../store/slices/raffleSlice";
import Pagination from "../components/Raffles/Pagination";
import RaffleCard from "../components/Raffles/RaffleCard.jsx";

import { useLocation } from "react-router-dom";

const Raffles = () => {
  const dispatch = useDispatch();

  const { raffles, totalRaffles } = useSelector((state) => state.raffle);

  const useQuery = ()=> {
    return new URLSearchParams(useLocation().search);
  };
  const query = useQuery();
  const searchTerm = query.get("search");

  const [searchQuery, setSearchQuery] = useState(searchTerm || "");
  const [currentPage, setCurrentPage] = useState(1);

  // FETCH RAFFLES
  useEffect(() => {
    dispatch(
      fetchAllRaffles({
        search: searchQuery,
        page: currentPage,
      })
    );
  }, [dispatch, searchQuery, currentPage]);

  const totalPages = Math.ceil(totalRaffles / 10);

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">

        {/* SEARCH BAR */}
        <div className="mb-8 flex max-[440px]:flex-col items-center gap-2">
          <div className="relative w-1/2 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground"/>
                      <input type="text" placeholder="Search Raffles..." value={searchQuery} onChange={(e)=>
                        setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg 
                        focus:outline-none text-foreground placeholder-muted-foreground"/>
                    </div>
        </div>


        {/* RAFFLES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {raffles.map((raffle) => (
            <RaffleCard key={raffle.id} raffle={raffle} />
          ))}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}

        {/* NO RESULTS */}
        {raffles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No raffles found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Raffles;
