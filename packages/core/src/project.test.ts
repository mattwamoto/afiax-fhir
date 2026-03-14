// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import type { Project } from '@medplum/fhirtypes';
import { getProjectSetting, getProjectSettingBoolean, getProjectSettingString } from './project';

describe('project settings helpers', () => {
  const project: Project = {
    resourceType: 'Project',
    setting: [
      { name: 'countryPack', valueString: 'kenya' },
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
});
