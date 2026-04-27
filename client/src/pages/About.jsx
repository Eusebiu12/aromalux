import { Users, Target, Award, Heart } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Heart,
      title: 'Customer First',
      description: 'We put our customers at the heart of everything we do.'
    },
    {
      icon: Award,
      title: 'Quality Products',
      description: 'We ensure all products meet our high standards.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building lasting relationships with our customers.'
    },
    {
      icon: Target,
      title: 'Innovation',
      description: 'Constantly improving our platform and services.'
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-6">About AromaLux</h1>
          <p className="text-xl text-muted-foreground">
            Your trusted candle shop for quality products and exceptional service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {values.map((value, index) => (
            <div key={index} className="bg-secondary rounded-xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <value.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
              <p className="text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-secondary rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed">
           <p style={{ textIndent: '2em' }}> 
            Our journey began with a simple love for beautiful scents, handmade creations, and the peaceful moments that a candle can bring into everyday life. What started as small experiments—playing with wax blends, fragrances, and colors—slowly grew into a passion we wanted to share with others.
          </p>
            We believed that candles could be more than decorative objects. They could hold memories, create atmosphere, and turn ordinary moments into meaningful ones. With that vision in mind, we built a brand centered around craftsmanship, emotion, and connection.
          <p style={{ textIndent: '2em' }}> 
              Every candle we make is hand-poured with care, designed with intention, and inspired by the little things that bring joy: the calm of a quiet morning, the energy of the ocean, the warmth of winter nights, or the sweetness of familiar memories. Each fragrance tells a story, and every detail—from the wax to the packaging—is chosen to create an experience, not just a product.
          </p>
          <p style={{ textIndent: '2em' }}> 
            Our mission is simple: to bring comfort, beauty, and a touch of magic into your home through our creations.
            Thank you for being part of this journey and for supporting a small business built with heart.
          </p>
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;