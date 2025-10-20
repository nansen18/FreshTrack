import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Leaf, 
  BarChart3, 
  LogOut, 
  Moon, 
  Sun,
  Store,
  Users
} from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';

export default function Navigation() {
  const { profile, signOut } = useAuth();
  const { theme, setTheme, isDark } = useDarkMode();
  const navigate = useNavigate();

  const isRetailer = profile?.role === 'retailer';

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isRetailer ? (
              <Store className="h-6 w-6 text-primary" />
            ) : (
              <Leaf className="h-6 w-6 text-primary" />
            )}
            <h1 className="text-xl font-bold">
              {isRetailer ? 'Retailer Dashboard' : 'FreshTrack'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              Welcome back{isRetailer ? ', Retailer' : ''}!
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {isRetailer && (
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <Users className="h-4 w-4 mr-2" />
                Community
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/reports')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}