'use client';

import { motion } from 'framer-motion';
import { Copy, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';

const user = {
  name: 'Jayyy',
  address: '0x1234abcd5678efgh',
  avatar:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-05-30%20at%206.08.58%E2%80%AFAM-XAaoCjVooMfrjzRHxajjsdCWhgtBuE.png',
};

export function UserProfile() {
  const copyWallet = () => {
    navigator.clipboard.writeText('0x1234...5678');
    toast({
      title: 'Wallet address copied',
      description: 'The wallet address has been copied to your clipboard.',
    });
  };

  return (
    <Card className="bg-card/50 mb-6">
      <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={user.avatar} alt={`${user.name}'s Avatar`} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        <div className="flex-1">
          <h2 className="text-lg font-bold">{user.name}</h2>
          <div className="flex items-center text-sm text-muted-foreground">
            <span>
              {user.address.slice(0, 6)}...{user.address.slice(-4)}
            </span>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      navigator.clipboard.writeText(user.address);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy wallet address</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex gap-2 self-end md:self-center">
          <Button variant="outline" size="sm" className="text-xs">
            <ExternalLink className="mr-1 h-3 w-3" />
            Add Funds{' '}
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            Withdraw{' '}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
