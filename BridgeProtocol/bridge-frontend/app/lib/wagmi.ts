import { http, createConfig } from "wagmi"
import { sepolia, bscTestnet, polygonMumbai, avalancheFuji, arbitrumGoerli, optimismGoerli } from "wagmi/chains"
import { injected, metaMask } from "wagmi/connectors"

export const config = createConfig({
  chains: [sepolia, bscTestnet, polygonMumbai, avalancheFuji, arbitrumGoerli, optimismGoerli],
  connectors: [injected(), metaMask()],
  transports: {
    [sepolia.id]: http("https://eth-sepolia.g.alchemy.com/v2/6XQcBMl2mEp46Yh3_ncrSbNcHwJ2lG9j"),
    [bscTestnet.id]: http("https://data-seed-prebsc-1-s1.binance.org:8545"),
    [polygonMumbai.id]: http("https://rpc-mumbai.maticvigil.com"),
    [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
    [arbitrumGoerli.id]: http("https://goerli-rollup.arbitrum.io/rpc"),
    [optimismGoerli.id]: http("https://goerli.optimism.io"),
  },
})

declare module "wagmi" {
  interface Register {
    config: typeof config
  }
}
