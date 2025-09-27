import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Zap, 
  Star, 
  Award,
  Leaf,
  DollarSign,
  Users,
  TrendingUp
} from 'lucide-react';

interface GameProgressProps {
  totalItems: number;
  consumedItems: number;
  moneySaved: number;
  co2Reduced: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  target: number;
  unlocked: boolean;
  category: 'consumption' | 'environmental' | 'economic' | 'social';
}

export default function GameProgress({ totalItems, consumedItems, moneySaved, co2Reduced }: GameProgressProps) {
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    calculateProgress();
  }, [totalItems, consumedItems, moneySaved, co2Reduced]);

  const calculateProgress = () => {
    // Calculate level and XP (10 XP per consumed item, 5 XP per ₹10 saved)
    const totalXP = (consumedItems * 10) + Math.floor(moneySaved / 10) * 5;
    const currentLevel = Math.floor(totalXP / 100) + 1;
    const currentXP = totalXP % 100;
    
    setLevel(currentLevel);
    setXp(currentXP);

    // Calculate achievements
    const newAchievements: Achievement[] = [
      {
        id: 'first-save',
        name: 'First Save',
        description: 'Consume your first tracked item',
        icon: <Star className="h-4 w-4" />,
        progress: Math.min(consumedItems, 1),
        target: 1,
        unlocked: consumedItems >= 1,
        category: 'consumption'
      },
      {
        id: 'eco-saver',
        name: 'Eco Saver',
        description: 'Achieve 60% consumption rate',
        icon: <Leaf className="h-4 w-4" />,
        progress: totalItems > 0 ? Math.min((consumedItems / totalItems) * 100, 60) : 0,
        target: 60,
        unlocked: totalItems > 0 && (consumedItems / totalItems) >= 0.6,
        category: 'environmental'
      },
      {
        id: 'zero-waste-hero',
        name: 'Zero Waste Hero',
        description: 'Achieve 80% consumption rate',
        icon: <Trophy className="h-4 w-4" />,
        progress: totalItems > 0 ? Math.min((consumedItems / totalItems) * 100, 80) : 0,
        target: 80,
        unlocked: totalItems > 0 && (consumedItems / totalItems) >= 0.8,
        category: 'environmental'
      },
      {
        id: 'money-saver',
        name: 'Money Saver',
        description: 'Save ₹500 from waste prevention',
        icon: <DollarSign className="h-4 w-4" />,
        progress: Math.min(moneySaved, 500),
        target: 500,
        unlocked: moneySaved >= 500,
        category: 'economic'
      },
      {
        id: 'consistent-consumer',
        name: 'Consistent Consumer',
        description: 'Consume 10 items successfully',
        icon: <Target className="h-4 w-4" />,
        progress: Math.min(consumedItems, 10),
        target: 10,
        unlocked: consumedItems >= 10,
        category: 'consumption'
      },
      {
        id: 'carbon-fighter',
        name: 'Carbon Fighter',
        description: 'Reduce 5kg of CO₂ emissions',
        icon: <Zap className="h-4 w-4" />,
        progress: Math.min(co2Reduced, 5),
        target: 5,
        unlocked: co2Reduced >= 5,
        category: 'environmental'
      },
      {
        id: 'waste-warrior',
        name: 'Waste Warrior',
        description: 'Track 25 items in total',
        icon: <Award className="h-4 w-4" />,
        progress: Math.min(totalItems, 25),
        target: 25,
        unlocked: totalItems >= 25,
        category: 'consumption'
      }
    ];

    setAchievements(newAchievements);
  };

  const getWasteScore = () => {
    if (totalItems === 0) return 0;
    return Math.round((consumedItems / totalItems) * 100);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'consumption':
        return 'bg-blue-500';
      case 'environmental':
        return 'bg-green-500';
      case 'economic':
        return 'bg-yellow-500';
      case 'social':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNextLevelXP = () => {
    return 100; // Each level requires 100 XP
  };

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Level {level}</h3>
                <p className="text-sm text-muted-foreground">Waste Reduction Champion</p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {xp}/{getNextLevelXP()} XP
              </Badge>
            </div>
            <Progress value={xp} className="h-2" />
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{getWasteScore()}%</p>
                <p className="text-xs text-muted-foreground">Waste Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{achievements.filter(a => a.unlocked).length}</p>
                <p className="text-xs text-muted-foreground">Achievements</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`p-3 rounded-lg border transition-all ${
                  achievement.unlocked 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-muted/30 border-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getCategoryColor(achievement.category)} ${
                    achievement.unlocked ? 'text-white' : 'text-muted-foreground bg-muted'
                  }`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {achievement.name}
                      </h4>
                      {achievement.unlocked && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Unlocked!
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(achievement.progress / achievement.target) * 100} 
                        className="h-1 flex-1" 
                      />
                      <span className="text-xs text-muted-foreground">
                        {Math.round(achievement.progress)}/{achievement.target}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}