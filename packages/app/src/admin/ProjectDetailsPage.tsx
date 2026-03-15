// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Title } from '@mantine/core';
import { formatCountryPackLabel, getCountryPackCatalogEntry, getProjectSettingString } from '@medplum/core';
import { DescriptionList, DescriptionListEntry, useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { getProjectId } from '../utils';

export function ProjectDetailsPage(): JSX.Element {
  const medplum = useMedplum();
  const projectId = getProjectId(medplum);
  const result = medplum.get(`admin/projects/${projectId}`).read();
  const countryPack = getProjectSettingString(result.project, 'countryPack');
  const countryPackEntry = getCountryPackCatalogEntry(countryPack);

  return (
    <>
      <Title>Details</Title>
      <DescriptionList>
        <DescriptionListEntry term="ID">{result.project.id}</DescriptionListEntry>
        <DescriptionListEntry term="Name">{result.project.name}</DescriptionListEntry>
        <DescriptionListEntry term="Country Pack">
          {countryPackEntry ? formatCountryPackLabel(countryPackEntry) : countryPack ?? 'Not configured'}
        </DescriptionListEntry>
        <DescriptionListEntry term="Project Settings">{String(result.project.setting?.length ?? 0)}</DescriptionListEntry>
      </DescriptionList>
    </>
  );
}
