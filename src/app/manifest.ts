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
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
