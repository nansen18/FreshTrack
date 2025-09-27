import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Leaf, 
  Users, 
  ArrowLeft,
  Award,
  Target,
  Heart,
  Globe
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format, subDays, differenceInDays } from 'date-fns';

interface ReportData {
  totalItems: number;
  consumedItems: number;
  wastedItems: number;
  moneySaved: number;
  co2Reduced: number;
  wasteScore: number;
  badges: string[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData>({
    totalItems: 0,
    consumedItems: 0,
    wastedItems: 0,
    moneySaved: 0,
    co2Reduced: 0,
    wasteScore: 0,
    badges: []
  });
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchReportData();
  }, [user, navigate]);

  const fetchReportData = async () => {
    if (!user) return;
    
    try {
      // Fetch user's items
      const { data: items, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const totalItems = items?.length || 0;
      const consumedItems = items?.filter(item => item.consumed).length || 0;
      const wastedItems = items?.filter(item => {
        if (item.consumed) return false;
        const isExpired = differenceInDays(new Date(), new Date(item.expiry_date)) > 0;
        return isExpired;
      }).length || 0;

      // Calculate estimated money saved (₹50 average per item saved)
      const moneySaved = consumedItems * 50;
      
      // Calculate CO2 reduced (0.5kg CO2 per item saved from waste)
      const co2Reduced = consumedItems * 0.5;
      
      // Calculate waste score (percentage of items consumed vs total)
      const wasteScore = totalItems > 0 ? Math.round((consumedItems / totalItems) * 100) : 0;
      
      // Determine badges based on performance
      const badges = [];
      if (wasteScore >= 80) badges.push('Zero Waste Hero');
      if (wasteScore >= 60) badges.push('Eco Saver');
      if (consumedItems >= 10) badges.push('Consistent Consumer');
      if (moneySaved >= 500) badges.push('Money Saver');

      // Generate weekly data for charts
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayItems = items?.filter(item => {
          const createdDate = new Date(item.created_at || '');
          return format(createdDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        }) || [];
        
        weeklyData.push({
          day: format(date, 'MMM dd'),
          items: dayItems.length,
          consumed: dayItems.filter(item => item.consumed).length,
          wasted: dayItems.filter(item => {
            if (item.consumed) return false;
            return differenceInDays(new Date(), new Date(item.expiry_date)) > 0;
          }).length
        });
      }

      setReportData({
        totalItems,
        consumedItems,
        wastedItems,
        moneySaved,
        co2Reduced,
        wasteScore,
        badges
      });
      setWeeklyData(weeklyData);
    } catch (error: any) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Consumed', value: reportData.consumedItems, color: COLORS[0] },
    { name: 'Wasted', value: reportData.wastedItems, color: COLORS[1] },
    { name: 'Active', value: reportData.totalItems - reportData.consumedItems - reportData.wastedItems, color: COLORS[2] }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(profile?.role === 'retailer' ? '/retailer' : '/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Impact Reports</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Impact Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-full">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-700">Money Saved</p>
                  <p className="text-2xl font-bold text-green-800">₹{reportData.moneySaved}</p>
                  <p className="text-xs text-green-600">💰 Economic Impact</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-full">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700">Food Shared</p>
                  <p className="text-2xl font-bold text-blue-800">{reportData.consumedItems}</p>
                  <p className="text-xs text-blue-600">🫂 Social Impact</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-full">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-700">CO₂ Reduced</p>
                  <p className="text-2xl font-bold text-purple-800">{reportData.co2Reduced}kg</p>
                  <p className="text-xs text-purple-600">🌍 Environmental Impact</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500 rounded-full">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-700">Waste Score</p>
                  <p className="text-2xl font-bold text-orange-800">{reportData.wasteScore}%</p>
                  <p className="text-xs text-orange-600">🎯 Efficiency Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Food Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Food Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-sm">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="items" fill="hsl(var(--primary))" name="Total Items" />
                  <Bar dataKey="consumed" fill="hsl(var(--success))" name="Consumed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Achievements & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Your Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.badges.length > 0 ? (
                  reportData.badges.map((badge, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                      <Award className="h-5 w-5 text-primary" />
                      <div>
                        <Badge variant="secondary" className="mb-1">{badge}</Badge>
                        <p className="text-sm text-muted-foreground">
                          {badge === 'Zero Waste Hero' && 'Achieved 80%+ consumption rate!'}
                          {badge === 'Eco Saver' && 'Maintained 60%+ consumption rate!'}
                          {badge === 'Consistent Consumer' && 'Consumed 10+ items successfully!'}
                          {badge === 'Money Saver' && 'Saved ₹500+ from food waste!'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Start tracking food to unlock achievements!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Smart Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 This Week's Highlight</h4>
                  <p className="text-sm text-blue-700">
                    You saved ₹{Math.round(reportData.moneySaved / 4)} by eating food before expiry this week!
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">🌱 Environmental Impact</h4>
                  <p className="text-sm text-green-700">
                    Your actions reduced {reportData.co2Reduced}kg of CO₂ emissions - equivalent to planting {Math.round(reportData.co2Reduced * 2)} trees!
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">🎯 Improvement Tip</h4>
                  <p className="text-sm text-purple-700">
                    {reportData.wasteScore >= 80 
                      ? "Excellent work! Share your tips with the community."
                      : reportData.wasteScore >= 60
                      ? "Good progress! Try meal planning to reduce waste further."
                      : "Add more items and track their consumption to improve your score."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}