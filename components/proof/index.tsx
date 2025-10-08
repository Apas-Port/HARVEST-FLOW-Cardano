"use client";

import React, { useEffect, useState } from "react";

import ProjectYourNFTSection from "@/components/proof/ProjectYourNFTSection";
import ProjectEarnSection from "@/components/proof/ProjectEarnSection";
import ProjectRWASection from "@/components/proof/ProjectRWASection";
import ProjectNavigation, { ProjectNavigationLink } from "@/components/proof/ProjectNavigation";
import DesktopVideoBackground from "@/components/common/DesktopVideoBackground";
import MobileVideoBackground from "@/components/common/MobileVideoBackground";
import CommonHeader from "@/components/common/CommonHeader";
import { useRouter, useSearchParams } from "next/navigation";
import { NftMetadata, RwaAsset } from "@/lib/types";
import { Project, getProjectById, getProjectData } from "@/lib/project";
import AssetOverviewSection from "@/components/proof/AssetOverviewSection";
import { useRWADetail } from "@/hooks/useRWADetail";

// Import ClaimData interface from ProjectEarnSection
interface ClaimData {
  claimableAmount?: number;
  claimablePrinciple?: number;
  totalEquityAmount: number;
  totalHarvestedAmount: number;
  isLoading: boolean;
}

interface ProofPageProps {
  lng: string;
}

const ProofPage: React.FC<ProofPageProps> = ({ lng }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('projectId') || null;
  const tokenId = searchParams?.get('tokenId') || searchParams?.get('assetId') || null; // Support both tokenId and assetId params
  const accessToken = searchParams?.get('access_token') || null;

  // State data
  const [metadata, setMetadata] = useState<NftMetadata | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<RwaAsset | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [selectedNftClaimableAmount, setSelectedNftClaimableAmount] = useState<number | undefined>(150.75);
  const [isOwner, setIsOwner] = useState<boolean>(true);
  const [notRwaFounded, setNotRwaFounded] = useState(false);
  
  // Mock translation function
  const t = (key: string) => key;

  // Redirect if no parameters provided
  useEffect(() => {
    if (!accessToken && (!projectId || !tokenId)) {
      router.push(`/en`);
    }
  }, [accessToken, projectId, tokenId, router]);

  // Generate metadata from RWA asset data
  useEffect(() => {
    if (!selectedAsset || !selectedProject) return;

    setMetadata({
      name: selectedAsset.name || `${selectedProject.title} NFT #${tokenId}`,
      description: selectedAsset.description || selectedProject.description,
      image: selectedAsset.image || selectedProject.previewImage,
      attributes: [
        { trait_type: "Asset ID", value: String(selectedAsset.assetId) },
        { trait_type: "Device ID", value: String(selectedAsset.deviceId) },
        { trait_type: "Status", value: selectedAsset.status },
        { trait_type: "Model", value: selectedAsset.carModel },
        { trait_type: "Network", value: selectedProject.network },
        { trait_type: "APR", value: selectedAsset.apr || `${selectedProject.apy}%` },
        { trait_type: "Total Payments", value: String(selectedAsset.totalNumberOfPayments) },
        { trait_type: "Payments Made", value: String(selectedAsset.numberOfPaymentsMade) }
      ],
      animation_url: "",
      external_url: ""
    });
  }, [selectedAsset, selectedProject, tokenId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Load projects data
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await getProjectData();
        console.log('Loaded projects:', projectsData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjects();
  }, []);

  // Fetch RWA asset from spreadsheet using API
  const { data: rwaAssets, isLoading: loadingAsset } = useRWADetail(
    tokenId ? parseInt(tokenId) : undefined
  );

  // Set mock project
  useEffect(() => {
    console.log('Looking for project:', projectId, 'in projects:', projects);
    if(projects && projects.length > 0 && projectId){
      const foundProject = projects.find((p) => p.id === projectId);
      console.log('Found project:', foundProject);
      setSelectedProject(foundProject);
    }
  }, [projects, projectId]);

  // Set asset from API response
  useEffect(() => {
    if (rwaAssets && rwaAssets.length > 0) {
      const asset = rwaAssets[0];
      // Enhance asset with project data if available
      if (selectedProject) {
        asset.assetId = Number(selectedProject.assetId?.at(tokenId ? Number(tokenId) % 3 : 0));
        asset.name = asset.name || `${selectedProject.title} Unit #${asset.assetId}`;
        asset.description = asset.description || selectedProject.description;
        asset.image = asset.image || selectedProject.previewImage;
        asset.assetImage = asset.assetImage || selectedProject.tuktukImage;
        asset.apr = asset.apr || `${selectedProject.apy}%`;
      }
      setSelectedAsset(asset);
      setNotRwaFounded(false);
    } else if (!loadingAsset && tokenId) {
      setNotRwaFounded(true);
    } else if (accessToken) {
      // For access token, fetch asset by token
      fetch(`/api/fetch-rwa?resource=assetByToken&accessToken=${accessToken}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setSelectedAsset(data);
            setNotRwaFounded(false);
          } else {
            setNotRwaFounded(true);
          }
        })
        .catch(() => setNotRwaFounded(true));
    }
  }, [rwaAssets, loadingAsset, selectedProject, tokenId, accessToken]);

  // Mock claim data
  const claimData: ClaimData = {
    claimableAmount: selectedNftClaimableAmount || 150.75,
    claimablePrinciple: 100.0,
    totalEquityAmount: selectedProject ? selectedProject.unitPrice : 100.0, // Use project's unitPrice if available
    totalHarvestedAmount: 350.25,
    isLoading: false
  };

  const handleGoToProjectPage = () => {
    router.push(`/en/?projectId=${selectedProject?.id}`);
  };

  // Mock harvest modal functions
  const isHarvestModalOpen = false;
  const isHarvestSuccessfulModalOpen = false;
  const isProgress = false;
  const openHarvestModal = () => console.log("Opening harvest modal");
  const closeHarvestModal = () => console.log("Closing harvest modal");
  const closeHarvestSuccessfulModal = () => console.log("Closing success modal");
  
  const handleHarvest = async () => {
    console.log("Harvesting...");
  };

  // Don't show anything if no parameters provided
  if (!accessToken && (!projectId || !tokenId)) {
    return null;
  }

  return (
    <>
      <CommonHeader lng={lng} />
      <div className="w-full max-w-[1320px] mx-auto relative z-10 px-4 xl:px-0">
        <div className="flex gap-32 pt-[110px] xl:pt-[216px] pb-[150px] xl:pb-[250px]">
          <div className="flex-1 shrink-0 relative hidden xl:block">
            <div className="sticky top-32">
              <ProjectNavigation isAccessToken={accessToken !== null}/>
            </div>
          </div>
          <div className="w-full max-w-[926px] *:flex *:flex-col *:gap-24">
            <div>
              {accessToken === null && (
                <>
                  <div className="gsap-section-trigger" id={ProjectNavigationLink.YourNFT}>
                    <ProjectYourNFTSection
                      isAccessToken={accessToken !== null}
                      asset={selectedAsset}
                      project={selectedProject} />
                  </div>
                </>
              )}
              {(loadingProjects || (selectedProject == null && selectedAsset == null)) ? (
                <p>Loading...</p>
              ) : (<>
                <div className="gsap-section-trigger" id={ProjectNavigationLink.AssetOverview}>
                  <AssetOverviewSection notRwaFounded={notRwaFounded} project={selectedProject} asset={selectedAsset} />
                </div>
                <div className="gsap-section-trigger" id={ProjectNavigationLink.RWA}>
                  <ProjectRWASection notRwaFounded={notRwaFounded} asset={selectedAsset} />
                </div>
              </>)}
              <div className="px-4 xl:px-0">
                <button
                  className="bg-secondary text-white flex items-center justify-center border border-black w-full text-bodyLarge xl:text-heading4_28_44 font-medium uppercase tracking-widest p-8 xl:p-10"
                  onClick={handleGoToProjectPage}
                >
                  GO TO PROJECT PAGE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modals are removed as they depend on wagmi/ethereum */}
      <DesktopVideoBackground />
      <MobileVideoBackground />
    </>
  );
};

export default ProofPage;