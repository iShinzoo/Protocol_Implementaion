"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BracketsIcon as Bridge, Settings, AlertTriangle } from "lucide-react"
import { useAccount } from "wagmi"
import BridgeForm from "./components/BridgeForm"
import WalletConnection from "./components/WalletConnection"
import BridgeVerification from "./components/BridgeVerification"
import TokenBridgeInstructions from "./components/TokenBridgeInstructions"
import ContractChecker from "./components/ContractChecker"

export default function Home() {
  const { address, isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bridge className="h-8 w-8 text-indigo-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Bridge Order Protocol
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Seamlessly bridge your ERC20 tokens between multiple testnets using LayerZero technology
          </p>
        </div>

        {/* Important Notice */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">Bridge Setup Required for Full Functionality</p>
                  <p className="text-sm text-red-600">
                    Currently, only the source side is working. For tokens to appear on destination chains, you need to:
                    <br />• Deploy bridge contracts on destination chains
                    <br />• Deploy bridged token contracts with BRIDGE_ROLE granted
                    <br />• Configure trusted remotes on both sides
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network Status */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <Badge variant="outline" className="px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Multi-Source Support
          </Badge>
          <ArrowRight className="h-5 w-5 text-gray-400 mt-1" />
          <Badge variant="outline" className="px-4 py-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
            Multiple Destinations
          </Badge>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto space-y-8">
          {!isConnected ? <WalletConnection /> : <BridgeForm />}

          {/* Bridge Instructions */}
          {isConnected && <TokenBridgeInstructions />}

          {/* Verification Section */}
          {isConnected && <BridgeVerification userAddress={address} />}
          {isConnected && <ContractChecker />}
        </div>

        {/* Contract Info */}
        <div className="mt-12 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Available Bridge Contracts & Networks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-indigo-600 mb-2">Sepolia Testnet</h3>
                  <p className="text-sm text-gray-600 font-mono break-all">
                    Bridge: 0x197F0AD8CFE97d3AF58F12F33d4B510CB0fe10B7
                  </p>
                  <p className="text-sm text-gray-600 font-mono break-all">
                    Token: 0x5Ce4A478C6c5c84d8b4f38432e1a8106478C6
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-600 mb-2">BNB Testnet</h3>
                  <p className="text-sm text-gray-600 font-mono break-all">
                    Bridge: 0x1328B73F4Ecfc83a440A858A422Dee02a5d88A09
                  </p>
                  <p className="text-sm text-red-600 text-xs">⚠️ Destination setup required</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Supported Networks</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Badge variant="outline">Sepolia (10161) ✅</Badge>
                  <Badge variant="outline">BNB Testnet (10102) ⚠️</Badge>
                  <Badge variant="outline">Polygon Mumbai (10109) ⚠️</Badge>
                  <Badge variant="outline">Avalanche Fuji (10106) ⚠️</Badge>
                  <Badge variant="outline">Arbitrum Goerli (10143) ⚠️</Badge>
                  <Badge variant="outline">Optimism Goerli (10132) ⚠️</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-2">✅ = Fully configured | ⚠️ = Needs destination setup</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
