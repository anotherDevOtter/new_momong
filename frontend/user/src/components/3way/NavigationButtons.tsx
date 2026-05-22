import { Button } from '@/components/ui/Button';

interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  backLabel?: string;
  showBack?: boolean;
  showNext?: boolean;
}

export function NavigationButtons({
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = '다음',
  backLabel = '이전',
  showBack = true,
  showNext = true,
}: NavigationButtonsProps) {
  return (
    <div className="flex gap-4 pt-8">
      {showBack && onBack && (
        <Button onClick={onBack} variant="secondary" fullWidth>
          {backLabel}
        </Button>
      )}
      {showNext && onNext && (
        <Button onClick={onNext} variant="primary" fullWidth disabled={nextDisabled}>
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
