// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import type { Project, ProjectSetting } from '@medplum/fhirtypes';

export type ProjectSettingsSource = Pick<Project, 'setting'> | ProjectSetting[] | undefined;
export type CountryPackAvailability = 'active' | 'placeholder';
export type CountryPackRegion = 'east-africa' | 'comesa';
export type KenyaServiceEnvironment = 'uat' | 'production';
export type KenyaHieEnvironment = KenyaServiceEnvironment;
export type KenyaShaClaimsEnvironment = KenyaServiceEnvironment;
export type KenyaHieCredentialMode = 'tenant-managed' | 'afiax-managed';
export type KenyaShaClaimsCredentialMode = 'tenant-managed' | 'afiax-managed';
export type KenyaAfyaLinkEnvironment = KenyaHieEnvironment;
export type KenyaAfyaLinkCredentialMode = KenyaHieCredentialMode;

export interface CountryPackCatalogEntry {
  readonly id: string;
  readonly title: string;
  readonly countryCode: string;
  readonly availability: CountryPackAvailability;
  readonly regions: readonly CountryPackRegion[];
}

const countryPackCatalog: readonly CountryPackCatalogEntry[] = [
  {
    id: 'kenya',
    title: 'Kenya',
    countryCode: 'KE',
    availability: 'active',
    regions: ['east-africa', 'comesa'],
  },
  {
    id: 'burundi',
    title: 'Burundi',
    countryCode: 'BI',
    availability: 'placeholder',
    regions: ['east-africa', 'comesa'],
  },
  {
    id: 'comoros',
    title: 'Comoros',
    countryCode: 'KM',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'democratic-republic-of-the-congo',
    title: 'Democratic Republic of the Congo',
    countryCode: 'CD',
    availability: 'placeholder',
    regions: ['east-africa', 'comesa'],
  },
  {
    id: 'djibouti',
    title: 'Djibouti',
    countryCode: 'DJ',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'egypt',
    title: 'Egypt',
    countryCode: 'EG',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'eritrea',
    title: 'Eritrea',
    countryCode: 'ER',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'eswatini',
    title: 'Eswatini',
    countryCode: 'SZ',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'ethiopia',
    title: 'Ethiopia',
    countryCode: 'ET',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'libya',
    title: 'Libya',
    countryCode: 'LY',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'madagascar',
    title: 'Madagascar',
    countryCode: 'MG',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'malawi',
    title: 'Malawi',
    countryCode: 'MW',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'mauritius',
    title: 'Mauritius',
    countryCode: 'MU',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'rwanda',
    title: 'Rwanda',
    countryCode: 'RW',
    availability: 'placeholder',
    regions: ['east-africa', 'comesa'],
  },
  {
    id: 'seychelles',
    title: 'Seychelles',
    countryCode: 'SC',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'somalia',
    title: 'Somalia',
    countryCode: 'SO',
    availability: 'placeholder',
    regions: ['east-africa', 'comesa'],
  },
  {
    id: 'south-sudan',
    title: 'South Sudan',
    countryCode: 'SS',
    availability: 'placeholder',
    regions: ['east-africa'],
  },
  {
    id: 'sudan',
    title: 'Sudan',
    countryCode: 'SD',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'tanzania',
    title: 'Tanzania',
    countryCode: 'TZ',
    availability: 'placeholder',
    regions: ['east-africa'],
  },
  {
    id: 'tunisia',
    title: 'Tunisia',
    countryCode: 'TN',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'uganda',
    title: 'Uganda',
    countryCode: 'UG',
    availability: 'placeholder',
    regions: ['east-africa', 'comesa'],
  },
  {
    id: 'zambia',
    title: 'Zambia',
    countryCode: 'ZM',
    availability: 'placeholder',
    regions: ['comesa'],
  },
  {
    id: 'zimbabwe',
    title: 'Zimbabwe',
    countryCode: 'ZW',
    availability: 'placeholder',
    regions: ['comesa'],
  },
];

export const KenyaProjectSettingNames = {
  hieEnvironment: 'kenyaHieEnvironment',
  hieCredentialMode: 'kenyaHieCredentialMode',
  hieAgentId: 'kenyaHieAgentId',
  shaClaimsEnvironment: 'kenyaShaClaimsEnvironment',
  shaClaimsCredentialMode: 'kenyaShaClaimsCredentialMode',
  afyaLinkEnvironment: 'kenyaAfyaLinkEnvironment',
  afyaLinkCredentialMode: 'kenyaAfyaLinkCredentialMode',
} as const;

export const KenyaShaClaimsSecretNames = {
  accessKey: 'kenyaShaClaimsAccessKey',
  secretKey: 'kenyaShaClaimsSecretKey',
  callbackUrl: 'kenyaShaClaimsCallbackUrl',
  baseUrl: 'kenyaShaClaimsBaseUrl',
} as const;

function getProjectSettings(source: ProjectSettingsSource): ProjectSetting[] | undefined {
  return Array.isArray(source) ? source : source?.setting;
}

export function getProjectSetting(source: ProjectSettingsSource, name: string): ProjectSetting | undefined {
  return getProjectSettings(source)?.find((entry) => entry.name === name);
}

export function getProjectSettingBoolean(source: ProjectSettingsSource, name: string): boolean | undefined {
  return getProjectSetting(source, name)?.valueBoolean;
}

export function getProjectSettingString(source: ProjectSettingsSource, name: string): string | undefined {
  return getProjectSetting(source, name)?.valueString;
}

export function getCountryPackCatalog(): readonly CountryPackCatalogEntry[] {
  return countryPackCatalog;
}

export function getCountryPackCatalogEntry(id: string | undefined): CountryPackCatalogEntry | undefined {
  return id ? countryPackCatalog.find((entry) => entry.id === id) : undefined;
}

export function formatCountryPackLabel(entry: CountryPackCatalogEntry): string {
  return entry.availability === 'active' ? entry.title : `${entry.title} (Placeholder)`;
}

export function getKenyaHieEnvironment(source: ProjectSettingsSource): KenyaHieEnvironment {
  const value =
    getProjectSettingString(source, KenyaProjectSettingNames.hieEnvironment) ??
    getProjectSettingString(source, KenyaProjectSettingNames.afyaLinkEnvironment);
  return value === 'production'
    ? 'production'
    : 'uat';
}

export function getKenyaHieCredentialMode(source: ProjectSettingsSource): KenyaHieCredentialMode {
  const value =
    getProjectSettingString(source, KenyaProjectSettingNames.hieCredentialMode) ??
    getProjectSettingString(source, KenyaProjectSettingNames.afyaLinkCredentialMode);
  return value === 'afiax-managed'
    ? 'afiax-managed'
    : 'tenant-managed';
}

export function getKenyaHieAgentId(source: ProjectSettingsSource): string | undefined {
  return getProjectSettingString(source, KenyaProjectSettingNames.hieAgentId)?.trim() || undefined;
}

export function getKenyaShaClaimsEnvironment(source: ProjectSettingsSource): KenyaShaClaimsEnvironment {
  const value =
    getProjectSettingString(source, KenyaProjectSettingNames.shaClaimsEnvironment) ??
    getProjectSettingString(source, KenyaProjectSettingNames.hieEnvironment) ??
    getProjectSettingString(source, KenyaProjectSettingNames.afyaLinkEnvironment);
  return value === 'production'
    ? 'production'
    : 'uat';
}

export function getKenyaShaClaimsCredentialMode(source: ProjectSettingsSource): KenyaShaClaimsCredentialMode {
  const value = getProjectSettingString(source, KenyaProjectSettingNames.shaClaimsCredentialMode);
  if (value === 'afiax-managed') {
    return 'afiax-managed';
  }
  if (value === 'tenant-managed') {
    return 'tenant-managed';
  }
  return getKenyaHieCredentialMode(source);
}

export function getKenyaAfyaLinkEnvironment(source: ProjectSettingsSource): KenyaAfyaLinkEnvironment {
  return getKenyaHieEnvironment(source);
}

export function getKenyaAfyaLinkCredentialMode(source: ProjectSettingsSource): KenyaAfyaLinkCredentialMode {
  return getKenyaHieCredentialMode(source);
}
