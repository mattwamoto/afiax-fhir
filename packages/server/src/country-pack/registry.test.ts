// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { getCountryPack, getProjectCountryPack, listCountryPacks } from './registry';

describe('country pack registry', () => {
  test('lists kenya reference pack', () => {
    expect(listCountryPacks()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'kenya',
          countryCode: 'KE',
        }),
      ])
    );
  });

  test('gets country pack by identifier', () => {
    expect(getCountryPack('kenya')).toMatchObject({
      id: 'kenya',
      title: 'Kenya Country Pack',
    });
  });

  test('resolves country pack from project settings', () => {
    expect(
      getProjectCountryPack({
        setting: [{ name: 'countryPack', valueString: 'kenya' }],
      })
    ).toMatchObject({
      id: 'kenya',
    });
  });
});
