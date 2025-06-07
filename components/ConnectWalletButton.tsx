'use client';

import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function WalletAuthButton() {
  const { ready, authenticated, user } = usePrivy();
  const { login } = useLogin();
  const { logout } = useLogout();

  const handleLogin = async () => {
    try {
      await login({
        loginMethods: ['wallet'],
        walletChainType: 'ethereum-only',
      });
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logged out');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!ready) return <p>Loading Privy...</p>;

  if (authenticated && user?.wallet?.address) {
    const address = user.wallet.address;
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex bg-accent hover:animate-pulse items-center gap-2 px-3"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatar.png" alt="User" />
              <AvatarFallback>
                {address.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{shortAddress}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => alert('Profile clicked')}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => alert('Settings clicked')}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={handleLogin} size="sm">
      Connect Wallet
    </Button>
  );
}
