'use client';

export default function ProgressBar({ 
  currentStep, 
  totalSteps, 
  className = "",
  barColor = "rose-400",
  bgColor = "gray-200",
  showPercentage = true,
  showStepText = true
}) {
  const progress = Math.round((currentStep / totalSteps) * 100);
  

  const clampedProgress = Math.min(progress, 100);

  return (
    <div className={`mb-6 ${className}`}>
    
      {(showStepText || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {showStepText && (
            <span className="text-sm text-gray-600">
              단계 {currentStep} / {totalSteps}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-600">
              {clampedProgress}%
            </span>
          )}
        </div>
      )}
      

      <div className={`w-full bg-${bgColor} rounded-full h-2`}>
        <div 
          className={`bg-${barColor} h-2 rounded-full transition-all duration-300 ease-in-out`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`진행률: ${clampedProgress}%, ${currentStep}단계 중 ${totalSteps}단계`}
        />
      </div>
    </div>
  );
}