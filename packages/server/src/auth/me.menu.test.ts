// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import type { Project, ProjectMembership } from '@medplum/fhirtypes';
import { getUserConfigurationMenu } from './me';

describe('getUserConfigurationMenu', () => {
  test('includes country pack settings link for project admins when configured', () => {
    const project: Project = {
      resourceType: 'Project',
      setting: [{ name: 'countryPack', valueString: 'kenya' }],
    };
    const membership: ProjectMembership = {
      resourceType: 'ProjectMembership',
      project: { reference: 'Project/123' },
      user: { reference: 'User/123' },
      profile: { reference: 'Practitioner/123' },
      admin: true,
    };

    expect(getUserConfigurationMenu(project, membership)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Admin',
          link: expect.arrayContaining([expect.objectContaining({ name: 'Country Pack Settings', target: '/admin/settings' })]),
        }),
      ])
    );
  });

  test('omits country pack settings link when not configured', () => {
    const project: Project = {
      resourceType: 'Project',
    };
    const membership: ProjectMembership = {
      resourceType: 'ProjectMembership',
      project: { reference: 'Project/123' },
      user: { reference: 'User/123' },
      profile: { reference: 'Practitioner/123' },
      admin: true,
    };

    expect(getUserConfigurationMenu(project, membership)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Admin',
          link: expect.not.arrayContaining([expect.objectContaining({ name: 'Country Pack Settings' })]),
        }),
      ])
    );
  });
});
