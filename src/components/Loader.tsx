import { cn } from '@/lib/utils';

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Loader({ className, ...props }: LoaderProps) {
  return (
    <div 
      className={cn("animate-spin rounded-full border-2 border-neutral-800 border-t-[#F14A00]", className)} 
      {...props}
    />
  );
}
