
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ExploreRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center p-4">
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">Redirecting to the main Explore page...</p>
    </div>
  );
}
