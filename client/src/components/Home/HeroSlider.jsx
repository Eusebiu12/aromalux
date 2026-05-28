import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "Snowy vibes",
      description: "See our new winter candle collection",
      image: "./winter_slider.jpeg",
      cta: "Explore Winter",
      url: "/products?category=Winter Wonderland",
    },
    {
      id: 2,
      title: "Flavoury delights",
      description: "Our sweet fragrancies will make you want to take a bite.",
      image: "./sweet_slider.jpeg",
      cta: "Want some sweets?",
      url: "/products?category=Sweet",
    },
    {
      id: 3,
      title: "Wonderful Garden",
      description: "Feel the fragrant scent of the flower garden right in your home.",
      image: "./floral_slider.jpeg",
      cta: "Smell our garden",
      url: "/products?category=Floral",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const slide = slides[currentSlide];

  return (
    <div className="relative h-[70vh] overflow-hidden rounded-2xl">
      <div className="relative h-full">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${slide.image})` }}
        />

        <div className="absolute inset-0 bg-black/40" />

        {/* Text */}
        <div className="relative h-full flex items-center justify-center text-center px-6">
          <div className="max-w-3xl animate-fade-in-up">
            <h1
              className="text-5xl md:text-7xl font-bold mb-4 text-white"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
            >
              {slide.title}
            </h1>
            <p
              className="text-xl mb-8 max-w-2xl mx-auto text-white/85"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            >
              {slide.description}
            </p>
            <Link
              to={slide.url}
              className="px-8 py-4 gradient-primary text-primary-foreground rounded-lg
                         hover:glow-on-hover animate-smooth font-semibold text-lg"
            >
              {slide.cta}
            </Link>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={prevSlide}
        className="hidden sm:block absolute left-6 top-1/2 -translate-y-1/2 p-3
                   glass-card hover:glow-on-hover animate-smooth"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="hidden sm:block absolute right-6 top-1/2 -translate-y-1/2 p-3
                   glass-card hover:glow-on-hover animate-smooth"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-primary glow-primary scale-125"
                : "bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;