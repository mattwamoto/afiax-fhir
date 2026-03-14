// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { getProjectSettingString } from '@medplum/core';
import type { Project } from '@medplum/fhirtypes';
import { kenyaCountryPack } from './kenya';
import type { CountryPackDefinition } from './types';

const registry: Record<string, CountryPackDefinition> = {
  kenya: kenyaCountryPack,
};

export function listCountryPacks(): CountryPackDefinition[] {
  return Object.values(registry);
}

export function getCountryPack(id: string | undefined): CountryPackDefinition | undefined {
  return id ? registry[id] : undefined;
}

export function getProjectCountryPack(project: Pick<Project, 'setting'>): CountryPackDefinition | undefined {
  return getCountryPack(getProjectSettingString(project, 'countryPack'));
}
