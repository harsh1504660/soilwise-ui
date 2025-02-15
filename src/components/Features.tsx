
import { Check } from 'lucide-react';

const Features = () => {
  const features = [
    {
      title: "Satellite Monitoring",
      description: "Track your fields in real-time with high-resolution satellite imagery"
    },
    {
      title: "AI-Powered Analytics",
      description: "Get actionable insights powered by advanced machine learning algorithms"
    },
    {
      title: "Yield Optimization",
      description: "Maximize your crop yields with data-driven recommendations"
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-secondary-dark mb-6">
            Advanced Features for Modern Farming
          </h2>
          <p className="text-xl text-secondary-light">
            Our platform combines cutting-edge technology with agricultural expertise to help you make better decisions.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-shadow group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <Check size={24} />
              </div>
              <h3 className="text-xl font-semibold text-secondary-dark mb-4">
                {feature.title}
              </h3>
              <p className="text-secondary-light">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
