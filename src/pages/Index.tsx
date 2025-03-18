
import React from 'react';
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";

const Index = () => {
  return (
    <div className="min-h-screen bg-white w-full">
      <Navbar />
      <Hero />
      <Features />
    </div>
  );
};

export default Index;
