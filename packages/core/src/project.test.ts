// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import type { Project } from '@medplum/fhirtypes';
import {
  formatCountryPackLabel,
  getCountryPackCatalog,
  getCountryPackCatalogEntry,
  getKenyaAfyaLinkCredentialMode,
  getKenyaAfyaLinkEnvironment,
  getProjectSetting,
  getProjectSettingBoolean,
  getProjectSettingString,
  KenyaProjectSettingNames,
} from './project';

describe('project settings helpers', () => {
  const project: Project = {
    resourceType: 'Project',
    setting: [
      { name: 'countryPack', valueString: 'kenya' },
      { name: KenyaProjectSettingNames.afyaLinkEnvironment, valueString: 'production' },
      { name: KenyaProjectSettingNames.afyaLinkCredentialMode, valueString: 'afiax-managed' },
      { name: 'preCommitSubscriptionsEnabled', valueBoolean: true },
    ],
  };

  test('getProjectSetting', () => {
    expect(getProjectSetting(project, 'countryPack')).toMatchObject({ name: 'countryPack', valueString: 'kenya' });
    expect(getProjectSetting(project.setting, 'countryPack')).toMatchObject({
      name: 'countryPack',
      valueString: 'kenya',
    });
    expect(getProjectSetting(project, 'missing')).toBeUndefined();
  });

  test('getProjectSettingString', () => {
    expect(getProjectSettingString(project, 'countryPack')).toBe('kenya');
    expect(getProjectSettingString(project, 'missing')).toBeUndefined();
  });

  test('getProjectSettingBoolean', () => {
    expect(getProjectSettingBoolean(project, 'preCommitSubscriptionsEnabled')).toBe(true);
    expect(getProjectSettingBoolean(project, 'countryPack')).toBeUndefined();
  });

  test('country pack catalog includes Kenya and placeholders', () => {
    const catalog = getCountryPackCatalog();
    expect(catalog).toHaveLength(23);
    expect(getCountryPackCatalogEntry('kenya')).toMatchObject({
      id: 'kenya',
      title: 'Kenya',
      availability: 'active',
    });
    expect(getCountryPackCatalogEntry('uganda')).toMatchObject({
      id: 'uganda',
      title: 'Uganda',
      availability: 'placeholder',
    });
    expect(getCountryPackCatalogEntry('missing')).toBeUndefined();
  });

  test('formatCountryPackLabel', () => {
    const kenya = getCountryPackCatalogEntry('kenya');
    const uganda = getCountryPackCatalogEntry('uganda');
    expect(kenya).toBeDefined();
    expect(uganda).toBeDefined();
    expect(formatCountryPackLabel(kenya!)).toBe('Kenya');
    expect(formatCountryPackLabel(uganda!)).toBe('Uganda (Placeholder)');
  });

  test('Kenya AfyaLink helpers', () => {
    expect(getKenyaAfyaLinkEnvironment(project)).toBe('production');
    expect(getKenyaAfyaLinkCredentialMode(project)).toBe('afiax-managed');
    expect(getKenyaAfyaLinkEnvironment(undefined)).toBe('uat');
    expect(getKenyaAfyaLinkCredentialMode(undefined)).toBe('tenant-managed');
  });
});
