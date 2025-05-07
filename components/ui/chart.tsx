'use client';

import React from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
  children: React.ReactNode;
  aspect?: number;
  minHeight?: number;
}

/**
 * A container component that fixes the common issues with Recharts ResponsiveContainer
 * by ensuring stable dimensions and preventing the "max depth exceeded" error
 */
export function ChartContainer({ 
  children, 
  aspect = 2, 
  minHeight = 300 
}: ChartContainerProps) {
  const [mounted, setMounted] = React.useState(false);

  // Use useEffect to prevent hydration mismatch with ResponsiveContainer
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    // Return a placeholder with the same dimensions during SSR/first render
    return (
      <div 
        style={{ 
          width: '100%', 
          height: aspect ? 0 : minHeight,
          paddingBottom: aspect ? `${(1 / aspect) * 100}%` : undefined,
          position: 'relative',
          backgroundColor: 'rgba(0, 0, 0, 0.02)'
        }}
      />
    );
  }

  return (
    <div 
      style={{ 
        width: '100%',
        height: aspect ? 0 : minHeight, 
        paddingBottom: aspect ? `${(1 / aspect) * 100}%` : undefined,
        position: 'relative'
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0
        }}
      >
        <ResponsiveContainer width="99%" height="99%">
          {/* Cast children to ReactElement to satisfy TypeScript */}
          {React.isValidElement(children) ? children : <div>Invalid chart content</div>}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const Chart = () => {
  return null
}

export const ChartTooltip = () => {
  return null
}

export const ChartTooltipContent = () => {
  return null
}
