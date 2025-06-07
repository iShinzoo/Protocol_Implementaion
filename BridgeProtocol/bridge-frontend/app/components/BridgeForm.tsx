"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Send, AlertCircle, CheckCircle, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import {
  useAccount,
  useDisconnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useChainId,
  useSwitchChain,
} from "wagmi"
import { parseEther, parseUnits, formatEther, formatUnits, isAddress } from "viem"
import { BRIDGE_SOURCE_ABI, ERC20_ABI, NETWORKS, PRESET_TOKENS, BRIDGE_CONTRACTS } from "../lib/contracts"
import LayerZeroTracker from "./LayerZeroTracker"

export default function BridgeForm() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Use useState with undefined initial state to prevent hydration mismatch
  const [amount, setAmount] = useState<string>("")
  const [selectedToken, setSelectedToken] = useState<string>("")
  const [customTokenAddress, setCustomTokenAddress] = useState<string>("")
  const [sourceChain, setSourceChain] = useState<string | undefined>(undefined)
  const [destinationChain, setDestinationChain] = useState<string | undefined>(undefined)
  const [bridgeFee, setBridgeFee] = useState<string | undefined>(undefined)
  const [needsApproval, setNeedsApproval] = useState<boolean | undefined>(undefined)
  const [isApproving, setIsApproving] = useState<boolean | undefined>(undefined)
  const [tokenDecimals, setTokenDecimals] = useState<number | undefined>(undefined)
  
  // Set default values after initial render to prevent hydration mismatch
  useEffect(() => {
    setSourceChain("11155111") // Sepolia default
    setDestinationChain("97") // BNB testnet
    setBridgeFee("0.001")
    setNeedsApproval(false)
    setIsApproving(false)
    setTokenDecimals(18)
  }, [])

  // Get network info - use null checks to prevent hydration errors
  const sourceNetwork = sourceChain ? NETWORKS.find((n) => n.chainId === Number.parseInt(sourceChain)) : undefined
  const destinationNetwork = destinationChain ? NETWORKS.find((n) => n.chainId === Number.parseInt(destinationChain)) : undefined
  const currentNetwork = NETWORKS.find((n) => n.chainId === chainId)

  // Get bridge contract addresses - use null checks to prevent hydration errors
  const sourceBridgeContract = sourceChain ? BRIDGE_CONTRACTS[Number.parseInt(sourceChain) as keyof typeof BRIDGE_CONTRACTS]?.bridge : undefined
  const destinationBridgeContract = destinationChain ? 
    BRIDGE_CONTRACTS[Number.parseInt(destinationChain) as keyof typeof BRIDGE_CONTRACTS]?.bridge : undefined

  // Get the actual token address being used
  const tokenAddress = selectedToken === "custom" ? customTokenAddress : selectedToken
  const isValidToken = tokenAddress && isAddress(tokenAddress)

  // Get token decimals
  const { data: decimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
    chainId: Number.parseInt(sourceChain),
    query: {
      enabled: !!isValidToken,
    },
  })

  // Update token decimals when they're fetched
  useEffect(() => {
    if (decimals) {
      setTokenDecimals(decimals)
    }
  }, [decimals])

  // Check if trusted remote is set for destination chain
  const { data: trustedRemote, refetch: refetchTrustedRemote } = useReadContract({
    address: sourceBridgeContract as `0x${string}`,
    abi: BRIDGE_SOURCE_ABI,
    functionName: "trustedRemoteLookup",
    args: [destinationNetwork?.lzChainId || 10102],
    chainId: Number.parseInt(sourceChain),
    query: {
      enabled: !!destinationNetwork && !!sourceBridgeContract,
      refetchInterval: 5000,
    },
  })

  // Check bridge token address
  const { data: bridgeTokenAddress } = useReadContract({
    address: sourceBridgeContract as `0x${string}`,
    abi: BRIDGE_SOURCE_ABI,
    functionName: "token",
    chainId: Number.parseInt(sourceChain),
    query: {
      enabled: !!sourceBridgeContract,
    },
  })

  // Check token allowance
  const { data: allowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address!, sourceBridgeContract as `0x${string}`],
    chainId: Number.parseInt(sourceChain),
    query: {
      enabled: !!address && !!isValidToken && !!sourceBridgeContract,
    },
  })

  // Check token balance
  const { data: balance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address!],
    chainId: Number.parseInt(sourceChain),
    query: {
      enabled: !!address && !!isValidToken,
    },
  })

  // Get token symbol
  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "symbol",
    chainId: Number.parseInt(sourceChain),
    query: {
      enabled: !!isValidToken,
    },
  })

  // Check if approval is needed
  useEffect(() => {
    if (allowance && amount && isValidToken && tokenDecimals) {
      const amountWei = parseUnits(amount || "0", tokenDecimals)
      setNeedsApproval(allowance < amountWei)
    } else {
      setNeedsApproval(false)
    }
  }, [allowance, amount, tokenAddress, tokenDecimals, isValidToken])

  // Estimate bridge fees
  const { data: estimatedFees } = useReadContract({
    address: sourceBridgeContract as `0x${string}`,
    abi: BRIDGE_SOURCE_ABI,
    functionName: "estimateFees",
    args: [
      destinationNetwork?.lzChainId || 10102,
      address || "0x",
      amount && tokenDecimals ? parseUnits(amount || "0", tokenDecimals) : 0n,
    ],
    chainId: Number.parseInt(sourceChain),
    query: {
      enabled: !!address && !!amount && !!destinationNetwork && !!tokenDecimals && !!sourceBridgeContract,
    },
  })

  // Update bridge fee based on estimation
  useEffect(() => {
    if (estimatedFees && estimatedFees[0]) {
      const estimatedFeeEth = formatEther(estimatedFees[0])
      setBridgeFee(estimatedFeeEth)
    }
  }, [estimatedFees])

  const handleSetupTrustedRemote = async () => {
    if (!destinationNetwork || !destinationBridgeContract || !sourceBridgeContract) return

    try {
      // For LayerZero, the trusted remote path should be: destinationContract + sourceContract
      const trustedRemotePath = (destinationBridgeContract + sourceBridgeContract.slice(2)) as `0x${string}`

      console.log("Setting trusted remote:", {
        chainId: destinationNetwork.lzChainId,
        path: trustedRemotePath,
      })

      await writeContract({
        address: sourceBridgeContract as `0x${string}`,
        abi: BRIDGE_SOURCE_ABI,
        functionName: "setTrustedRemote",
        args: [destinationNetwork.lzChainId, trustedRemotePath],
      })
    } catch (err) {
      console.error("Setup error:", err)
    }
  }

  const handleApprove = async () => {
    if (!isValidToken || !sourceBridgeContract) return

    setIsApproving(true)
    try {
      const amountWei = parseUnits(amount, tokenDecimals)
      await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [sourceBridgeContract as `0x${string}`, amountWei],
      })
    } catch (err) {
      console.error("Approval error:", err)
    } finally {
      setIsApproving(false)
    }
  }

  const handleBridge = async () => {
    if (!amount || !address || !isValidToken || !destinationNetwork || !sourceBridgeContract) return

    try {
      const bridgeAmount = parseUnits(amount, tokenDecimals)
      const feeAmount = parseEther(bridgeFee)
      const destChainId = destinationNetwork.lzChainId

      // For LayerZero, destination address should be encoded as bytes
      const destinationAddressBytes = address as `0x${string}`

      console.log("Bridge parameters:", {
        destChainId,
        destinationAddressBytes,
        bridgeAmount: bridgeAmount.toString(),
        feeAmount: feeAmount.toString(),
        tokenAddress,
        tokenDecimals,
        sourceBridgeContract,
      })

      writeContract({
        address: sourceBridgeContract as `0x${string}`,
        abi: BRIDGE_SOURCE_ABI,
        functionName: "bridgeTokens",
        args: [destChainId, destinationAddressBytes, bridgeAmount],
        value: feeAmount,
      })
    } catch (err) {
      console.error("Bridge error:", err)
    }
  }

  const getExplorerUrl = (hash: string, chainId: number) => {
    const network = NETWORKS.find((n) => n.chainId === chainId)
    return network ? `${network.explorer}/tx/${hash}` : `https://etherscan.io/tx/${hash}`
  }

  const switchToSourceChain = () => {
    switchChain({ chainId: Number.parseInt(sourceChain) })
  }

  // Check if bridge is properly configured
  const isTrustedRemoteSet = trustedRemote && trustedRemote !== "0x" && trustedRemote.length > 2

  const handleRefreshConfig = () => {
    refetchTrustedRemote()
  }

  const canBridge =
    amount &&
    selectedToken &&
    chainId === Number.parseInt(sourceChain) &&
    isTrustedRemoteSet &&
    (!needsApproval || !isValidToken) &&
    !isPending &&
    !isConfirming &&
    (selectedToken !== "custom" || isAddress(customTokenAddress)) &&
    sourceBridgeContract &&
    destinationBridgeContract

  // Add a client-side only rendering state to prevent hydration mismatches
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  return (
    <div className="space-y-6">
      {/* Wallet Info */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Connected Wallet</p>
              <p className="font-mono text-sm">{address}</p>
              <p className="text-xs text-gray-500 mt-1">Network: {currentNetwork?.name || "Unknown"}</p>
            </div>
            <Button variant="outline" onClick={() => disconnect()}>
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Network Warning - only render on client side */}
      {isClient && sourceChain && chainId !== Number.parseInt(sourceChain) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">Wrong Network</p>
                <p className="text-sm text-orange-600">Please switch to {sourceNetwork?.name} to bridge tokens</p>
              </div>
              <Button onClick={switchToSourceChain} size="sm">
                Switch to {sourceNetwork?.name}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bridge Form */}
      {isClient && <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-indigo-600" />
            Cross-Chain Token Bridge
          </CardTitle>
          <CardDescription>Bridge tokens between different networks using LayerZero technology</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Source Chain Selection */}
          <div className="space-y-2">
            <Label>Source Network</Label>
            <Select value={sourceChain} onValueChange={setSourceChain}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NETWORKS.filter((n) => n.isSource).map((network) => (
                  <SelectItem key={network.chainId} value={network.chainId.toString()}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{network.symbol}</Badge>
                      {network.name}
                      <Badge variant="outline" className="text-xs">
                        LZ: {network.lzChainId}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bridge Direction Indicator */}
          <div className="flex items-center justify-center gap-4 py-2">
            <Badge variant="outline" className="px-4 py-2">
              {sourceNetwork?.name || "Source"}
            </Badge>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <Badge variant="outline" className="px-4 py-2">
              {destinationNetwork?.name || "Destination"}
            </Badge>
          </div>

          {/* Destination Chain Selection */}
          <div className="space-y-2">
            <Label>Destination Network</Label>
            <Select value={destinationChain} onValueChange={setDestinationChain}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NETWORKS.filter((n) => n.isDestination && n.chainId !== Number.parseInt(sourceChain)).map(
                  (network) => (
                    <SelectItem key={network.chainId} value={network.chainId.toString()}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{network.symbol}</Badge>
                        {network.name}
                        <Badge variant="outline" className="text-xs">
                          LZ: {network.lzChainId}
                        </Badge>
                      </div>
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Bridge Contract Status */}
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Source Bridge Contract:</span>
              <span className="font-mono text-xs">
                {sourceBridgeContract
                  ? `${sourceBridgeContract.slice(0, 6)}...${sourceBridgeContract.slice(-4)}`
                  : "Not Available"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Destination Bridge Contract:</span>
              <span className="font-mono text-xs">
                {destinationBridgeContract
                  ? `${destinationBridgeContract.slice(0, 6)}...${destinationBridgeContract.slice(-4)}`
                  : "Not Available"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Trusted Remote Set:</span>
              <div className="flex items-center gap-2">
                <Badge variant={isTrustedRemoteSet ? "default" : "destructive"} className="text-xs">
                  {isTrustedRemoteSet ? "✓ Configured" : "✗ Not Set"}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleRefreshConfig}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Configuration Warning */}
          {(!sourceBridgeContract || !destinationBridgeContract) && (
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Bridge Contracts Missing</span>
              </div>
              <p className="text-xs text-red-600">
                {!sourceBridgeContract && `No bridge contract deployed on ${sourceNetwork?.name}. `}
                {!destinationBridgeContract && `No bridge contract deployed on ${destinationNetwork?.name}.`}
              </p>
            </div>
          )}

          {/* Trusted Remote Setup */}
          {sourceBridgeContract && destinationBridgeContract && !isTrustedRemoteSet && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Configuration Required</span>
              </div>
              <p className="text-xs text-yellow-600 mb-3">
                The bridge contract needs to be configured with the trusted remote address for{" "}
                {destinationNetwork?.name} (Chain ID: {destinationNetwork?.lzChainId}).
              </p>
              <Button
                onClick={handleSetupTrustedRemote}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700"
                disabled={isPending}
              >
                Setup Trusted Remote
              </Button>
            </div>
          )}

          {/* Token Selection */}
          <div className="space-y-2">
            <Label>Select Token</Label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a token" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_TOKENS.map((token) => (
                  <SelectItem key={token.address} value={token.address}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{token.symbol}</Badge>
                      {token.name}
                      {bridgeTokenAddress && token.address.toLowerCase() === bridgeTokenAddress.toLowerCase() && (
                        <Badge variant="default" className="text-xs">
                          Bridge Token
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Token</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Token Address */}
          {selectedToken === "custom" && (
            <div className="space-y-2">
              <Label>Custom Token Address</Label>
              <Input
                placeholder="0x..."
                value={customTokenAddress}
                onChange={(e) => setCustomTokenAddress(e.target.value)}
              />
            </div>
          )}

          {/* Token Info Display */}
          {isValidToken && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Token Symbol:</span>
                <span className="font-mono">{tokenSymbol || "Loading..."}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Decimals:</span>
                <span className="font-mono">{tokenDecimals}</span>
              </div>
              {balance && (
                <div className="flex justify-between text-sm">
                  <span>Balance:</span>
                  <span className="font-mono">
                    {formatUnits(balance, tokenDecimals)} {tokenSymbol}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          {/* Bridge Fee */}
          <div className="space-y-2">
            <Label>Bridge Fee ({sourceNetwork?.symbol})</Label>
            <Input
              type="number"
              step="0.001"
              value={bridgeFee}
              onChange={(e) => setBridgeFee(e.target.value)}
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              LayerZero cross-chain messaging fee {estimatedFees ? "(estimated)" : "(manual)"}
            </p>
          </div>

          {/* Approval Button */}
          {needsApproval && isValidToken && (
            <Button onClick={handleApprove} disabled={isApproving} className="w-full bg-yellow-600 hover:bg-yellow-700">
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                `Approve ${tokenSymbol || "Token"}`
              )}
            </Button>
          )}

          {/* Bridge Button */}
          <Button
            onClick={handleBridge}
            disabled={!canBridge}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Transaction...
              </>
            ) : isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : !sourceBridgeContract || !destinationBridgeContract ? (
              "Bridge Contracts Not Available"
            ) : !isTrustedRemoteSet ? (
              "Configure Bridge First"
            ) : needsApproval && isValidToken ? (
              "Approve Token First"
            ) : (
              <>
                Bridge {tokenSymbol || "Tokens"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {/* Transaction Status */}
          {hash && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                {isSuccess ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                )}
                <div className="flex-1">
                  <p className="font-medium">
                    {isSuccess ? "Bridge Transaction Successful!" : "Transaction Submitted"}
                  </p>
                  <p className="text-sm text-gray-600 font-mono break-all">{hash}</p>
                </div>
              </div>

              {/* Explorer Links */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getExplorerUrl(hash, Number.parseInt(sourceChain)), "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View on {sourceNetwork?.name}
                </Button>
                {isSuccess && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(getExplorerUrl(hash, Number.parseInt(destinationChain)), "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Check {destinationNetwork?.name}
                  </Button>
                )}
              </div>

              {/* Verification Instructions */}
              {isSuccess && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-2">Next Steps:</p>
                  <ol className="text-xs text-green-700 space-y-1">
                    <li>1. ✅ Source transaction successful - tokens locked on {sourceNetwork?.name}</li>
                    <li>2. ⏳ Wait 10-20 minutes for LayerZero to process the message</li>
                    <li>3. 🔍 Use LayerZero Tracker below to monitor cross-chain message</li>
                    <li>4. 🎯 Check destination token balance using Bridge Verification</li>
                    <li>
                      5. 🚨 If no destination transaction appears, the destination contract may need configuration
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Transaction Failed</p>
                  <p className="text-sm text-red-600">{error.message}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>}

      {/* LayerZero Message Tracker - only render on client side */}
      {isClient && isSuccess && hash && (
        <LayerZeroTracker
          sourceHash={hash}
          sourceChainId={Number.parseInt(sourceChain)}
          destinationChainId={Number.parseInt(destinationChain)}
        />
      )}
    </div>
  )
}
