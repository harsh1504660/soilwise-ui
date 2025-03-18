import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="w-full bg-white shadow-lg transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="text-2xl font-bold text-primary">Agri Spectra</div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-secondary-dark hover:text-primary transition-colors">Features</a>
            <a href="#about" className="text-secondary-dark hover:text-primary transition-colors">About</a>
            <a href="#contact" className="text-secondary-dark hover:text-primary transition-colors">Contact</a>
            <button 
              onClick={() => navigate('/fields')}
              className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-secondary-dark"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white shadow-lg animate-fade-in">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-secondary-dark hover:text-primary transition-colors">Features</a>
              <a href="#about" className="block text-secondary-dark hover:text-primary transition-colors">About</a>
              <a href="#contact" className="block text-secondary-dark hover:text-primary transition-colors">Contact</a>
              <button 
                onClick={() => {
                  navigate('/fields');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
