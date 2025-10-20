import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Heart, 
  MapPin, 
  Calendar, 
  Plus,
  Share2,
  Clock,
  Package
} from 'lucide-react';
import { format, addDays } from 'date-fns';

interface CommunityItem {
  id: string;
  name: string;
  description: string;
  expiryDate: string;
  location: string;
  userName: string;
  userInitials: string;
  distance: number;
  category: string;
  quantity: string;
  postedAt: string;
}

export default function CommunityHub() {
  const { toast } = useToast();
  const [availableItems, setAvailableItems] = useState<CommunityItem[]>([
    {
      id: '1',
      name: 'Fresh Bananas',
      description: 'Slightly overripe bananas, perfect for smoothies or baking!',
      expiryDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
      location: 'Koramangala, Bangalore',
      userName: 'Priya S.',
      userInitials: 'PS',
      distance: 0.8,
      category: 'Fruits',
      quantity: '1 kg',
      postedAt: '2 hours ago'
    },
    {
      id: '2',
      name: 'Bread Loaf',
      description: 'Day-old whole wheat bread, great for toast or breadcrumbs',
      expiryDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      location: 'Whitefield, Bangalore',
      userName: 'Amit K.',
      userInitials: 'AK',
      distance: 2.3,
      category: 'Bakery',
      quantity: '1 loaf',
      postedAt: '4 hours ago'
    },
    {
      id: '3',
      name: 'Mixed Vegetables',
      description: 'Assorted vegetables from my garden - tomatoes, onions, peppers',
      expiryDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
      location: 'HSR Layout, Bangalore',
      userName: 'Lakshmi R.',
      userInitials: 'LR',
      distance: 1.5,
      category: 'Vegetables',
      quantity: '2 kg mix',
      postedAt: '6 hours ago'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFoodItem, setNewFoodItem] = useState({
    name: '',
    description: '',
    expiryDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    location: '',
    category: '',
    quantity: '',
    userName: 'You',
    userInitials: 'Y'
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Fruits': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Vegetables': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      'Bakery': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Dairy': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Grains': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'default': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    return colors[category] || colors['default'];
  };

  const getUrgencyColor = (expiryDate: string) => {
    const days = Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 1) return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
    if (days <= 2) return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950';
    return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
  };

  const handleClaim = (itemId: string) => {
    // Simulate claiming an item
    setAvailableItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Item claimed!",
      description: "Thank you for helping reduce food waste! 🌱"
    });
  };

  const handleShare = (item: CommunityItem) => {
    const shareText = `Check out this free food item: ${item.name} - ${item.description}. Available in ${item.location}`;
    const shareUrl = `${window.location.origin}/community?item=${item.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: `FreshTrack - ${item.name}`,
        text: shareText,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard"
      });
    }
  };

  const handleAddFood = async (foodData: Omit<CommunityItem, 'id' | 'postedAt'>) => {
    // In a real app, this would save to Supabase
    const newItem: CommunityItem = {
      ...foodData,
      id: Date.now().toString(),
      postedAt: 'Just now'
    };
    
    setAvailableItems(prev => [newItem, ...prev]);
    setShowAddForm(false);
    
    toast({
      title: "Food shared successfully!",
      description: "Your item is now available for the community"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Community Sharing Hub
            </CardTitle>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Share Food
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Share food that you can't finish and discover free items from neighbors. Together, we can reduce food waste! 🌱
          </p>
          <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span>15 items saved this week</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span>52 active sharers nearby</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Form */}
      {showAddForm && (
        <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
          <CardHeader>
            <CardTitle className="text-primary">Share Your Food</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="food-name">Food Name</Label>
                <Input
                  id="food-name"
                  placeholder="e.g., Fresh Bananas"
                  value={newFoodItem.name}
                  onChange={(e) => setNewFoodItem({ ...newFoodItem, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="food-category">Category</Label>
                <Input
                  id="food-category"
                  placeholder="e.g., Fruits, Vegetables"
                  value={newFoodItem.category}
                  onChange={(e) => setNewFoodItem({ ...newFoodItem, category: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="food-quantity">Quantity</Label>
                <Input
                  id="food-quantity"
                  placeholder="e.g., 1 kg, 2 loaves"
                  value={newFoodItem.quantity}
                  onChange={(e) => setNewFoodItem({ ...newFoodItem, quantity: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="food-expiry">Expiry Date</Label>
                <Input
                  id="food-expiry"
                  type="date"
                  value={newFoodItem.expiryDate}
                  onChange={(e) => setNewFoodItem({ ...newFoodItem, expiryDate: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="food-location">Pickup Location</Label>
                <Input
                  id="food-location"
                  placeholder="e.g., Koramangala, Bangalore"
                  value={newFoodItem.location}
                  onChange={(e) => setNewFoodItem({ ...newFoodItem, location: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="food-description">Description</Label>
                <Textarea
                  id="food-description"
                  placeholder="Brief description of the food item and its condition"
                  value={newFoodItem.description}
                  onChange={(e) => setNewFoodItem({ ...newFoodItem, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  if (newFoodItem.name && newFoodItem.location && newFoodItem.category) {
                    handleAddFood({
                      ...newFoodItem,
                      distance: 0.5,
                      userName: 'You',
                      userInitials: 'Y'
                    });
                    setNewFoodItem({
                      name: '',
                      description: '',
                      expiryDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
                      location: '',
                      category: '',
                      quantity: '',
                      userName: 'You',
                      userInitials: 'Y'
                    });
                  }
                }}
                disabled={!newFoodItem.name || !newFoodItem.location || !newFoodItem.category}
              >
                Share Food
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Items */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Near You</h3>
        {availableItems.map((item) => (
          <Card key={item.id} className={`transition-all hover:shadow-md ${getUrgencyColor(item.expiryDate)}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {item.userInitials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">by {item.userName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getCategoryColor(item.category)}>
                        {item.category}
                      </Badge>
                      <Badge variant="outline">{item.quantity}</Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3">{item.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{item.location} ({item.distance} km away)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Expires: {format(new Date(item.expiryDate), 'MMM dd')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{item.postedAt}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleClaim(item.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      Claim Item
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleShare(item)}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {availableItems.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">All items claimed!</h3>
              <p className="text-muted-foreground">
                Great job community! All shared items have been claimed. Check back later for new items.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Community Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Community Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">247</p>
              <p className="text-sm text-muted-foreground">Items Shared This Month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">₹12,350</p>
              <p className="text-sm text-muted-foreground">Money Saved by Community</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">85.5 kg</p>
              <p className="text-sm text-muted-foreground">Food Waste Prevented</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}