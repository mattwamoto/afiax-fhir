// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { getProjectSettingString, normalizeErrorString } from '@medplum/core';
import type { Project } from '@medplum/fhirtypes';
import fetch from 'node-fetch';

export const KenyaAfyaLinkSecretNames = {
  baseUrl: 'kenyaAfyaLinkBaseUrl',
  consumerKey: 'kenyaAfyaLinkConsumerKey',
  username: 'kenyaAfyaLinkUsername',
  password: 'kenyaAfyaLinkPassword',
} as const;

export interface KenyaAfyaLinkCredentials {
  readonly baseUrl: string;
  readonly consumerKey: string;
  readonly username: string;
  readonly password: string;
}

export interface AfyaLinkTokenResponse {
  readonly token?: string;
}

export interface AfyaLinkFacilityMessage {
  readonly facility_code?: string;
  readonly found?: number;
  readonly approved?: boolean | string | null;
  readonly facility_level?: string | null;
  readonly operational_status?: string | null;
  readonly current_license_expiry_date?: string | null;
}

export interface AfyaLinkFacilitySearchResponse {
  readonly message?: AfyaLinkFacilityMessage;
}

function getProjectSecret(project: Project, name: string): string | undefined {
  return getProjectSettingString(project.secret, name) ?? getProjectSettingString(project.systemSecret, name);
}

function requireProjectSecret(project: Project, name: string): string {
  const value = getProjectSecret(project, name);
  if (!value) {
    throw new Error(`Missing required Kenya AfyaLink secret: ${name}`);
  }
  return value;
}

export function getKenyaAfyaLinkCredentials(project: Project): KenyaAfyaLinkCredentials {
  return {
    baseUrl: requireProjectSecret(project, KenyaAfyaLinkSecretNames.baseUrl).replace(/\/+$/, ''),
    consumerKey: requireProjectSecret(project, KenyaAfyaLinkSecretNames.consumerKey),
    username: requireProjectSecret(project, KenyaAfyaLinkSecretNames.username),
    password: requireProjectSecret(project, KenyaAfyaLinkSecretNames.password),
  };
}

export async function getAfyaLinkToken(credentials: KenyaAfyaLinkCredentials): Promise<string> {
  const basicAuth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
  const response = await fetch(`${credentials.baseUrl}/v1/hie-auth?key=${encodeURIComponent(credentials.consumerKey)}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AfyaLink auth failed (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as AfyaLinkTokenResponse;
  if (!data.token) {
    throw new Error('AfyaLink auth response did not include a token');
  }

  return data.token;
}

export async function searchAfyaLinkFacility(
  credentials: KenyaAfyaLinkCredentials,
  facilityCode: string
): Promise<AfyaLinkFacilitySearchResponse> {
  const token = await getAfyaLinkToken(credentials);
  const response = await fetch(
    `${credentials.baseUrl}/v1/facility-search?facility_code=${encodeURIComponent(facilityCode)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (response.status === 404) {
    return {
      message: {
        facility_code: facilityCode,
        found: 0,
      },
    };
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AfyaLink facility search failed (${response.status}): ${errorBody}`);
  }

  try {
    return (await response.json()) as AfyaLinkFacilitySearchResponse;
  } catch (err) {
    throw new Error(`Failed to parse AfyaLink facility search response: ${normalizeErrorString(err)}`);
  }
}
