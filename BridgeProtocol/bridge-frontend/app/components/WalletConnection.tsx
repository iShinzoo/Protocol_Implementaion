"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useConnect } from "wagmi"
import { injected } from "wagmi/connectors"

export default function WalletConnection() {
  const { connect, isPending } = useConnect()

  const handleConnect = () => {
    connect({ connector: injected() })
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <Wallet className="h-8 w-8 text-indigo-600" />
        </div>
        <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
        <CardDescription>Connect your wallet to start bridging tokens between networks</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button
          onClick={handleConnect}
          disabled={isPending}
          size="lg"
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </Button>
      </CardContent>
    </Card>
  )
}
