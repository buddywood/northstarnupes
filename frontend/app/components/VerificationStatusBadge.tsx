'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerificationStatusBadgeProps {
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW' | undefined;
  className?: string;
}

export default function VerificationStatusBadge({ 
  status, 
  className = '' 
}: VerificationStatusBadgeProps) {

  if (!status) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'VERIFIED':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
          label: 'Verified',
          tooltip: 'Your membership has been verified.',
        };
      case 'PENDING':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-300',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          ),
          label: 'Pending',
          tooltip: 'Your membership verification is in progress. This typically takes 24-48 hours. Please ensure your profile information is complete and accurate.',
        };
      case 'FAILED':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
          label: 'Failed',
          tooltip: 'Verification was unsuccessful. Please review your profile information, ensure your membership number and chapter details are correct, and contact support if you believe this is an error.',
        };
      case 'MANUAL_REVIEW':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-300',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          ),
          label: 'Under Review',
          tooltip: 'Your membership is under manual review. Our team will contact you if additional information is needed.',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const needsTooltip = status === 'PENDING' || status === 'FAILED' || status === 'MANUAL_REVIEW';

  const badgeContent = (
    <div className={`inline-flex items-center gap-1.5 ${config.bg} ${config.text} ${config.border} border px-2.5 py-1 rounded-full text-xs font-semibold ${needsTooltip ? 'cursor-help' : 'cursor-default'}`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );

  if (needsTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center ${className}`}>
              {badgeContent}
            </div>
          </TooltipTrigger>
          <TooltipContent className="w-64 bg-[#1E2A38] text-white border-none p-3">
            <p className="mb-2 font-semibold">{config.label} Verification</p>
            <p className="text-white/90 leading-relaxed">{config.tooltip}</p>
            {status === 'FAILED' && (
              <p className="mt-2 text-xs text-white/70">
                Need help? Contact support through your chapter or email support@1kappa.com
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {badgeContent}
    </div>
  );
}

