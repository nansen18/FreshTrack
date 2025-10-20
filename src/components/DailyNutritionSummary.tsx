import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Cookie, Beef, Droplet, Activity, TrendingUp } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  consumed: boolean;
  calories?: number;
  sugar?: number;
  protein?: number;
  fat?: number;
  fiber?: number;
}

interface DailyNutritionSummaryProps {
  items: Item[];
}

export default function DailyNutritionSummary({ items }: DailyNutritionSummaryProps) {
  // Calculate daily totals from all items
  const dailyTotals = items.reduce(
    (totals, item) => ({
      calories: totals.calories + (item.calories || 0),
      sugar: totals.sugar + (item.sugar || 0),
      protein: totals.protein + (item.protein || 0),
      fat: totals.fat + (item.fat || 0),
      fiber: totals.fiber + (item.fiber || 0),
    }),
    { calories: 0, sugar: 0, protein: 0, fat: 0, fiber: 0 }
  );

  // Daily recommended values
  const dailyGoals = {
    calories: 2000,
    sugar: 50,
    protein: 50,
    fat: 70,
    fiber: 30,
  };

  const nutrients = [
    {
      name: 'Calories',
      value: dailyTotals.calories,
      goal: dailyGoals.calories,
      unit: 'kcal',
      icon: Flame,
      color: 'text-orange-500',
    },
    {
      name: 'Sugar',
      value: dailyTotals.sugar,
      goal: dailyGoals.sugar,
      unit: 'g',
      icon: Cookie,
      color: 'text-pink-500',
    },
    {
      name: 'Protein',
      value: dailyTotals.protein,
      goal: dailyGoals.protein,
      unit: 'g',
      icon: Beef,
      color: 'text-red-500',
    },
    {
      name: 'Fat',
      value: dailyTotals.fat,
      goal: dailyGoals.fat,
      unit: 'g',
      icon: Droplet,
      color: 'text-yellow-500',
    },
    {
      name: 'Fiber',
      value: dailyTotals.fiber,
      goal: dailyGoals.fiber,
      unit: 'g',
      icon: Activity,
      color: 'text-green-500',
    },
  ];

  const itemsWithNutrition = items.filter(
    item => item.calories || item.sugar || item.protein || item.fat || item.fiber
  );

  if (itemsWithNutrition.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Daily Nutrition Summary
          </CardTitle>
          <Badge variant="outline">
            {itemsWithNutrition.length} {itemsWithNutrition.length === 1 ? 'Item' : 'Items'} Tracked
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {nutrients.map((nutrient) => {
            const Icon = nutrient.icon;
            const percentage = Math.min((nutrient.value / nutrient.goal) * 100, 100);
            const isOverGoal = nutrient.value > nutrient.goal;

            return (
              <div key={nutrient.name} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${nutrient.color}`} />
                  <span className="text-sm font-medium">{nutrient.name}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${isOverGoal ? 'text-destructive' : 'text-foreground'}`}>
                      {nutrient.value.toFixed(0)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {nutrient.goal}
                      <span className="ml-0.5">{nutrient.unit}</span>
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${isOverGoal ? '[&>div]:bg-destructive' : ''}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {percentage.toFixed(0)}% of daily goal
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
