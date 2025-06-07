"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExternalLink, Search, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { useReadContract } from "wagmi"
import { formatUnits, isAddress } from "viem"
import { ERC20_ABI, NETWORKS, BRIDGE_DESTINATION_ADDRESS } from "../lib/contracts"

interface VerificationProps {
  userAddress?: string
}

export default function BridgeVerification({ userAddress }: VerificationProps) {
  const [checkAddress, setCheckAddress] = useState(userAddress || "")
  const [selectedToken, setSelectedToken] = useState("")
  const [selectedNetwork, setSelectedNetwork] = useState("97") // BNB testnet

  const network = NETWORKS.find((n) => n.chainId === Number.parseInt(selectedNetwork))

  // Check balance on destination network
  const { data: balance, isLoading } = useReadContract({
    address: selectedToken as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [checkAddress as `0x${string}`],
    chainId: Number.parseInt(selectedNetwork),
    query: {
      enabled: !!checkAddress && !!selectedToken && isAddress(checkAddress) && isAddress(selectedToken),
    },
  })

  // Check if destination contract has bridge role (for debugging)
  const { data: hasBridgeRole } = useReadContract({
    address: selectedToken as `0x${string}`,
    abi: [
      {
        inputs: [
          { internalType: "bytes32", name: "role", type: "bytes32" },
          { internalType: "address", name: "account", type: "address" },
        ],
        name: "hasRole",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "hasRole",
    args: [
      "0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848", // BRIDGE_ROLE
      BRIDGE_DESTINATION_ADDRESS,
    ],
    chainId: Number.parseInt(selectedNetwork),
    query: {
      enabled: !!selectedToken && isAddress(selectedToken),
    },
  })

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-indigo-600" />
            Verify Bridge Transfer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Wallet Address to Check</Label>
            <Input placeholder="0x..." value={checkAddress} onChange={(e) => setCheckAddress(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Token Contract Address (on destination)</Label>
            <Input placeholder="0x..." value={selectedToken} onChange={(e) => setSelectedToken(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Network to Check</Label>
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NETWORKS.filter((n) => n.chainId !== 11155111).map((network) => (
                  <SelectItem key={network.chainId} value={network.chainId.toString()}>
                    {network.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Balance Display */}
          {balance !== undefined && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Token Balance Found</p>
                  <p className="text-sm text-green-600">
                    Balance: {formatUnits(balance, 18)} tokens on {network?.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bridge Role Check */}
          {hasBridgeRole !== undefined && (
            <div className={`p-4 rounded-lg ${hasBridgeRole ? "bg-green-50" : "bg-red-50"}`}>
              <div className="flex items-center gap-2">
                {hasBridgeRole ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className={`font-medium ${hasBridgeRole ? "text-green-800" : "text-red-800"}`}>
                    Bridge Role: {hasBridgeRole ? "✓ Granted" : "✗ Not Granted"}
                  </p>
                  <p className={`text-sm ${hasBridgeRole ? "text-green-600" : "text-red-600"}`}>
                    {hasBridgeRole
                      ? "Destination contract can mint tokens"
                      : "Destination contract cannot mint tokens - this is why bridging fails!"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <p className="text-blue-800">Checking balance...</p>
              </div>
            </div>
          )}

          {/* Explorer Link */}
          {network && checkAddress && isAddress(checkAddress) && (
            <Button
              variant="outline"
              onClick={() => window.open(`${network.explorer}/address/${checkAddress}`, "_blank")}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Address on {network.name} Explorer
            </Button>
          )}

          {/* Troubleshooting Guide */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Troubleshooting Bridge Issues:</h4>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>
                1. <strong>Check Source Transaction:</strong> Verify tokens were sent to bridge contract on Sepolia
              </li>
              <li>
                2. <strong>Wait for LayerZero:</strong> Cross-chain messages can take 10-20 minutes
              </li>
              <li>
                3. <strong>Check Bridge Role:</strong> Destination contract must have BRIDGE_ROLE to mint tokens
              </li>
              <li>
                4. <strong>Verify Token Contract:</strong> Make sure you're checking the correct token address on
                destination
              </li>
              <li>
                5. <strong>Check LayerZero Scan:</strong> Track the cross-chain message status
              </li>
            </ol>
          </div>

          {/* Common Token Addresses */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Common Destination Token Addresses:</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p>
                <strong>BNB Testnet TBT:</strong> (Deploy bridged token contract first)
              </p>
              <p>
                <strong>Bridge Contract:</strong> {BRIDGE_DESTINATION_ADDRESS}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
