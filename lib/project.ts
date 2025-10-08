import { fetchMintedCount } from "./fetch-minted-count";
import { Network } from "./network";
import { getNetworkConfig } from "./network-config";

export interface Project {
  id: string;
  status: string;
  num: number;
  title: string;
  subTitle: string;
  description: string;

  contractAddress: `0x${string}`;

  apy: number;
  capacity: number;  // 総販売個数
  unitPrice: number; // 販売価格
  raisedAmount: number; // 現在調達金額
  totalAmount: number; // 目標調達金額
  collectionName?: string;
  maxMints?: number;
  paramUtxoEnvKey?: string;
  mintPriceLovelace?: number;

  mainImage: string;
  previewImage: string;
  tuktukImage: string;

  interestEarned: string;
  interestRate: number;
  repaymentMethod: string;
  lendingPeriod: number;
  startDate: string;

  mintedAmount: number;
  listing: boolean;

  // Additional fields from JSON
  lendingType: string;
  network: Network;
  policyId?: string;
  assetId?: string[];

  // Milestone progress tracking
  milestones?: number[];
  unitSupportTarget?: {
    label: string;
    unitCost: number;
  };
}

let cachedProjects: Project[] | null = null;

export const matchNFTContractAddressWithProjects = async (contractAddress: string): Promise<Project | null> => {
  if (!cachedProjects) {
    cachedProjects = await getProjectData();
  }
  
  const project = cachedProjects.find(
    p => p.contractAddress && p.contractAddress.toLowerCase() === contractAddress.toLowerCase()
  );
  
  return project || null;
};

export const matchNFTPolicyIdWithProjects = async (policyId: string): Promise<Project | null> => {
  if (!cachedProjects) {
    cachedProjects = await getProjectData();
  }
  
  const project = cachedProjects.find(
    p => p.policyId && p.policyId.toLowerCase() === policyId.toLowerCase()
  );
  
  return project || null;
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
  if (!cachedProjects) {
    cachedProjects = await getProjectData();
  }
  
  const project = cachedProjects.find(
    p => p.id && p.id.toLowerCase() === projectId.toLowerCase()
  );
  
  return project || null;
};

export const getProjectData = async (): Promise<Project[]> => {
  try {
    const isServer = typeof window === 'undefined';

    // Use network config to determine environment
    const { isMainnet, network } = getNetworkConfig();

    // Force mainnet on Vercel deployment
    const isVercelProduction = process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';
    const shouldUseMainnet = isVercelProduction || isMainnet;

    // Local (dev/preprod) uses dev-projects.json
    // Production (mainnet) uses projects.json
    const projectsFile = shouldUseMainnet ? "projects.json" : "dev-projects.json";

    const baseUrl = isServer
      ? process.env.NEXT_PUBLIC_BASE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
        || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
        || 'http://localhost:3000'
      : '';

    if (!baseUrl && isServer) {
      throw new Error('Base URL not configured for server-side project data fetch');
    }

    const response = await fetch(`${baseUrl}/data/${projectsFile}`);

    if (!response.ok) {
      console.error('Failed to fetch projects data:', response.status, response.statusText);
      throw new Error(`Failed to fetch projects data: ${response.status}`);
    }
    
    const projects = await response.json() as Project[];

    // Enhanced projects with static data
    const enhancedProjects = await Promise.all(
      projects.map(async (p) => {
        // Get minted count from both new and legacy policy IDs
        let mintedCount = 0;
        
        // Check new policy ID
        if (p.policyId) {
          try {
            const newPolicyCount = await fetchMintedCount(p.policyId);
            mintedCount += newPolicyCount;
            if (newPolicyCount > 0) {
              console.log(`Found ${newPolicyCount} NFTs with new policy ${p.policyId}`);
            }
          } catch (error) {
            console.error(`Failed to fetch minted count for new policy ${p.policyId}:`, error);
          }
        }
        
        const enhanced = { 
          ...p,
          mintedAmount: mintedCount,
          totalAmount: p.capacity * p.unitPrice,
         raisedAmount: mintedCount * p.unitPrice,
          collectionName: p.collectionName ?? p.title,
          maxMints: p.maxMints,
          paramUtxoEnvKey: p.paramUtxoEnvKey,
          mintPriceLovelace: p.mintPriceLovelace,
        };
        
        return enhanced;
      })
    );
    
    return enhancedProjects;
  } catch (error) {
    console.error('Error loading items data:', error);
    return [];
  }
};
