import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  id?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Service Stream Disrupted',
  message = 'Failed to fetch sensor telemetry or connect to the edge ingestion service.',
  onRetry,
  className,
  id,
}) => {
  return (
    <div
      id={id}
      className={cn(
        'p-6 bg-rose-950/20 border border-rose-800/60 rounded-lg flex flex-col items-center justify-center text-center space-y-3',
        className
      )}
    >
      <div className="p-3 rounded-full bg-rose-950/70 border border-rose-700/60 text-rose-400">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-rose-200">{title}</h4>
        <p className="text-xs text-rose-300/80 max-w-md mt-1">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="border-rose-700/60 hover:bg-rose-950/50"
        >
          Retry Connection
        </Button>
      )}
    </div>
  );
};
