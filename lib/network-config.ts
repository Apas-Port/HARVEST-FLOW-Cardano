// Central network configuration helper
export function getNetworkConfig() {
  const isVercel = process.env.VERCEL === '1';
  const network = process.env.CARDANO_NETWORK || (isVercel ? 'mainnet' : 'preprod');
  const isMainnet = network === 'mainnet';

  return {
    network,
    isMainnet,
    isTestnet: !isMainnet,
    blockfrostApiKey: isMainnet
      ? (process.env.BLOCKFROST_MAIN_API_KEY || process.env.BLOCKFROST_MAIN_PROJECT_ID || '')
      : (process.env.BLOCKFROST_API_KEY || process.env.BLOCKFROST_PROJECT_ID || ''),
    treasuryAddress: isMainnet
      ? (process.env.NEXT_PUBLIC_PROJECT_TREASURY_ADDRESS || 'addr1q887g4a5jsg57ul36vnnn99aqddgkesawvgzjlshsxyhpxjngs2np8tlavv9w6xnz58snl0czq3ywsapt9dkqxpx738sgp968m')
      : (process.env.NEXT_PUBLIC_PROJECT_TREASURY_ADDRESS || 'addr_test1qr87g4a5jsg57ul36vnnn99aqddgkesawvgzjlshsxyhpxjngs2np8tlavv9w6xnz58snl0czq3ywsapt9dkqxpx738sthc6ty'),
    policyId: process.env.HARVESTFLOW_POLICY_ID || '5b1a3dc00d40b402a72f72b9a5f0c1197e9ddc50a7366a68d719e653',
    explorerUrl: isMainnet
      ? 'https://cardanoscan.io'
      : 'https://preprod.cexplorer.io',
    blockfrostUrl: isMainnet
      ? 'https://cardano-mainnet.blockfrost.io/api/v0'
      : 'https://cardano-preprod.blockfrost.io/api/v0',
    koiosUrl: isMainnet
      ? 'https://api.koios.rest/api/v0'
      : 'https://preprod.koios.rest/api/v0'
  };
}

export function getNetworkName(): 'Mainnet' | 'Preprod' {
  const { isMainnet } = getNetworkConfig();
  return isMainnet ? 'Mainnet' : 'Preprod';
}
