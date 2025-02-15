
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary">SoilWise</div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-secondary-dark hover:text-primary transition-colors">Features</a>
            <a href="#about" className="text-secondary-dark hover:text-primary transition-colors">About</a>
            <a href="#contact" className="text-secondary-dark hover:text-primary transition-colors">Contact</a>
            <button className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors">
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
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg animate-fade-in">
            <div className="container mx-auto px-6 py-4 space-y-4">
              <a href="#features" className="block text-secondary-dark hover:text-primary transition-colors">Features</a>
              <a href="#about" className="block text-secondary-dark hover:text-primary transition-colors">About</a>
              <a href="#contact" className="block text-secondary-dark hover:text-primary transition-colors">Contact</a>
              <button className="w-full bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors">
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
