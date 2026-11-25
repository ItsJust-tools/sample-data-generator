import type { ExportFormat } from '@itsjust/core';

export const toolConfig = {
  id: 'sample-data-generator',
  name: 'Sample Data Generator',
  description:
    'Generate realistic sample data (names, emails, addresses, IPs, UUIDs, JSON records) for testing and mockups.',
  version: '1.0.0',
  exportFormats: ['json', 'png', 'jpeg', 'webp', 'pdf'] satisfies ExportFormat[],
  features: {
    export: true,
    autoSave: true,
    undoRedo: true,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
  theme: {
    accent: '#7c3aed',
    accentHover: '#6d28d9',
    accentSubtle: '#f5f3ff',
    brand: 'Sample Data Generator',
  },
};

export default toolConfig;
