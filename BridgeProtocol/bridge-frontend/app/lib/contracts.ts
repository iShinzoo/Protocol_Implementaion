export const BRIDGE_CONTRACTS = {
  // Sepolia contracts
  11155111: {
    bridge: "0x197F0AD8CFE97d3AF58F12F33d4B510CB0fe10B7",
    token: "0x5Ce4A478C6c5c84d8b4f38432e1a8106478C6", // TBT token
  },
  // BNB Testnet contracts
  97: {
    bridge: "0x1328B73F4Ecfc83a440A858A422Dee02a5d88A09",
    token: "0x1328B73F4Ecfc83a440A858A422Dee02a5d88A09", // Placeholder - needs actual bridged token
  },
  // Add more networks as needed
} as const

// Network configurations with CORRECT LayerZero chain IDs
export const NETWORKS = [
  {
    chainId: 11155111,
    name: "Sepolia Testnet",
    symbol: "ETH",
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/6XQcBMl2mEp46Yh3_ncrSbNcHwJ2lG9j",
    explorer: "https://sepolia.etherscan.io",
    lzChainId: 10161, // Sepolia LayerZero ID
    isSource: true, // Can be used as source
    isDestination: true, // Can be used as destination
  },
  {
    chainId: 97,
    name: "BNB Smart Chain Testnet",
    symbol: "tBNB",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    explorer: "https://testnet.bscscan.com",
    lzChainId: 10102, // CORRECT BNB testnet LayerZero ID
    isSource: true,
    isDestination: true,
  },
  {
    chainId: 80001,
    name: "Polygon Mumbai",
    symbol: "MATIC",
    rpcUrl: "https://rpc-mumbai.maticvigil.com",
    explorer: "https://mumbai.polygonscan.com",
    lzChainId: 10109, // Polygon Mumbai LayerZero ID
    isSource: true,
    isDestination: true,
  },
  {
    chainId: 43113,
    name: "Avalanche Fuji",
    symbol: "AVAX",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    explorer: "https://testnet.snowtrace.io",
    lzChainId: 10106, // Avalanche Fuji LayerZero ID
    isSource: true,
    isDestination: true,
  },
  {
    chainId: 421613,
    name: "Arbitrum Goerli",
    symbol: "ETH",
    rpcUrl: "https://goerli-rollup.arbitrum.io/rpc",
    explorer: "https://goerli.arbiscan.io",
    lzChainId: 10143, // Arbitrum Goerli LayerZero ID
    isSource: true,
    isDestination: true,
  },
  {
    chainId: 420,
    name: "Optimism Goerli",
    symbol: "ETH",
    rpcUrl: "https://goerli.optimism.io",
    explorer: "https://goerli-optimism.etherscan.io",
    lzChainId: 10132, // Optimism Goerli LayerZero ID
    isSource: true,
    isDestination: true,
  },
  {
    chainId: 5,
    name: "Ethereum Goerli",
    symbol: "ETH",
    rpcUrl: "https://goerli.infura.io/v3/",
    explorer: "https://goerli.etherscan.io",
    lzChainId: 10121, // Goerli LayerZero ID
    isSource: true,
    isDestination: true,
  },
  {
    chainId: 84531,
    name: "Base Goerli",
    symbol: "ETH",
    rpcUrl: "https://goerli.base.org",
    explorer: "https://goerli.basescan.org",
    lzChainId: 10160, // Base Goerli LayerZero ID
    isSource: true,
    isDestination: true,
  },
] as const

// LayerZero Endpoint addresses for each network
export const LAYERZERO_ENDPOINTS = {
  11155111: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1", // Sepolia
  97: "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1", // BNB Testnet
  80001: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8", // Polygon Mumbai
  43113: "0x93f54D755A063cE7bB9e6Ac47Eccc8e33411d706", // Avalanche Fuji
  421613: "0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab", // Arbitrum Goerli
  420: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1", // Optimism Goerli
} as const

// LayerZero Endpoint ABI
export const LAYERZERO_ENDPOINT_ABI = [
  {
    inputs: [
      { internalType: "uint16", name: "_srcChainId", type: "uint16" },
      { internalType: "bytes", name: "_srcAddress", type: "bytes" },
      { internalType: "uint64", name: "_nonce", type: "uint64" },
      { internalType: "bytes", name: "_payload", type: "bytes" },
    ],
    name: "forceResumeReceive",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "_srcChainId", type: "uint16" },
      { internalType: "bytes", name: "_srcAddress", type: "bytes" },
    ],
    name: "hasStoredPayload",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "_srcChainId", type: "uint16" },
      { internalType: "bytes", name: "_srcAddress", type: "bytes" },
    ],
    name: "getStoredPayload",
    outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Simple receiver contract ABI for emergency deployment
export const SIMPLE_RECEIVER_ABI = [
  {
    inputs: [
      { internalType: "uint16", name: "_srcChainId", type: "uint16" },
      { internalType: "bytes", name: "_srcAddress", type: "bytes" },
      { internalType: "uint64", name: "_nonce", type: "uint64" },
      { internalType: "bytes", name: "_payload", type: "bytes" },
    ],
    name: "lzReceive",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

// Preset tokens available for bridging
export const PRESET_TOKENS = [
  {
    symbol: "TBT",
    name: "Test Bridge Token",
    address: "0x5Ce4A478C6c5c84d8b4f38432e1a8106478C6",
    decimals: 18,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    decimals: 6,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    decimals: 6,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
    decimals: 18,
  },
  {
    symbol: "WETH",
    name: "Wrapped Ethereum",
    address: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    decimals: 18,
  },
] as const

export const BRIDGE_SOURCE_ABI = [
  {
    inputs: [
      {
        internalType: "uint16",
        name: "dstChainId",
        type: "uint16",
      },
      {
        internalType: "bytes",
        name: "destinationAddress",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "bridgeTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint16",
        name: "_remoteChainId",
        type: "uint16",
      },
      {
        internalType: "bytes",
        name: "_path",
        type: "bytes",
      },
    ],
    name: "setTrustedRemote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16",
      },
    ],
    name: "trustedRemoteLookup",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint16",
        name: "dstChainId",
        type: "uint16",
      },
      {
        internalType: "bytes",
        name: "destinationAddress",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "estimateFees",
    outputs: [
      {
        internalType: "uint256",
        name: "nativeFee",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "zroFee",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "dstChainId",
        type: "uint16",
      },
    ],
    name: "BridgeInitiated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint16",
        name: "_remoteChainId",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "_path",
        type: "bytes",
      },
    ],
    name: "SetTrustedRemote",
    type: "event",
  },
] as const

export const BRIDGE_DESTINATION_ABI = [
  {
    inputs: [
      {
        internalType: "uint16",
        name: "_srcChainId",
        type: "uint16",
      },
      {
        internalType: "bytes",
        name: "_srcAddress",
        type: "bytes",
      },
      {
        internalType: "uint64",
        name: "_nonce",
        type: "uint64",
      },
      {
        internalType: "bytes",
        name: "_payload",
        type: "bytes",
      },
    ],
    name: "lzReceive",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "BridgeReceived",
    type: "event",
  },
] as const

export const ERC20_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

// Legacy exports for backward compatibility
export const BRIDGE_SOURCE_ADDRESS = BRIDGE_CONTRACTS[11155111].bridge
export const BRIDGE_DESTINATION_ADDRESS = BRIDGE_CONTRACTS[97].bridge
