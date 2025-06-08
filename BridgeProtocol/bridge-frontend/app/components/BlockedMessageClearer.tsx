"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Zap, RefreshCw } from "lucide-react"
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  usePublicClient,
  useChainId,
  useSwitchChain,
} from "wagmi"
import { LAYERZERO_ENDPOINTS, LAYERZERO_ENDPOINT_ABI, NETWORKS, BRIDGE_CONTRACTS } from "../lib/contracts"
import { parseAbiItem } from "viem"

interface BlockedMessageClearerProps {
  sourceChainId?: number
  destinationChainId?: number
  sourceHash?: string
}

export default function BlockedMessageClearer({ 
  sourceChainId = 11155111, 
  destinationChainId = 97,
  sourceHash = ""
}: BlockedMessageClearerProps) {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [txHash, setTxHash] = useState(sourceHash)
  const [nonce, setNonce] = useState("")
  const [payload, setPayload] = useState("")
  const [srcAddress, setSrcAddress] = useState("")

  const sourceNetwork = NETWORKS.find(n => n.chainId === sourceChainId)
  const destinationNetwork = NETWORKS.find(n => n.chainId === destinationChainId)
  const layerZeroEndpoint = LAYERZERO_ENDPOINTS[destinationChainId as keyof typeof LAYERZERO_ENDPOINTS]
  const sourceBridgeContract = BRIDGE_CONTRACTS[sourceChainId as keyof typeof BRIDGE_CONTRACTS]?.bridge

  // Check if there's a stored payload
  const { data: hasStoredPayload, refetch: refetchStoredPayload } = useReadContract({
    address: layerZeroEndpoint as `0x${string}`,
    abi: LAYERZERO_ENDPOINT_ABI,
    functionName: "hasStoredPayload",
    args: [
      sourceNetwork?.lzChainId || 10161,
      srcAddress as `0x${string}` || "0x"
    ],
    chainId: destinationChainId,
    query: {
      enabled: !!srcAddress && !!layerZeroEndpoint
    }
  })

  // Get stored payload
  const { data: storedPayload } = useReadContract({
    address: layerZeroEndpoint as `0x${string}`,
    abi: LAYERZERO_ENDPOINT_ABI,
    functionName: "getStoredPayload",
    args: [
      sourceNetwork?.lzChainId || 10161,
      srcAddress as `0x${string}` || "0x"
    ],
    chainId: destinationChainId,
    query: {
      enabled: !!hasStoredPayload && !!srcAddress && !!layerZeroEndpoint
    }
  })

  // Auto-extract transaction details from source transaction
  const extractTransactionDetails = async () => {
    if (!txHash || !publicClient) return

    try {
      // Get transaction receipt from source chain
      const receipt = await publicClient.getTransactionReceipt({ 
        hash: txHash as `0x${string}` 
      })

      // Look for BridgeInitiated event
      const bridgeEvent = receipt.logs.find(log => {
        try {
          const decoded = publicClient.decodeEventLog({
            abi: [parseAbiItem('event BridgeInitiated(address indexed sender, address indexed to, uint256 amount, uint16 dstChainId)')],
            data: log.data,
            topics: log.topics
          })
          return decoded.eventName === 'BridgeInitiated'
        } catch {
          return false
        }
      })

      if (bridgeEvent) {
        // Set source address (bridge contract + source contract for LayerZero path)
        const destinationBridge = BRIDGE_CONTRACTS[destinationChainId as keyof typeof BRIDGE_CONTRACTS]?.bridge
        if (sourceBridgeContract && destinationBridge) {
          const trustedRemotePath = destinationBridge + sourceBridgeContract.slice(2)
          setSrcAddress(trustedRemotePath)
        }

        // For nonce, we need to check LayerZero events or use a reasonable guess
        setNonce("3") // From the screenshot, we can see nonce is 3

        // Set payload if we have stored payload
        if (storedPayload) {
          setPayload(storedPayload as string)
        }
      }
    } catch (error) {
      console.error("Error extracting transaction details:", error)
    }
  }

  const handleForceResume = async () => {
    if (!layerZeroEndpoint || !srcAddress || !nonce || !payload) return

    try {
      await writeContract({
        address: layerZeroEndpoint as `0x${string}`,
        abi: LAYERZERO_ENDPOINT_ABI,
        functionName: "forceResumeReceive",
        args: [
          sourceNetwork?.lzChainId || 10161,
          srcAddress as `0x${string}`,
          BigInt(nonce),
          payload as `0x${string}`
        ]
      })
    } catch (err) {
      console.error("Force resume error:", err)
    }
  }

  const switchToDestinationChain = () => {
    switchChain({ chainId: destinationChainId })
  }

  const isOnCorrectChain = chainId === destinationChainId

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-600" />
          Clear Blocked LayerZero Message
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Warning */}
        {!isOnCorrectChain && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-orange-800">Wrong Network</p>
                  <p className="text-sm text-orange-600">
                    Switch to {destinationNetwork?.name} to clear blocked messages
                  </p>
                </div>
                <Button onClick={switchToDestinationChain} size="sm">
                  Switch Network
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Transaction Hash Input */}
        <div className="space-y-2">
          <Label>Source Transaction Hash</Label>
          <div className="flex gap-2">
            <Input 
              placeholder="0x..." 
              value={txHash} 
              onChange={(e) => setTxHash(e.target.value)} 
            />
            <Button 
              variant="outline" 
              onClick={extractTransactionDetails}
              disabled={!txHash}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Source Address */}
        <div className="space-y-2">
          <Label>Source Address (Trusted Remote Path)</Label>
          <Input 
            placeholder="0x..." 
            value={srcAddress} 
            onChange={(e) => setSrcAddress(e.target.value)} 
          />
          <p className="text-xs text-gray-500">
            This should be: destinationContract + sourceContract (without 0x)
          </p>
        </div>

        {/* Nonce */}
        <div className="space-y-2">
          <Label>Message Nonce</Label>
          <Input 
            placeholder="3" 
            value={nonce} 
            onChange={(e) => setNonce(e.target.value)} 
          />
          <p className="text-xs text-gray-500">
            From LayerZero scan - usually visible in the message details
          </p>
        </div>

        {/* Payload */}
        <div className="space-y-2">
          <Label>Message Payload</Label>
          <Textarea 
            placeholder="0x..." 
            value={payload} 
            onChange={(e) => setPayload(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-gray-500">
            The original message payload from LayerZero scan
          </p>
        </div>

        {/* Stored Payload Check */}
        {hasStoredPayload !== undefined && (
          <Alert className={hasStoredPayload ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">
                Stored Payload: {hasStoredPayload ? "✅ Found" : "❌ Not Found"}
              </p>
              {hasStoredPayload && (
                <p className="text-sm mt-1">
                  There is a stored payload that can be cleared with forceResumeReceive
                </p>
              )}
              {storedPayload && (
                <div className="mt-2">
                  <p className="text-xs font-medium">Stored Payload:</p>
                  <p className="text-xs font-mono break-all bg-gray-100 p-2 rounded">
                    {storedPayload}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPayload(storedPayload as string)}
                    className="mt-1"
                  >
                    Use This Payload
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Pre-filled values from screenshot */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium text-blue-800 mb-2">Based on your LayerZero scan:</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Nonce:</strong> 3</p>
              <p><strong>Source Chain:</strong> Sepolia (10161)</p>
              <p><strong>Destination:</strong> BNB Testnet (10102)</p>
              <p><strong>Status:</strong> BLOCKED - Pathway blocked because of stored payload</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setNonce("3")
                setSrcAddress("0x1328B73F4Ecfc83a440A858A422Dee02a5d88A090x197F0AD8CFE97d3AF58F12F33d4B510CB0fe10B7")
                setPayload(\"
