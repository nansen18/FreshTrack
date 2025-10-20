import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import ReverseCommerceHub from '@/components/ReverseCommerceHub';

export default function RetailerReverseCommerce() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ReverseCommerceHub retailerId={user.id} />
    </div>
  );
}