"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

interface Transaction {
  id: string
  address: string
  type: "BUY" | "SELL"
  amount: string
  price: string
  highLow: "HIGH" | "LOW"
  timing: string
}

export function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch
    const fetchTransactions = async () => {
      // In a real app, this would be an API call
      setTimeout(() => {
        setTransactions([
          {
            id: "1",
            address: "0x1234...5337",
            type: "BUY",
            amount: "200$",
            price: "0.00023",
            highLow: "HIGH",
            timing: "03:01:10 PM",
          },
          {
            id: "2",
            address: "0x1234...5337",
            type: "BUY",
            amount: "200$",
            price: "0.00023",
            highLow: "HIGH",
            timing: "03:01:10 PM",
          },
          {
            id: "3",
            address: "0x1234...5337",
            type: "SELL",
            amount: "200$",
            price: "0.00023",
            highLow: "LOW",
            timing: "03:01:10 PM",
          },
          {
            id: "4",
            address: "0x1234...5337",
            type: "BUY",
            amount: "200$",
            price: "0.00023",
            highLow: "HIGH",
            timing: "03:01:10 PM",
          },
          {
            id: "5",
            address: "0x1234...5337",
            type: "BUY",
            amount: "200$",
            price: "0.00023",
            highLow: "HIGH",
            timing: "03:01:10 PM",
          },
        ])
        setLoading(false)
      }, 1500)
    }

    fetchTransactions()
  }, [])

  if (loading) {
    return <TransactionTableSkeleton />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="text-left pb-2">address</th>
            <th className="text-left pb-2">Type</th>
            <th className="text-right pb-2">Amount</th>
            <th className="text-right pb-2">Price</th>
            <th className="text-right pb-2">High/Low</th>
            <th className="text-right pb-2">timing</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, index) => (
            <motion.tr
              key={tx.id}
              className="border-t border-border/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <td className="py-3 text-sm">{tx.address}</td>
              <td className={`py-3 text-sm ${tx.type === "BUY" ? "text-success" : "text-destructive"}`}>{tx.type}</td>
              <td className="py-3 text-right text-sm">{tx.amount}</td>
              <td className="py-3 text-right text-sm">{tx.price}</td>
              <td className="py-3 text-right text-sm">{tx.highLow}</td>
              <td className="py-3 text-right text-sm">{tx.timing}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TransactionTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-4 w-[40px]" />
        <Skeleton className="h-4 w-[60px]" />
        <Skeleton className="h-4 w-[60px]" />
        <Skeleton className="h-4 w-[60px]" />
        <Skeleton className="h-4 w-[80px]" />
      </div>

      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex justify-between items-center py-3 border-t border-border/20">
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[40px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      ))}
    </div>
  )
}
