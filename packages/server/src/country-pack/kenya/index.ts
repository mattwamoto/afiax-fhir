// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { CountryPackDefinition } from '../types';
import { KenyaAfyaLinkSecretNames } from './afyalink';
import { checkKenyaCoverage } from './check-coverage';
import { checkKenyaNationalClaimStatus } from './check-national-claim-status';
import { submitKenyaNationalClaim } from './submit-national-claim';
import { verifyKenyaFacilityAuthority } from './verify-facility-authority';
import { verifyKenyaPractitionerAuthority } from './verify-practitioner-authority';

export const kenyaCountryPack: CountryPackDefinition = {
  id: 'kenya',
  title: 'Kenya Country Pack',
  countryCode: 'KE',
  requiredProjectSettings: ['countryPack'],
  requiredProjectSecrets: Object.values(KenyaAfyaLinkSecretNames),
  supportedOperations: [
    'resolve-patient-identity',
    'verify-facility-authority',
    'verify-practitioner-authority',
    'check-coverage',
    'publish-national-record',
    'submit-national-claim',
    'check-national-claim-status',
  ],
  identifierBindings: [
    {
      category: 'national-client-id',
      resourceTypes: ['Patient'],
      description: 'Country patient authority identifier',
      kenyaExample: 'DHA Client Registry ID',
    },
    {
      category: 'facility-authority-id',
      resourceTypes: ['Organization', 'Location'],
      description: 'National facility authority identifier',
      kenyaExample: 'Master Facility List (MFL) code',
    },
    {
      category: 'practitioner-authority-id',
      resourceTypes: ['Practitioner'],
      description: 'National professional authority identifier',
      kenyaExample: 'Health Worker Registry identifier',
    },
    {
      category: 'payer-member-id',
      resourceTypes: ['Coverage'],
      description: 'Coverage or payer membership identifier',
      kenyaExample: 'SHA member identifier',
    },
  ],
  verifyFacilityAuthority: verifyKenyaFacilityAuthority,
  verifyPractitionerAuthority: verifyKenyaPractitionerAuthority,
  checkCoverage: checkKenyaCoverage,
  submitNationalClaim: submitKenyaNationalClaim,
  checkNationalClaimStatus: checkKenyaNationalClaimStatus,
};
