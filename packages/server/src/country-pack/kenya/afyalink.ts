// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import {
  getKenyaHieCredentialMode,
  getKenyaHieEnvironment,
  normalizeErrorString,
  type KenyaHieCredentialMode,
  type KenyaHieEnvironment,
} from '@medplum/core';
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
  return project.secret?.find((entry) => entry.name === name)?.valueString;
}

function getProjectSystemSecret(project: Project, name: string): string | undefined {
  return project.systemSecret?.find((entry) => entry.name === name)?.valueString;
}

function getManagedProjectSecret(
  project: Project,
  name: string,
  credentialMode: KenyaHieCredentialMode
): string | undefined {
  if (credentialMode === 'afiax-managed') {
    return getProjectSystemSecret(project, name);
  }
  return getProjectSecret(project, name) ?? getProjectSystemSecret(project, name);
}

function requireManagedProjectSecret(
  project: Project,
  name: string,
  credentialMode: KenyaHieCredentialMode
): string {
  const value = getManagedProjectSecret(project, name, credentialMode);
  if (!value) {
    throw new Error(
      credentialMode === 'afiax-managed'
        ? `Missing required Afiax-managed Kenya AfyaLink secret: ${name}`
        : `Missing required Kenya AfyaLink secret: ${name}`
    );
  }
  return value;
}

function getKenyaAfyaLinkBaseUrl(
  project: Project,
  credentialMode: KenyaHieCredentialMode,
  environment: KenyaHieEnvironment
): string {
  const explicitBaseUrl = getManagedProjectSecret(project, KenyaAfyaLinkSecretNames.baseUrl, credentialMode);
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/+$/, '');
  }

  if (environment === 'uat') {
    // DHA's published UAT integration guides use https://uat.dha.go.ke as the shared UAT base.
    return 'https://uat.dha.go.ke';
  }

  throw new Error(
    'Missing required Kenya AfyaLink production base URL. Configure kenyaAfyaLinkBaseUrl as an Afiax-managed system secret or project secret override.'
  );
}

export function getKenyaAfyaLinkCredentials(project: Project): KenyaAfyaLinkCredentials {
  const credentialMode = getKenyaHieCredentialMode(project);
  const environment = getKenyaHieEnvironment(project);
  return {
    baseUrl: getKenyaAfyaLinkBaseUrl(project, credentialMode, environment),
    consumerKey: requireManagedProjectSecret(project, KenyaAfyaLinkSecretNames.consumerKey, credentialMode),
    username: requireManagedProjectSecret(project, KenyaAfyaLinkSecretNames.username, credentialMode),
    password: requireManagedProjectSecret(project, KenyaAfyaLinkSecretNames.password, credentialMode),
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

  const rawBody = (await response.text()).trim();
  if (!rawBody) {
    throw new Error('AfyaLink auth response was empty');
  }

  try {
    const data = JSON.parse(rawBody) as AfyaLinkTokenResponse | string;
    if (typeof data === 'string' && data.trim()) {
      return data.trim();
    }
    if (data && typeof data === 'object' && typeof data.token === 'string' && data.token.trim()) {
      return data.token.trim();
    }
  } catch {
    // DHA UAT may return the JWT token as a raw string instead of a JSON object.
    if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(rawBody)) {
      return rawBody;
    }
  }

  throw new Error('AfyaLink auth response did not include a valid token');
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
