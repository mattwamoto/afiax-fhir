// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import type { Project, ProjectSetting } from '@medplum/fhirtypes';

export type ProjectSettingsSource = Pick<Project, 'setting'> | ProjectSetting[] | undefined;

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
