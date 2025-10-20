import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  ChefHat, 
  Lightbulb, 
  Clock,
  Refrigerator,
  Thermometer
} from 'lucide-react';

interface AIFoodAdvisorProps {
  productName: string;
  category?: string;
  daysUntilExpiry: number;
}

interface Advice {
  type: 'recipe' | 'storage' | 'usage';
  title: string;
  description: string;
  icon: React.ReactNode;
  urgency: 'low' | 'medium' | 'high';
}

export default function AIFoodAdvisor({ productName, category = 'general', daysUntilExpiry }: AIFoodAdvisorProps) {
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [loading, setLoading] = useState(false);

  const generateAdvice = () => {
    setLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const newAdvice: Advice[] = [];

      // Recipe suggestions based on urgency
      if (daysUntilExpiry <= 2) {
        newAdvice.push({
          type: 'recipe',
          title: 'Quick Recipe Ideas',
          description: getUrgentRecipe(productName, category),
          icon: <ChefHat className="h-4 w-4" />,
          urgency: 'high'
        });
      } else if (daysUntilExpiry <= 5) {
        newAdvice.push({
          type: 'recipe',
          title: 'Recipe Suggestions',
          description: getRecipeSuggestion(productName, category),
          icon: <ChefHat className="h-4 w-4" />,
          urgency: 'medium'
        });
      }

      // Storage tips
      newAdvice.push({
        type: 'storage',
        title: 'Optimal Storage',
        description: getStorageTip(productName, category),
        icon: <Refrigerator className="h-4 w-4" />,
        urgency: 'low'
      });

      // Usage tips
      if (daysUntilExpiry > 7) {
        newAdvice.push({
          type: 'usage',
          title: 'Best Usage Time',
          description: getBestUsageTip(productName, category, daysUntilExpiry),
          icon: <Clock className="h-4 w-4" />,
          urgency: 'low'
        });
      }

      // Smart preservation tips
      newAdvice.push({
        type: 'storage',
        title: 'Smart Preservation',
        description: getPreservationTip(productName, category),
        icon: <Lightbulb className="h-4 w-4" />,
        urgency: daysUntilExpiry <= 3 ? 'high' : 'medium'
      });

      setAdvice(newAdvice);
      setLoading(false);
    }, 1500);
  };

  const getUrgentRecipe = (product: string, category: string): string => {
    const urgentRecipes: Record<string, string> = {
      'dairy': `Make a quick smoothie with ${product}, or use in overnight oats. For milk nearing expiry, try making paneer or use in baking.`,
      'bakery': `Toast ${product} and make breadcrumbs for future use, or create a bread pudding. Stale bread works great for stuffing!`,
      'fruits': `Blend ${product} into a smoothie, make fruit salad, or quick jam. Overripe fruits are perfect for baking or smoothies.`,
      'vegetables': `Stir-fry ${product} with other vegetables, make a quick soup, or add to pasta. Most vegetables can be blanched and frozen.`,
      'meat': `Cook ${product} immediately - grill, pan-fry, or use in curry. Cooked meat can be stored longer than raw.`,
      'general': `Use ${product} in a quick stir-fry, soup, or salad. When in doubt, cooking extends shelf life!`
    };
    return urgentRecipes[category] || urgentRecipes['general'];
  };

  const getRecipeSuggestion = (product: string, category: string): string => {
    const recipes: Record<string, string> = {
      'dairy': `Try making homemade yogurt, cheese sauce, or creamy pasta with ${product}. Perfect timing for baking projects too!`,
      'bakery': `Great time for French toast, sandwiches, or homemade croutons with ${product}. Consider making bread pudding.`,
      'fruits': `${product} is perfect for pies, jams, or fruit tarts. Also great for natural fruit leather or dried snacks.`,
      'vegetables': `Roast ${product} for meal prep, make vegetable broth, or try pickling. Great for soups and stews too.`,
      'meat': `Plan a special dinner with ${product} - grilling, roasting, or slow cooking. Perfect timing for marinating.`,
      'general': `${product} is at its peak freshness - perfect for your favorite recipes or trying something new!`
    };
    return recipes[category] || recipes['general'];
  };

  const getStorageTip = (product: string, category: string): string => {
    const storageTips: Record<string, string> = {
      'dairy': `Keep ${product} in the coldest part of your fridge (back, not door). Store in original container to maintain freshness.`,
      'bakery': `Store ${product} in a bread box or sealed bag at room temperature. Refrigerate only in humid climates.`,
      'fruits': `Some fruits ripen faster at room temperature, others prefer refrigeration. Check if ${product} continues ripening after picking.`,
      'vegetables': `Most vegetables prefer high humidity. Store ${product} in perforated bags in the crisper drawer.`,
      'meat': `Keep ${product} on the bottom shelf of fridge to prevent drips. Use within 1-2 days of purchase date.`,
      'general': `Store ${product} according to package instructions. When in doubt, refrigerate to slow spoilage.`
    };
    return storageTips[category] || storageTips['general'];
  };

  const getBestUsageTip = (product: string, category: string, days: number): string => {
    const usageTips: Record<string, string> = {
      'dairy': `${product} is best used within ${Math.min(days, 7)} days for optimal taste and nutrition.`,
      'bakery': `${product} stays fresh for ${Math.min(days, 5)} days. Day 3-4 is perfect for toasting.`,
      'fruits': `${product} will be at peak ripeness in ${Math.floor(days/2)} days. Great for eating fresh now.`,
      'vegetables': `${product} maintains best nutrition for ${Math.min(days, 10)} days. Use fresher pieces for raw dishes.`,
      'meat': `${product} should be cooked within ${Math.min(days, 3)} days for safety and best flavor.`,
      'general': `${product} is good for ${days} days. Plan to use it in the next week for best quality.`
    };
    return usageTips[category] || usageTips['general'];
  };

  const getPreservationTip = (product: string, category: string): string => {
    const preservationTips: Record<string, string> = {
      'dairy': `Freeze ${product} in ice cube trays for smoothies, or make cheese/butter for longer storage.`,
      'bakery': `Slice and freeze ${product} for easy toasting later. Breadcrumbs can be made and stored for months.`,
      'fruits': `Wash, cut, and freeze ${product} for smoothies. Dehydrating or making jam extends shelf life significantly.`,
      'vegetables': `Blanch and freeze ${product} for later use. Pickling or fermentation can preserve for months.`,
      'meat': `Cook and freeze ${product} in portion sizes. Properly frozen cooked meat lasts 2-3 months.`,
      'general': `Consider freezing, dehydrating, or cooking ${product} to extend its usability by weeks or months.`
    };
    return preservationTips[category] || preservationTips['general'];
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      case 'medium': return 'bg-orange-100 border-orange-300 text-orange-800';
      default: return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high': return <Badge variant="destructive">Urgent</Badge>;
      case 'medium': return <Badge variant="secondary" className="bg-orange-500 text-white">Important</Badge>;
      default: return <Badge variant="outline">Tip</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Food Advisor
        </CardTitle>
      </CardHeader>
      <CardContent>
        {advice.length === 0 ? (
          <div className="text-center py-6">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Get personalized advice for <strong>{productName}</strong>
            </p>
            <Button onClick={generateAdvice} disabled={loading}>
              {loading ? (
                <>
                  <Bot className="h-4 w-4 mr-2 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Get AI Advice
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {advice.map((item, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border transition-all ${getUrgencyColor(item.urgency)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-full">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{item.title}</h4>
                      {getUrgencyBadge(item.urgency)}
                    </div>
                    <p className="text-sm">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              onClick={generateAdvice} 
              className="w-full mt-4"
              disabled={loading}
            >
              <Bot className="h-4 w-4 mr-2" />
              Get More Advice
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}