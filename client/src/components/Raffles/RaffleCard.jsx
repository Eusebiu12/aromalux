import React, { useEffect, useState } from "react";
import { Ticket, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const RaffleCard = ({ raffle }) => {
  const [timeLeft, setTimeLeft] = useState("");

  // CALCUL TIMP RĂMAS
   useEffect(() => {
    if (!raffle?.end_date) return;

    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(raffle.end_date);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      setTimeLeft(`${days}d ${hours}h`);
    }, 1000);

    return () => clearInterval(interval);
  }, [raffle]);

  const ticketsSold = raffle?.tickets_issued || 0;
  const totalTickets = raffle?.max_tickets || 1;
  const progress = Math.floor((ticketsSold / totalTickets) * 100);

  return (
    <Link
      to={`/raffle/${raffle.id}`}
      className="glass-card hover:glow-on-hover animate-smooth group"
    >
      {/* IMAGE */}
      <div className="relative overflow-hidden rounded-lg mb-4">
        <img src={
                  raffle?.images?.length > 0
                 ? raffle.images[0].url
                  : "/candela_home_center.jpg"} 
                  alt={raffle?.name} className="w-full h-48 object-contain
                group-hover:scale-110 transition-transform duration-300"/>

                { /* BADGES */}
                <div className="absolute top-3 left-3 flex flex-col space-y-2">
                  {
                    new Date() - new Date(raffle.created_at) < 30* 24 * 60 * 60 * 1000 && (
                      <span className="px-2 py-1 bg-primary text-primary-foreground text-xs
                      font-semibold rounded">NEW</span>
                    )}
                 </div>
      </div>

      {/* TITLE */}
      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {raffle.title}
      </h3>

      {/* PROGRESS BAR */}
      <div className="w-full bg-muted h-2 rounded-lg mb-2">
        <div
          className="h-2 rounded-lg bg-primary transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <span className="text-sm text-muted-foreground">
        {ticketsSold} / {totalTickets} bilete vândute ({progress}%)
      </span>

      {/* TIME LEFT */}
      <div className="flex items-center gap-2 mt-3 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className={timeLeft === "Expired" ? "text-red-400" : ""}>
          {timeLeft}
        </span>
      </div>
    </Link>
  );
};

export default RaffleCard;
