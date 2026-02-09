import { MetadataRoute } from 'next';
import { PWAConfig } from '@/lib/ux/pwaConfig';

export default function manifest(): MetadataRoute.Manifest {
    return PWAConfig.manifest as MetadataRoute.Manifest;
}
