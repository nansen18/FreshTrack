import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Target, TrendingUp, Users, Heart, Globe, DollarSign, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';

const Index = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      // Redirect authenticated users to their dashboard
      if (profile.role === 'retailer') {
        navigate('/retailer');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, profile, navigate]);

  const features = [
    {
      icon: Target,
      title: "Smart Expiry Tracking",
      description: "Get alerts before your food expires and take action to prevent waste"
    },
    {
      icon: TrendingUp,
      title: "Impact Analytics",
      description: "See your positive impact on the environment, economy, and society"
    },
    {
      icon: DollarSign,
      title: "Money Saved",
      description: "Track how much money you're saving by reducing food waste"
    },
    {
      icon: Users,
      title: "For Everyone",
      description: "Perfect for consumers and retailers looking to reduce waste"
    }
  ];

  const impactStats = [
    { icon: Globe, label: "Environmental", value: "Reduce CO₂ emissions" },
    { icon: Heart, label: "Social", value: "Increase food accessibility" },
    { icon: DollarSign, label: "Economic", value: "Turn waste into profit" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-fresh-green/10 via-background to-primary/10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center mb-8">
            <Leaf className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-fresh-green bg-clip-text text-transparent">
              FreshTrack
            </h1>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Transform Food Waste Into
            <span className="text-primary"> Impact</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Join the movement to reduce food waste. Track expiry dates, get smart alerts, 
            and see your positive impact on the environment, economy, and society.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6"
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              View Demo
            </Button>
          </div>

          {/* Impact Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {impactStats.map((stat, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur border-primary/20">
                <CardContent className="p-6 text-center">
                  <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">{stat.label}</h3>
                  <p className="text-muted-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose FreshTrack?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make food waste reduction simple and rewarding
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Simple steps to start reducing food waste today
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Add Your Food Items</h3>
              <p className="text-muted-foreground">
                Enter your groceries with purchase and expiry dates
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Smart Alerts</h3>
              <p className="text-muted-foreground">
                Receive notifications when items are about to expire
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Your Impact</h3>
              <p className="text-muted-foreground">
                See your positive contribution to reducing food waste
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-fresh-green/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl mb-4">Ready to Make a Difference?</CardTitle>
            <CardDescription className="text-lg">
              Join thousands of users already reducing food waste and creating positive impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-6 mb-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Instant setup
              </div>
            </div>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6"
            >
              Start Tracking Now
              <Leaf className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
