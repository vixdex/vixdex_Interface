'use client';

import {
  useLogin,
  useLogout,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
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
import { Copy, LogOut, Wallet } from 'lucide-react';
import { useToast } from './ui/use-toast';

export function AuthButton() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { login } = useLogin();
  const { logout } = useLogout();
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      // For non-custodial login, we'll use the default configuration
      // which is already set up in the PrivyProvider
      await login({
        // Only show wallet options for non-custodial login
        loginMethods: ['wallet'],
      });
    } catch (err) {
      console.error('Login failed:', err);
      toast({
        title: 'Login failed',
        description:
          'There was an error connecting your wallet. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (err) {
      console.error('Logout failed:', err);
      toast({
        title: 'Logout failed',
        description: 'There was an error logging out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = async (text: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      toast({
        title: 'Copied!',
        description: 'Address copied to clipboard',
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: 'Copy failed',
        description: 'Failed to copy address to clipboard',
        variant: 'destructive',
      });
    }
  };

  if (!ready) return <Button disabled>Loading...</Button>;

  if (authenticated) {
    // Get the smart wallet if available, otherwise get the first connected wallet
    const wallet =
      wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
    const address = wallet?.address || user?.wallet?.address;

    if (!address) {
      return (
        <Button onClick={handleLogin} variant="default">
          Connect Wallet
        </Button>
      );
    }

    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const isSmartWallet = wallet?.walletClientType === 'privy';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 border-border/40 bg-accent hover:animate-pulse hover:bg-accent/90 hover:text-accent-foreground px-3"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatar.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-sm">{shortAddress}</span>
                  <button
                    type="button"
                    onClick={(e) => copyToClipboard(address, e)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                    title="Copy address"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isSmartWallet && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      Smart Wallet
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      SM
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              copyToClipboard(address);
            }}
            className="cursor-pointer"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => alert('Profile clicked')}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => alert('Settings clicked')}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={handleLogin} size="sm">
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  );
}
