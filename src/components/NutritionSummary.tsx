import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Droplet, Beef, Cookie, Activity } from 'lucide-react';

interface NutritionData {
  calories?: number;
  sugar?: number;
  protein?: number;
  fat?: number;
  fiber?: number;
  carbohydrates?: number;
  sodium?: number;
  health_score?: string;
  ai_feedback?: string;
}

interface NutritionSummaryProps {
  data: NutritionData;
  itemName: string;
}

const getHealthScoreColor = (score?: string) => {
  switch (score) {
    case 'good':
      return 'bg-green-500';
    case 'moderate':
      return 'bg-yellow-500';
    case 'high-risk':
      return 'bg-destructive';
    default:
      return 'bg-muted';
  }
};

const getHealthScoreEmoji = (score?: string) => {
  switch (score) {
    case 'good':
      return '🟢';
    case 'moderate':
      return '🟡';
    case 'high-risk':
      return '🔴';
    default:
      return '⚪';
  }
};

export default function NutritionSummary({ data, itemName }: NutritionSummaryProps) {
  const nutrients = [
    { 
      name: 'Calories', 
      value: data.calories, 
      unit: 'kcal', 
      icon: Flame,
      color: 'text-orange-500',
      max: 500 
    },
    { 
      name: 'Sugar', 
      value: data.sugar, 
      unit: 'g', 
      icon: Cookie,
      color: 'text-pink-500',
      max: 50 
    },
    { 
      name: 'Protein', 
      value: data.protein, 
      unit: 'g', 
      icon: Beef,
      color: 'text-red-500',
      max: 50 
    },
    { 
      name: 'Fat', 
      value: data.fat, 
      unit: 'g', 
      icon: Droplet,
      color: 'text-yellow-500',
      max: 30 
    },
    { 
      name: 'Fiber', 
      value: data.fiber, 
      unit: 'g', 
      icon: Activity,
      color: 'text-green-500',
      max: 15 
    },
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Nutrition Summary</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getHealthScoreEmoji(data.health_score)}</span>
            <Badge 
              variant="outline" 
              className={`${getHealthScoreColor(data.health_score)} text-white border-0`}
            >
              {data.health_score?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{itemName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Feedback */}
        {data.ai_feedback && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium text-foreground">
              💡 {data.ai_feedback}
            </p>
          </div>
        )}

        {/* Nutrient Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {nutrients.map((nutrient) => {
            const Icon = nutrient.icon;
            const percentage = nutrient.value 
              ? Math.min((nutrient.value / nutrient.max) * 100, 100) 
              : 0;
            
            return (
              <div key={nutrient.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${nutrient.color}`} />
                    <span className="text-sm font-medium">{nutrient.name}</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {nutrient.value?.toFixed(1) || 'N/A'} {nutrient.value ? nutrient.unit : ''}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        {data.carbohydrates !== undefined && (
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Carbohydrates</span>
              <span className="font-medium">{data.carbohydrates.toFixed(1)}g</span>
            </div>
          </div>
        )}
        {data.sodium !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sodium</span>
            <span className="font-medium">{data.sodium.toFixed(1)}mg</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
