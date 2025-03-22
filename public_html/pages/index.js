// pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Rediriger vers la version statique
    router.push('/index.html');
  }, []);
  
  return null;
}