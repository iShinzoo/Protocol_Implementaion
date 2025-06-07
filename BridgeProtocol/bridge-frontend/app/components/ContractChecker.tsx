"use client"

import React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { usePublicClient } from "wagmi"
import { BRIDGE_CONTRACTS, NETWORKS } from "../lib/contracts"
import { useState } from "react"

export default function ContractChecker() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <span>Bridge Contract Status</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(BRIDGE_CONTRACTS).map(([chainId, contracts]) => {
          const network = NETWORKS.find((n) => n.chainId === Number(chainId))
          if (!network) return null

          return <ContractStatusRow key={`${chainId}-${refreshKey}`} network={network} contracts={contracts} />
        })}

        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-red-800">Critical Issue Identified:</p>
              <p className="text-sm text-red-700">
                Your LayerZero message is blocked because the destination contract
                (0x1328B73F4Ecfc83a440A858A422Dee02a5d88A09) on BNB testnet either doesn't exist or can't process
                LayerZero messages properly.
              </p>
              <p className="text-xs text-red-600">
                This is why tokens don't appear on BSC scan - the cross-chain message never completes.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

function ContractStatusRow({
  network,
  contracts,
}: {
  network: (typeof NETWORKS)[0]
  contracts: { bridge: string; token: string }
}) {
  const publicClient = usePublicClient({ chainId: network.chainId })
  const [bridgeExists, setBridgeExists] = useState<boolean | null>(null)
  const [tokenExists, setTokenExists] = useState<boolean | null>(null)

  // Check if contracts exist by getting their bytecode
  const checkContractExists = async (address: string, type: "bridge" | "token") => {
    try {
      if (!publicClient) return

      const bytecode = await publicClient.getBytecode({ address: address as `0x${string}` })
      const exists = bytecode && bytecode !== "0x"

      if (type === "bridge") {
        setBridgeExists(exists)
      } else {
        setTokenExists(exists)
      }
    } catch (error) {
      console.error(`Error checking ${type} contract:`, error)
      if (type === "bridge") {
        setBridgeExists(false)
      } else {
        setTokenExists(false)
      }
    }
  }

  // Check contracts on mount
  React.useEffect(() => {
    checkContractExists(contracts.bridge, "bridge")
    checkContractExists(contracts.token, "token")
  }, [contracts, publicClient])

  const getStatusIcon = (exists: boolean | null) => {
    if (exists === null) return <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
    if (exists) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (exists: boolean | null) => {
    if (exists === null) return <Badge variant="outline">Checking...</Badge>
    if (exists)
      return (
        <Badge variant="default" className="bg-green-600">
          Deployed
        </Badge>
      )
    return <Badge variant="destructive">Not Found</Badge>
  }

  return (
    <div className="p-3 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{network.name}</h4>
          <p className="text-xs text-gray-500">
            Chain ID: {network.chainId} | LZ ID: {network.lzChainId}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`${network.explorer}/address/${contracts.bridge}`, "_blank")}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getStatusIcon(bridgeExists)}
            <span>Bridge Contract</span>
          </div>
          {getStatusBadge(bridgeExists)}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getStatusIcon(tokenExists)}
            <span>Token Contract</span>
          </div>
          {getStatusBadge(tokenExists)}
        </div>
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <p>Bridge: {contracts.bridge}</p>
        <p>Token: {contracts.token}</p>
      </div>

      {/* Special warning for BNB testnet */}
      {network.chainId === 97 && bridgeExists === false && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>This is why your LayerZero message is blocked!</strong> The destination bridge contract doesn't
            exist on BNB testnet, so LayerZero can't deliver the message.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
