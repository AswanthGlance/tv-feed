import React from 'react';

export default function TVStage({
  children,
}: {
  screen: string;
  slideBack: boolean;
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
