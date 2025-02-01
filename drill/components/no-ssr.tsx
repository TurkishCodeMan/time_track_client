'use client';

import dynamic from 'next/dynamic';
import { PropsWithChildren } from 'react';

const NoSSR = ({ children }: PropsWithChildren) => <>{children}</>;

export default dynamic(() => Promise.resolve(NoSSR), {
  ssr: false,
}); 