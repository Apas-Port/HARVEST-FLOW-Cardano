'use client';

import { useState, useEffect } from "react";
import Image from 'next/image';
import { Project } from "@/lib/project";

// Mock function to get coin image
const getCoinImage = (coin: string) => {
  const coinImages: { [key: string]: string } = {
    'USDC': '/images/coins/usdc.png',
    'USDT': '/images/coins/usdt.png',
    'DAI': '/images/coins/dai.png',
    'pUSD': '/images/coins/pusd.png'
  };
  return coinImages[coin] || '/images/coins/default.png';
};

interface AccountDashboardSectionProps {
  lng: string;
  address: string;
  projects: Project[];
  totalEquityAmount: number;
  aprAmount: number;
  totalLendingAmount: number;
  totalHarvestedAmount: number;
  claimablePrincipleString: string;
  totalClaimableAmount: number;
  claimableAmounts: Map<string, number>;
  state: string;
  isUsdcChecked: boolean;
  isUsdtChecked: boolean;
  isDaiChecked: boolean;
  isPusdChecked: boolean;
  setIsUsdcChecked: (checked: boolean) => void;
  setIsUsdtChecked: (checked: boolean) => void;
  setIsDaiChecked: (checked: boolean) => void;
  setIsPusdChecked: (checked: boolean) => void;
  handleHarvest: () => void;
}

const AccountDashboardSection: React.FC<AccountDashboardSectionProps> = ({ 
  lng, 
  totalEquityAmount,
  aprAmount,
  totalLendingAmount,
  totalHarvestedAmount,
  totalClaimableAmount,
  claimableAmounts,
  state,
  isUsdcChecked,
  isUsdtChecked,
  isDaiChecked,
  isPusdChecked,
  setIsUsdcChecked,
  setIsUsdtChecked,
  setIsDaiChecked,
  setIsPusdChecked,
  handleHarvest
}) => {
  // Mock translation function
  const t = (key: string) => key;

  const [harvestbtnTxt, setHarvestbtnTxt] = useState<string | null>(null);

  useEffect(() => {
    if (state === "a") {
      setHarvestbtnTxt("Transaction...");
    } else if (state === "b") {
      setHarvestbtnTxt("Confirmation...");
    } else if (state === "c") {
      setHarvestbtnTxt("Completed!");
    } else {
      setHarvestbtnTxt("Harvest");
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-[30px]">
      <h2 className="text-heading5Larger xl:text-heading3_30_30 text-center uppercase font-medium tracking-[0.35rem]">Dashboard</h2>

      <div className="flex flex-col xl:flex-row gap-[30px] xl:gap-[17px] px-4 xl:px-0">
        <div className="bg-white border-black border flex-1">
          <div className="flex flex-col xl:flex-row border-black xl:border-b xl:h-[50%]">
            <div className="w-full xl:w-[50%] grid grid-cols-1 grid-rows-1 xl:grid-cols-1 xl:grid-rows-1 border-b border-black xl:border-b-0">
              <div className="flex items-center justify-center text-sm tracking-wide uppercase border-dashed xl:border-b border-black xl:max-h-[3em] border-r xl:border-r-0">TOTAL EQUITY(USD)</div>
              <div className="flex items-center justify-center mt-6 mb-10 text-[1.5em] xl:text-[2em] uppercase xl:h-[50%] py-3 xl:py-0 font-medium">$ {totalEquityAmount.toFixed(2)}</div>
            </div>
            <div className="w-full xl:w-[50%] grid grid-cols-1 grid-rows-1 xl:grid-cols-1 xl:grid-rows-1 xl:border-l border-b border-black  xl:border-b-0">
              <div className="flex items-center justify-center text-sm tracking-wide uppercase border-dashed xl:border-b border-black xl:max-h-[3em] border-r xl:border-r-0">Your APR</div>
              <div className="flex items-center justify-center mt-6 mb-10 text-[1.5em] xl:text-[2em] uppercase xl:h-[50%] py-3 xl:py-0 font-medium">{aprAmount.toFixed(1)}%</div>
            </div>
          </div>
          <div className="flex flex-col xl:flex-row xl:h-[50%]">
            <div className="w-full xl:w-[50%] grid grid-cols-2 grid-rows-1 xl:grid-cols-1 xl:grid-rows-2 border-b border-black xl:border-b-0">
              <div className="flex items-center justify-center text-sm tracking-wide uppercase border-dashed xl:border-b border-black xl:max-h-[3em] border-r xl:border-r-0">Lending Now</div>
              <div className="flex items-center justify-center mt-2 mb-10 text-[1.5em] xl:text-[2em] uppercase xl:h-[50%] py-3 xl:py-0 font-medium">$ {Math.round(totalLendingAmount).toLocaleString()}</div>
            </div>
            <div className="w-full xl:w-[50%] grid grid-cols-2 grid-rows-1 xl:grid-cols-1 xl:grid-rows-2 xl:border-l border-black">
              <div className="flex items-center justify-center text-sm tracking-wide uppercase border-dashed xl:border-b border-black xl:max-h-[3em] border-r xl:border-r-0">TOTAL INTEREST</div>
              <div className="flex items-center justify-center mt-2 mb-10 text-[1.5em] xl:text-[2em] uppercase xl:h-[50%] py-3 xl:py-0 font-medium">$ 0</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AccountDashboardSection;
