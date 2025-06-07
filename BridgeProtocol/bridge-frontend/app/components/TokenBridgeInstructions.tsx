"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon, AlertTriangle, CheckCircle } from "lucide-react"

export default function TokenBridgeInstructions() {
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <InfoIcon className="h-5 w-5 text-blue-600" />
          Important Bridge Setup Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Before bridging tokens:</strong> Make sure your bridge contracts are properly configured with the
            correct token addresses and trusted remote settings.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">Bridge Setup Requirements:</h4>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Source Contract:</strong> Must have the correct token address set (your TBT token:
                0x5Ce4A...478C6)
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Trusted Remote:</strong> Source contract must have destination contract set as trusted remote
                for LayerZero
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Destination Contract:</strong> Must have bridge role granted to mint tokens on destination chain
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Token Approval:</strong> You must approve the bridge contract to spend your tokens
              </div>
            </div>
          </div>
        </div>

        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            If tokens aren't appearing on the destination chain, check that:
            <br />• The bridge contracts are properly linked via LayerZero
            <br />• The destination token contract has minting permissions for the bridge
            <br />• You're checking the correct token contract address on the destination chain
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
