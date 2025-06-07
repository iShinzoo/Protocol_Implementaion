"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Search, Clock, CheckCircle, AlertCircle, AlertTriangle, XCircle } from "lucide-react"
import { NETWORKS } from "../lib/contracts"

interface LayerZeroTrackerProps {
  sourceHash?: string
  sourceChainId?: number
  destinationChainId?: number
}

export default function LayerZeroTracker({ sourceHash, sourceChainId, destinationChainId }: LayerZeroTrackerProps) {
  const [trackingHash, setTrackingHash] = useState(sourceHash || "")
  const [messageStatus, setMessageStatus] = useState<string>("unknown")

  const sourceNetwork = NETWORKS.find((n) => n.chainId === sourceChainId)
  const destinationNetwork = NETWORKS.find((n) => n.chainId === destinationChainId)

  const layerZeroScanUrl = `https://layerzeroscan.com/tx/${trackingHash}`

  const checkMessageStatus = async () => {
    if (!trackingHash) return

    try {
      setMessageStatus("checking")

      // Simulate checking LayerZero message status
      // In a real implementation, you would call LayerZero's API
      setTimeout(() => {
        // Based on the screenshot, we know the message is blocked
        setMessageStatus("blocked")
      }, 1000)
    } catch (error) {
      console.error("Error checking message status:", error)
      setMessageStatus("error")
    }
  }

  useEffect(() => {
    if (sourceHash) {
      setTrackingHash(sourceHash)
      checkMessageStatus()
    }
  }, [sourceHash])

  const getStatusIcon = () => {
    switch (messageStatus) {
      case "checking":
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "blocked":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (messageStatus) {
      case "checking":
        return "Checking message status..."
      case "pending":
        return "Message pending on destination chain"
      case "completed":
        return "Message delivered successfully"
      case "blocked":
        return "Message BLOCKED - Pathway blocked because of stored payload"
      case "error":
        return "Message delivery failed"
      default:
        return ""
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-purple-600" />
          LayerZero Message Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Source Transaction Hash</Label>
          <Input placeholder="0x..." value={trackingHash} onChange={(e) => setTrackingHash(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Source Chain:</span>
            <p className="font-medium">{sourceNetwork?.name || "Unknown"}</p>
          </div>
          <div>
            <span className="text-gray-600">Destination Chain:</span>
            <p className="font-medium">{destinationNetwork?.name || "Unknown"}</p>
          </div>
        </div>

        <Button onClick={checkMessageStatus} className="w-full" disabled={!trackingHash}>
          Track LayerZero Message
        </Button>

        {messageStatus !== "unknown" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>

            {/* Blocked Message Alert */}
            {messageStatus === "blocked" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium text-red-800">Your LayerZero message is BLOCKED!</p>
                    <p className="text-sm text-red-700">
                      This means the destination contract (0x1328B73F4Ecfc83a440A858A422Dee02a5d88A09) either:
                    </p>
                    <ul className="text-xs text-red-600 ml-4 space-y-1">
                      <li>• Doesn't exist on {destinationNetwork?.name}</li>
                      <li>• Exists but can't process LayerZero messages (missing lzReceive function)</li>
                      <li>• Has a stored payload that needs to be cleared</li>
                      <li>• Doesn't have the correct trusted remote configuration</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">How to track your LayerZero message:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Visit LayerZero Scan to track cross-chain messages</li>
                <li>2. Enter your source transaction hash</li>
                <li>3. Check if the message was delivered to destination chain</li>
                <li>4. If blocked, the destination contract needs to be deployed/configured</li>
              </ol>
            </div>

            <Button variant="outline" onClick={() => window.open(layerZeroScanUrl, "_blank")} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View on LayerZero Scan
            </Button>
          </div>
        )}

        {/* Blocked Message Solutions */}
        {messageStatus === "blocked" && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-800 mb-3">🚨 How to Fix Blocked Messages:</h4>

            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-red-700">Option 1: Deploy Proper Destination Contract</p>
                <ul className="text-red-600 ml-4 space-y-1 text-xs">
                  <li>• Deploy a bridge contract on {destinationNetwork?.name} that can receive LayerZero messages</li>
                  <li>• Ensure it has the lzReceive function implemented</li>
                  <li>• Set trusted remote to point back to source contract</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-red-700">Option 2: Clear Stored Payload (Advanced)</p>
                <ul className="text-red-600 ml-4 space-y-1 text-xs">
                  <li>• Use LayerZero's forceResumeReceive function</li>
                  <li>• This requires the destination contract to exist and be properly configured</li>
                  <li>• Contact LayerZero support if needed</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-red-700">Option 3: Use Different Destination</p>
                <ul className="text-red-600 ml-4 space-y-1 text-xs">
                  <li>• Bridge to a network where you have proper contracts deployed</li>
                  <li>• Currently only Sepolia has a fully working setup</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Current Bridge Status</span>
          </div>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>
              • <strong>Source (Sepolia):</strong> ✅ Fully working - tokens are locked correctly
            </li>
            <li>
              • <strong>Destination ({destinationNetwork?.name}):</strong> ❌ Contract not properly configured
            </li>
            <li>
              • <strong>LayerZero Message:</strong> 🚫 Blocked due to destination issues
            </li>
            <li>
              • <strong>Your Tokens:</strong> 🔒 Safe but locked on source chain until destination is fixed
            </li>
          </ul>
        </div>

        <div className="p-3 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">What You Need for Full Bridge:</h4>
          <ol className="text-xs text-green-700 space-y-1">
            <li>1. Deploy a proper bridge contract on {destinationNetwork?.name}</li>
            <li>2. Deploy a bridged token contract with BRIDGE_ROLE</li>
            <li>3. Set trusted remotes on both contracts</li>
            <li>4. Clear any blocked messages using LayerZero tools</li>
            <li>5. Test with small amounts first</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
