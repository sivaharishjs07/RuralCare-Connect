import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RuralCare Connect',
    short_name: 'RuralCare',
    description: 'Healthcare coordination for rural and underserved communities.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0f766e',
    orientation: 'portrait-primary',
  };
}