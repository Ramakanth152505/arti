import { CUSTOM_CLASS_VALUE, OTHER_PLATFORM_VALUE, type PlatformMode } from './projectStore';

/** Form state for the shared software-classification form. */
export interface SoftwareClassifyState {
  name: string;
  core: string;
  coreCustom: string;
  domains: string[];
  domainCustom: string;
  platforms: string[];
  platformMode: PlatformMode;
  customPlatform: string;
  description: string;
  requirements: string;
  stack: string;
}

export const initialClassifyState: SoftwareClassifyState = {
  name: '',
  core: '',
  coreCustom: '',
  domains: [],
  domainCustom: '',
  platforms: [],
  platformMode: 'single',
  customPlatform: '',
  description: '',
  requirements: '',
  stack: '',
};

/** Shared client-side validation. Returns an error message or ''. */
export function validateClassifyState(s: SoftwareClassifyState): string {
  if (!s.name.trim()) return 'Enter a software name.';
  if (!s.core) return 'Select a core functional classification.';
  if (s.core === CUSTOM_CLASS_VALUE && !s.coreCustom.trim()) {
    return 'Describe your custom core classification.';
  }
  if (s.domains.includes(CUSTOM_CLASS_VALUE) && !s.domainCustom.trim()) {
    return 'Describe your custom domain.';
  }
  if (s.platformMode === 'single' && s.platforms.length === 0) {
    return 'Select at least one target platform.';
  }
  if (s.platforms.includes(OTHER_PLATFORM_VALUE) && !s.customPlatform.trim()) {
    return 'Describe your custom target platform.';
  }
  return '';
}
