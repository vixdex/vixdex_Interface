'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserProfile } from '@/components/user-profile';
import { AssetTable } from '@/components/asset-table';
import { ArrowBigLeftDashIcon } from 'lucide-react';
import Link from 'next/link';
import FeeEarningsTable from '@/components/derive-table';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="container py-6 space-y-6">
      <Link href="/" className="flex items-center ">
        <motion.div
          className="text-[#4ade80] hover:text-[#4ade80]/90 text-sm"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <ArrowBigLeftDashIcon />
        </motion.div>
        <motion.div
          className=" text-[#4ade80] hover:text-[#4ade80]/90 text-sm"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <span>back to home</span>
        </motion.div>
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <UserProfile />
      </motion.div>

      <motion.div
        className="grid grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Holdings</div>
            <div className="text-2xl font-bold mt-1">5000$</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">total market</div>
            <div className="text-2xl font-bold mt-1">2560$</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">total vol</div>
            <div className="text-2xl font-bold mt-1">$256k</div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <h2 className="text-xl font-bold mb-4">My Assets</h2>

            <Tabs defaultValue="holdings">
              <TabsList className="mb-4 bg-background/50">
                <TabsTrigger value="holdings">Holdings</TabsTrigger>
                <TabsTrigger value="derive">Derive positions</TabsTrigger>
              </TabsList>

              <TabsContent value="holdings">
                <AssetTable />
              </TabsContent>

              <TabsContent value="derive">
                <FeeEarningsTable showDerive={true} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Button
          onClick={() => router.push('/trade')}
          className="w-full max-w-xs"
          variant="outline"
        >
          View All Trades
        </Button>
      </motion.div>
    </div>
  );
}
