import React, { useRef, useState, useEffect } from 'react';
import { Project } from '@/lib/project';
import { createPopper } from "@popperjs/core";
import Image from 'next/image';
import CommonButton from '@/components/common/CommonButton';
import CommonTooltip from '@/components/common/CommonTooltip';
import { useTranslation } from '@/i18n/client';
import PurchaseModalMobile from './PurchaseModalMobile';
import { useWallet } from '@meshsdk/react';
import { getNetworkImage } from '@/lib/network';
import { useRouter } from 'next/navigation';

interface PurchaseModalProps {
  lng: string;
  project: Project;
  quantity: number;
  setQuantity: (quantity: number) => void;
  onClose: () => void;
  onLendSupport: (project: Project, quantity: number) => Promise<void>;
}

const PROGRESS_GRADIENT = 'linear-gradient(133deg, #95CAFF 0%, #83A6FF 99%)';

const PurchaseModal: React.FC<PurchaseModalProps> = ({ lng, project, quantity, setQuantity, onClose, onLendSupport }) => {
  const { t } = useTranslation(lng, 'common');
  const { connected, name: walletName } = useWallet();
  const router = useRouter();
  
  const [popoverShow, setPopoverShow] = React.useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [lendingPeriodPopoverShow, setLendingPeriodPopoverShow] = useState(false);
  const lendingPeriodBtnRef = useRef<HTMLButtonElement>(null);
  const lendingPeriodPopoverRef = useRef<HTMLDivElement>(null);
  const [boostTooltipShow, setBoostTooltipShow] = useState(false);
  const boostBtnRef = useRef<HTMLImageElement>(null);
  const boostTooltipRef = useRef<HTMLDivElement>(null);
  const handleQuantityChange = (amount: number) => {
    setQuantity(Math.max(1, quantity + amount));
  };
  
  const openTooltip = () => {
    if (btnRef.current && popoverRef.current) {
      createPopper(btnRef.current, popoverRef.current, {
        placement: "top"
      });
      setPopoverShow(true);
    }
  };
  const closeTooltip = () => {
    setPopoverShow(false);
  };

  const openLendingPeriodTooltip = () => {
    if (lendingPeriodBtnRef.current && lendingPeriodPopoverRef.current) {
      createPopper(lendingPeriodBtnRef.current, lendingPeriodPopoverRef.current, {
        placement: "top"
      });
      setLendingPeriodPopoverShow(true);
    }
  };
  const closeLendingPeriodTooltip = () => {
    setLendingPeriodPopoverShow(false);
  };

  const openBoostTooltip = () => {
    if (boostBtnRef.current && boostTooltipRef.current) {
      createPopper(boostBtnRef.current, boostTooltipRef.current, { placement: "top" });
      setBoostTooltipShow(true);
    }
  };
  const closeBoostTooltip = () => setBoostTooltipShow(false);

  // Handle NFT minting for Cardano projects
  const handlePurchase = async () => {
    if (project.network === 'Cardano') {
      if (!connected) {
        alert('Please connect your Cardano wallet first');
        return;
      }

      onClose();  // Close PurchaseModal
      await onLendSupport(project, quantity);
    } else {
      await onLendSupport(project, quantity);
    }
  };


  // Create shared props for mobile component
  const mobileProps = {
    lng,
    project,
    quantity,
    onClose,
    onLendSupport,
    handleQuantityChange,
    popoverShow,
    popoverRef,
    btnRef,
    lendingPeriodPopoverShow,
    lendingPeriodPopoverRef,
    lendingPeriodBtnRef,
    boostTooltipShow,
    boostTooltipRef,
    boostBtnRef,
    openTooltip,
    closeTooltip,
    openLendingPeriodTooltip,
    closeLendingPeriodTooltip,
    openBoostTooltip,
    closeBoostTooltip,
    t
  };

  return (
    <>
      {/* Mobile Component */}
      <div className="block md:hidden">
        <PurchaseModalMobile {...mobileProps} />
      </div>

      {/* Desktop Modal */}
      <div className="hidden md:flex fixed inset-0 bg-black/50 z-50 animate-fade items-center justify-center" onClick={onClose}>
        <div className="relative bg-white rounded-t-lg p-2 max-w-[900px] w-full flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-row flex-1 min-h-0">
          {(project.title === "Plume Tuktuks 01" || project.title === "Plume Tuktuks 02") && (
            <div className="absolute right-4 top-4 z-10" style={{ display: 'inline-block' }}>
              <Image
                ref={boostBtnRef}
                src="/images/common/plume-boost.svg"
                alt="Plume Boost"
                aria-label="Plume Boost"
                width={140}
                height={33}
                draggable={false}
                priority
                tabIndex={0}
                className="animate-glow-pulse w-[140px] h-auto"
                onMouseEnter={openBoostTooltip}
                onMouseLeave={closeBoostTooltip}
                onFocus={openBoostTooltip}
                onBlur={closeBoostTooltip}
              />
              <CommonTooltip
                show={boostTooltipShow}
                tooltipRef={boostTooltipRef}
                className="min-w-[240px] p-3 rounded text-white text-sm text-left shadow-[2px_2px_6px_0px_rgba(40,41,56,0.15)] whitespace-normal break-words bg-gradient-to-r from-[#26C393] via-[#00D594] to-[#26C393]"
                role="tooltip"
              >
{t('modals.purchase.tooltips.plumeBoost')}
              </CommonTooltip>
            </div>
          )}
          <div className="w-1/2 pr-4">
            <div className='bg-[#325AB4] rounded-lg py-4 px-8 mb-2'>
              <Image width={422} height={500} src={project.previewImage} alt={project.title} className="mb-4 w-full h-auto" />
            </div>
            <div className='bg-[#F5F5F5] text-[#161718] p-4'>
              <CommonTooltip
                show={popoverShow}
                tooltipRef={popoverRef}
                className="min-w-[240px] max-w-[300px] p-3 rounded text-white text-sm text-left shadow-[2px_2px_6px_0px_rgba(40,41,56,0.15)] whitespace-normal break-words"
              >
                {t('modals.purchase.tooltips.proofOfSupport')}
              </CommonTooltip>
              <div className='flex justify-between'>
                <h3 className="text-lg font-normal mb-1">
                  {lng === 'ja' ? (
                    <>
                      {t('modals.purchase.supportAndReceive')} <span className="font-medium">{project.title} NFT</span>を{t('modals.purchase.supportAndReceiveEnd')}
                    </>
                  ) : (
                    <>
                      {t('modals.purchase.supportAndReceive')} <span className="font-medium">{project.title} NFT</span>
                    </>
                  )}
                </h3>
                <button
                  ref={btnRef}
                  type="button"
                  onMouseEnter={openTooltip}
                  onMouseLeave={closeTooltip}
                  className="p-0 m-0 bg-transparent border-none"
                >
                  <Image
                    width={20}
                    height={20}
                    src={'/images/common/popup-icon.png'}
                    alt="popup"
                    className="pb-2 w-5 h-auto"
                  />
                </button>
              </div>
              <p className="text-s">
                {lng === 'ja' ? (
                  <>
                    <span>このNFTは{project.id === "6efc1caf706a48b5b4b0402a7d367291" ? "Izumida Lee": "Momoka Ito"}</span>{t('modals.purchase.featuresArtwork')}{t('modals.purchase.symbolOfContribution')}
                  </>
                ) : (
                  <>
                    {t('modals.purchase.featuresArtwork')} <span>{project.id === "6efc1caf706a48b5b4b0402a7d367291" ? "Izumida Lee": "Momoka Ito"}</span>. {t('modals.purchase.symbolOfContribution')}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="w-1/2 pl-4 pr-4 pt-4 flex flex-col">
            <div className="flex-1 overflow-y-auto">
            {/* Desktop content */}
            <h2 className="text-base font-['Function_Pro',sans-serif]">No.{String(project.num).padStart(3,'0')}</h2>
            <h2 className="text-3xl font-medium font-['Function_Pro',sans-serif] mb-0">{project.title}</h2>

            <div className="flex flex-row items-center mb-4 gap-0">
              <span className="text-gray-700 mr-4 mt-1 font-['Function_Pro',sans-serif] text-base">
                <Image
                  src={getNetworkImage(project.network)}
                  alt={project.lendingType} width={20} height={20} className="inline mr-1 mb-1 w-5 h-auto" />
                {project.lendingType} Lending
              </span>
              <span className="text-gray-700 mr-4 mt-1 font-['Function_Pro',sans-serif] text-base">
                <Image
                  src={getNetworkImage(project.network)}
                  alt={project.network} width={20} height={20} className="inline mr-1 mb-1 w-5 h-auto" />
                {project.network} Network
              </span>
            </div>

            <div className="flex justify-between mb-2 text-base">
              <div className="font-['Function_Pro',sans-serif]">{t('modals.purchase.raisedToDate')}</div>
              {project.status === "sold_out" ? (
                <div className="font-['Roboto_Mono',monospace]">{Math.ceil(Number(project.totalAmount)).toLocaleString()}/{Math.ceil(Number(project.totalAmount)).toLocaleString()} {project.lendingType}</div>
              ) : (project.title === "Plume Tuktuks 01" || project.title === "Plume Tuktuks 02") ? (
                <div className="font-['Roboto_Mono',monospace]">{Number(project.raisedAmount).toLocaleString()} {project.lendingType}</div>
              ) : (
                <div className="font-['Roboto_Mono',monospace]">{Math.min(project.raisedAmount, Math.ceil(project.capacity * project.unitPrice)).toLocaleString()} / {Math.ceil(project.capacity * project.unitPrice).toLocaleString()} {project.lendingType}</div>
              )}
            </div>

            {/* 進捗バー（マイルストーンベース） */}
            <div className="w-full bg-[#A9BEEF]/30 rounded-full h-2 mb-4 relative">
              {(() => {
                const currentAmount = project.raisedAmount || 0;
                let progressWidth = "0%";
                let maxValue = project.capacity * project.unitPrice; // デフォルトの最大値
                
                // マイルストーンが設定されている場合は最後のマイルストーンを最大値とする
                if (project.milestones && project.milestones.length > 0) {
                  maxValue = project.milestones[project.milestones.length - 1];
                }
                
                if (project.status === "sold_out") {
                  progressWidth = "100%";
                } else {
                  const progressPercentage = Math.min((currentAmount / maxValue) * 100, 100);
                  progressWidth = `${progressPercentage}%`;
                }
                
                return (
                  <>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: progressWidth,
                        background: PROGRESS_GRADIENT
                      }}
                      aria-label="progress bar"
                      role="progressbar"
                    ></div>
                    
                    {/* マイルストーンドット */}
                    {project.milestones && project.milestones.map((milestone, index) => {
                      const position = (milestone / maxValue) * 100;
                      const isReached = currentAmount >= milestone;
                      
                      return (
                        <div
                          key={index}
                          className={`absolute top-[-5px] w-4 h-4 rounded-full border-2 ${
                            isReached 
                              ? 'bg-secondary border-white' 
                              : 'bg-white border-gray-400'
                          }`}
                          style={{
                            left: `${Math.min(position, 98)}%`,
                            transform: 'translateX(-50%)'
                          }}
                          title={`Milestone: ${milestone.toLocaleString()} ${project.lendingType}`}
                        />
                      );
                    })}
                  </>
                );
              })()}
            </div>

            {/* Milestone Progress Text */}
            {project.status !== "sold_out" && 
             project.milestones && 
             project.unitSupportTarget && 
             (() => {
               const currentAmount = project.raisedAmount || 0;
               const nextMilestone = project.milestones.find((m: number) => m > currentAmount);
               
               if (nextMilestone) {
                 const remaining = nextMilestone - currentAmount;
                 const estimatedSupport = Math.floor(nextMilestone / project.unitSupportTarget.unitCost);
                 const milestoneIndex = project.milestones.indexOf(nextMilestone);
                 const getMilestoneLabel = (index: number) => {
                   if (index === 0) return t('modals.purchase.milestoneLabels.first');
                   if (index === 1) return t('modals.purchase.milestoneLabels.second'); 
                   if (index === 2) return t('modals.purchase.milestoneLabels.third');
                   return t('modals.purchase.milestoneLabels.ordinal', { number: index + 1 });
                 };
                 
                 const milestoneLabel = getMilestoneLabel(milestoneIndex);
                 
                 return (
                   <div className="mb-6 mr-4">
                     <p className="text-[#1D1E1F80] text-left leading-none text-base">
                       {lng === 'ja' ? (
                         <>
                           {t('modals.purchase.milestoneProgress.prefix')} {milestoneLabel} {t('modals.purchase.milestoneProgress.middle')} <span className="font-medium text-secondary">{remaining.toLocaleString()} {project.lendingType}</span> {t('modals.purchase.milestoneProgress.suffix')} <span className="font-medium text-secondary">{estimatedSupport} {project.unitSupportTarget.label}</span>{t('modals.purchase.milestoneProgress.end')}
                         </>
                       ) : (
                         <>
                           {t('modals.purchase.milestoneProgress.prefix')} <span className="font-medium text-secondary">{remaining.toLocaleString()} {project.lendingType}</span> {t('modals.purchase.milestoneProgress.middle')} {milestoneLabel} {t('modals.purchase.milestoneProgress.suffix')} <span className="font-medium text-secondary">{estimatedSupport} {project.unitSupportTarget.label}</span>{t('modals.purchase.milestoneProgress.end')}
                         </>
                       )}
                     </p>
                   </div>
                 );
               }
               return null;
             })()
            }

            {project.status === "sold_out" && (
              <div
                className="px-4 py-6 text-center rounded-lg mb-4 text-[#04304D] font-['Roboto_Mono',monospace] text-[14px] bg-gradient-to-br from-[rgba(233,241,255,0.4)] to-[rgba(186,206,233,0.4)]"
              >
                {t('modals.purchase.thankYouInterest')}<br/>
                {t('modals.purchase.projectReachedGoal')}
              </div>
            )}
            {project.status === "sold_out" ? (
              <>
                <div className="p-4 rounded-lg mb-4 bg-[#F5F5F5]">
                  <div className="flex items-center justify-between">
                    <div className='basis-1/3'>
                      <h3 className="text-base text-[#1D1E1F80] font-['Function_Pro',sans-serif]">{t('modals.purchase.support')}</h3>
                      <span className="text-xl font-bold font-['Roboto_Mono',monospace]">{Math.ceil(project.unitPrice * quantity)} {project.lendingType}</span>
                      <p className="text-sm text-gray-600 font-['Roboto_Mono',monospace]">(${Math.ceil(project.unitPrice * quantity)})</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="pl-4 pr-2 rounded-lg mb-6 bg-[#F5F5F5]">
                  <div className="flex items-center justify-between gap-2">
                    <div className='basis-1/2 py-2'>
                      <h3 className="text-base text-[#1D1E1F80] font-function-pro">{t('modals.purchase.support')}</h3>
                      <span className="text-xl font-bold font-mono">{project.unitPrice * quantity} {project.lendingType}</span>
                      <p className="text-sm text-gray-600 font-mono">(${project.unitPrice * quantity})</p>
                    </div>
                    <div className="basis-1/2 flex py-1 px-2 items-center justify-between border-gray-300 rounded-lg bg-white">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          className="font-['Function_Pro',sans-serif] px-4 py-3 text-black bg-[#F5F5F5] text-[24px] w-14 h-14 font-bold hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          aria-label={t('modals.purchase.quantityDecrease')}
                          disabled={quantity <= 1}
                        >
                          ー
                        </button>
                        <input
                          type="text"
                          value={quantity}
                          readOnly
                          className="w-14 text-center border-none focus:ring-0 text-gray-900 font-medium text-xl bg-transparent"
                          aria-label="Quantity"
                        />
                        <button
                          onClick={() => handleQuantityChange(1)}
                          className="font-['Function_Pro',sans-serif] rounded-lg text-black font-medium text-lg bg-gradient-to-b from-[#F9D78C] to-[#E7B45A] hover:opacity-80 transition-opacity duration-200 py-2 px-3 m-1 w-14 h-14 text-[32px] font-bold cursor-pointer"
                          aria-label={t('modals.purchase.quantityIncrease')}
                        >
                          ＋
                        </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Financial returns and Social Impact */}
            <div className="mb-4">
              <h3 className="font-['Function_Pro',sans-serif] text-base mb-2">{t('modals.purchase.financialReturns')}</h3>
              <div className='pr-2 text-sm text-[#1D1E1F80]'>
                <div className="flex justify-between py-1 border-b border-[#BFC9D480]">
                  <span className="font-['Roboto_Mono',monospace]">{t('modals.purchase.interestEarned')}</span>
                  <span className="font-bold text-black font-['Roboto_Mono',monospace]">
                    ${(
                      Math.ceil(
                        quantity * project.unitPrice * project.apy * (project.lendingPeriod / 12)
                      ) / 100
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#BFC9D480]">
                  <span className="font-['Roboto_Mono',monospace]">{t('modals.purchase.interestRate')}</span>
                  <span className="text-black font-medium font-['Roboto_Mono',monospace]">
                    {project.apy}% APY
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#BFC9D480]">
                  <span className="font-['Roboto_Mono',monospace]">{t('modals.purchase.repaymentMethod')}</span>
                  <span className="text-black font-medium font-['Roboto_Mono',monospace]">
                    {project.repaymentMethod}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-['Function_Pro',sans-serif] text-base mb-2">{t('modals.purchase.socialImpact')}</h3>
              <div className='pr-2 pb-2 text-sm text-[#1D1E1F80]'>
                <div className="flex justify-between py-1 border-b border-[#BFC9D480]">
                  <span className="flex items-center gap-2 font-['Roboto_Mono',monospace] relative">
                    {t('modals.purchase.lendingPeriod')}
                    <button
                      ref={lendingPeriodBtnRef}
                      type="button"
                      onMouseEnter={openLendingPeriodTooltip}
                      onMouseLeave={closeLendingPeriodTooltip}
                      className="p-0 m-0 bg-transparent border-none"
                      tabIndex={0}
                      aria-label="Lending Period Info"
                    >
                      <Image
                        width={20}
                        height={20}
                        src={'/images/common/popup-icon.png'}
                        alt="popup"
                        className="pb-1 w-5 h-auto"
                      />
                    </button>
                    <CommonTooltip
                      show={lendingPeriodPopoverShow}
                      tooltipRef={lendingPeriodPopoverRef}
                      className="font-['Function_Pro',sans-serif] min-w-[250px]"
                    >
                      {t('modals.purchase.tooltips.lendingPeriod')}
                    </CommonTooltip>
                  </span>
                  <span className="text-black font-medium font-['Roboto_Mono',monospace]">
                    {project.lendingPeriod} {t('modals.purchase.months')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#BFC9D480]">
                  <span className="font-['Roboto_Mono',monospace]">{t('modals.purchase.startDate')}</span>
                  <span className="text-black font-medium font-['Roboto_Mono',monospace]">
                    {project.startDate}
                  </span>
                </div>
              </div>
            </div>
            </div>


            {/* Desktop Bottom Buttons */}
            {project.status !== "sold_out" && (
              <div className="flex justify-end gap-2 ml-[-16px] mr-[-16px] font-medium">
                <button
                  onClick={onClose}
                  className="flex w-[145px] py-8 px-6 justify-center items-start gap-2 shrink-0 bg-[#F5F5F5] uppercase font-medium cursor-pointer"
                >
                  {t('modals.purchase.cancel')}
                </button>
                <CommonButton
                  className="flex flex-1 py-8 px-6 justify-center items-start gap-2 !rounded-none uppercase cursor-pointer"
                  onClick={handlePurchase}
                >
                  {t('modals.purchase.buyNow')}
                </CommonButton>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PurchaseModal;
