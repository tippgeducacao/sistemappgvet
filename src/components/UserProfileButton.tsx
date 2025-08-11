import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/AuthStore';
import UserProfileModal from '@/components/UserProfileModal';

const UserProfileButton: React.FC = () => {
  const { profile, currentUser } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Usar currentUser se disponível, senão profile
  const user = currentUser || profile;
  
  if (!user) return null;

  return (
    <>
      <Button
        variant="ghost"
        className="flex items-center gap-2 h-auto p-2"
        onClick={() => setIsProfileOpen(true)}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={(user as any).photo_url || ''} alt={user.name} />
          <AvatarFallback>
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium">{user.name}</span>
      </Button>

      {user && (
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          canEdit={true} // Usuário visualizando seu próprio perfil
        />
      )}
    </>
  );
};

export default UserProfileButton;