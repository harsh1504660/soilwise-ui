import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen flex items-center pt-0 bg-gradient-to-b from-primary-light/20 to-white"> {/* Adjusted pt-24 to pt-16 */}
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-up">
            <h1 className="text-5xl md:text-6xl font-bold text-secondary-dark leading-tight">
              Precision Agriculture for a Sustainable Future
            </h1>
            <p className="text-xl text-secondary-light">
              Harness the power of AI and satellite data to optimize your farming operations and increase yields sustainably.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/fields')}
                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full transition-colors flex items-center gap-2 group"
              >
                Start Free Trial
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-full transition-all">
                Learn More
              </button>
            </div>
          </div>
          <div className="h-[500px] relative animate-float">
            <img 
              src="/home.png" 
              alt="Satellite view of agricultural fields"
              className="w-full h-full object-cover rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
