// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import type { Project } from '@medplum/fhirtypes';
import {
  formatCountryPackLabel,
  getCountryPackCatalog,
  getCountryPackCatalogEntry,
  getKenyaAfyaLinkCredentialMode,
  getKenyaAfyaLinkEnvironment,
  getKenyaClaimStatusWorkflowBotId,
  getKenyaClaimSubmitWorkflowBotId,
  getKenyaClaimWorkflowBotId,
  getKenyaHieAgentId,
  getKenyaHieCredentialMode,
  getKenyaHieEnvironment,
  getKenyaShaClaimsCredentialMode,
  getKenyaShaClaimsEnvironment,
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
      { name: KenyaProjectSettingNames.hieEnvironment, valueString: 'production' },
      { name: KenyaProjectSettingNames.hieCredentialMode, valueString: 'afiax-managed' },
      { name: KenyaProjectSettingNames.hieAgentId, valueString: 'agent-001' },
      { name: KenyaProjectSettingNames.shaClaimsEnvironment, valueString: 'uat' },
      { name: KenyaProjectSettingNames.shaClaimsCredentialMode, valueString: 'tenant-managed' },
      { name: KenyaProjectSettingNames.claimSubmitWorkflowBotId, valueString: 'kenya-claim-submit-bot' },
      { name: KenyaProjectSettingNames.claimStatusWorkflowBotId, valueString: 'kenya-claim-status-bot' },
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

  test('Kenya helpers', () => {
    expect(getKenyaHieEnvironment(project)).toBe('production');
    expect(getKenyaHieCredentialMode(project)).toBe('afiax-managed');
    expect(getKenyaHieAgentId(project)).toBe('agent-001');
    expect(getKenyaShaClaimsEnvironment(project)).toBe('uat');
    expect(getKenyaShaClaimsCredentialMode(project)).toBe('tenant-managed');
    expect(getKenyaClaimSubmitWorkflowBotId(project)).toBe('kenya-claim-submit-bot');
    expect(getKenyaClaimStatusWorkflowBotId(project)).toBe('kenya-claim-status-bot');
    expect(getKenyaClaimWorkflowBotId(project)).toBeUndefined();
    expect(getKenyaAfyaLinkEnvironment(project)).toBe('production');
    expect(getKenyaAfyaLinkCredentialMode(project)).toBe('afiax-managed');
    expect(getKenyaHieEnvironment(undefined)).toBe('uat');
    expect(getKenyaHieCredentialMode(undefined)).toBe('tenant-managed');
    expect(getKenyaShaClaimsEnvironment(undefined)).toBe('uat');
    expect(getKenyaShaClaimsCredentialMode(undefined)).toBe('tenant-managed');
    expect(getKenyaClaimSubmitWorkflowBotId(undefined)).toBeUndefined();
    expect(getKenyaClaimStatusWorkflowBotId(undefined)).toBeUndefined();
    expect(getKenyaClaimWorkflowBotId(undefined)).toBeUndefined();
  });

  test('Kenya helpers support legacy AfyaLink setting names', () => {
    const legacyProject: Project = {
      resourceType: 'Project',
      setting: [
        { name: KenyaProjectSettingNames.afyaLinkEnvironment, valueString: 'production' },
        { name: KenyaProjectSettingNames.afyaLinkCredentialMode, valueString: 'afiax-managed' },
      ],
    };

    expect(getKenyaHieEnvironment(legacyProject)).toBe('production');
    expect(getKenyaHieCredentialMode(legacyProject)).toBe('afiax-managed');
    expect(getKenyaShaClaimsEnvironment(legacyProject)).toBe('production');
    expect(getKenyaShaClaimsCredentialMode(legacyProject)).toBe('afiax-managed');
  });

  test('Kenya claim workflow bot helpers fall back to legacy shared setting', () => {
    const legacyProject: Project = {
      resourceType: 'Project',
      setting: [{ name: KenyaProjectSettingNames.claimWorkflowBotId, valueString: 'legacy-claim-bot' }],
    };

    expect(getKenyaClaimSubmitWorkflowBotId(legacyProject)).toBe('legacy-claim-bot');
    expect(getKenyaClaimStatusWorkflowBotId(legacyProject)).toBe('legacy-claim-bot');
    expect(getKenyaClaimWorkflowBotId(legacyProject)).toBe('legacy-claim-bot');
  });
});
