interface WizardStepItem {
  step: number;
  label: string;
}

interface WizardStepsProps {
  steps: WizardStepItem[];
  currentStep: number;
}

export function WizardSteps({ steps, currentStep }: WizardStepsProps) {
  return (
    <ol className="flex border border-gray-300 bg-gray-50">
      {steps.map((item) => {
        const isActive = item.step === currentStep;
        const isComplete = item.step < currentStep;

        return (
          <li
            key={item.step}
            className={`flex flex-1 items-center gap-3 border-r border-gray-300 px-5 py-4 last:border-r-0 ${
              isActive ? 'bg-white' : ''
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center border text-xs font-semibold ${
                isActive
                  ? 'border-gray-800 bg-gray-800 text-white'
                  : isComplete
                    ? 'border-gray-400 bg-gray-200 text-gray-700'
                    : 'border-gray-300 bg-white text-gray-500'
              }`}
            >
              {item.step}
            </span>
            <span
              className={`text-sm ${
                isActive ? 'font-medium text-gray-900' : 'text-gray-600'
              }`}
            >
              {item.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
