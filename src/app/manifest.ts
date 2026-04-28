import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gridly',
    short_name: 'Gridly',
    description: 'Controla ingresos, gastos y ahorro con balances mensuales claros.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#533afd',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
