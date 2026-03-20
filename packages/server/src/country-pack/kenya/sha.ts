// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import {
  getKenyaShaClaimsCredentialMode,
  getKenyaShaClaimsEnvironment,
  KenyaShaClaimsSecretNames,
  normalizeErrorString,
  type KenyaShaClaimsCredentialMode,
  type KenyaShaClaimsEnvironment,
} from '@medplum/core';
import type { Bundle, Project } from '@medplum/fhirtypes';
import { SignJWT } from 'jose';
import fetch from 'node-fetch';

const KenyaShaClaimsBaseUrl = {
  uat: 'https://qa-mis.apeiro-digital.com',
  production: 'https://fhir.sha.go.ke',
} as const;

export interface KenyaShaClaimsCredentials {
  readonly baseUrl: string;
  readonly accessKey: string;
  readonly secretKey: string;
  readonly callbackUrl?: string;
}

export interface KenyaShaClaimsSubmissionResponse {
  readonly submissionEndpoint: string;
  readonly statusTrackingEndpoint: string;
  readonly responseStatusCode: number;
  readonly rawResponse: string;
  readonly parsedResponse?: unknown;
}

function getProjectSecret(project: Project, name: string): string | undefined {
  return project.secret?.find((entry) => entry.name === name)?.valueString?.trim() || undefined;
}

function getProjectSystemSecret(project: Project, name: string): string | undefined {
  return project.systemSecret?.find((entry) => entry.name === name)?.valueString?.trim() || undefined;
}

function getManagedProjectSecret(
  project: Project,
  name: string,
  credentialMode: KenyaShaClaimsCredentialMode
): string | undefined {
  if (credentialMode === 'afiax-managed') {
    return getProjectSystemSecret(project, name);
  }
  return getProjectSecret(project, name) ?? getProjectSystemSecret(project, name);
}

function requireManagedProjectSecret(
  project: Project,
  name: string,
  credentialMode: KenyaShaClaimsCredentialMode
): string {
  const value = getManagedProjectSecret(project, name, credentialMode);
  if (!value) {
    throw new Error(
      credentialMode === 'afiax-managed'
        ? `Missing required Afiax-managed Kenya SHA secret: ${name}`
        : `Missing required Kenya SHA secret: ${name}`
    );
  }
  return value;
}

export function getKenyaShaClaimsBaseUrl(
  project: Project,
  credentialMode: KenyaShaClaimsCredentialMode = getKenyaShaClaimsCredentialMode(project),
  environment: KenyaShaClaimsEnvironment = getKenyaShaClaimsEnvironment(project)
): string {
  const explicitBaseUrl = getManagedProjectSecret(project, KenyaShaClaimsSecretNames.baseUrl, credentialMode);
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/+$/, '');
  }

  return KenyaShaClaimsBaseUrl[environment];
}

export function hasKenyaShaClaimsCredentials(project: Project): boolean {
  const credentialMode = getKenyaShaClaimsCredentialMode(project);
  return !!(
    getManagedProjectSecret(project, KenyaShaClaimsSecretNames.accessKey, credentialMode) &&
    getManagedProjectSecret(project, KenyaShaClaimsSecretNames.secretKey, credentialMode)
  );
}

export function getKenyaShaClaimsCredentials(project: Project): KenyaShaClaimsCredentials {
  const credentialMode = getKenyaShaClaimsCredentialMode(project);
  const environment = getKenyaShaClaimsEnvironment(project);
  return {
    baseUrl: getKenyaShaClaimsBaseUrl(project, credentialMode, environment),
    accessKey: requireManagedProjectSecret(project, KenyaShaClaimsSecretNames.accessKey, credentialMode),
    secretKey: requireManagedProjectSecret(project, KenyaShaClaimsSecretNames.secretKey, credentialMode),
    callbackUrl: getManagedProjectSecret(project, KenyaShaClaimsSecretNames.callbackUrl, credentialMode),
  };
}

export async function getKenyaShaClaimsToken(
  credentials: KenyaShaClaimsCredentials,
  nowSeconds = Math.floor(Date.now() / 1000)
): Promise<string> {
  return new SignJWT({ key: credentials.accessKey })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + 60)
    .sign(new TextEncoder().encode(credentials.secretKey));
}

function tryParseJson(rawResponse: string): unknown | undefined {
  if (!rawResponse.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(rawResponse);
  } catch {
    return undefined;
  }
}

export async function submitKenyaShaClaimBundle(
  credentials: KenyaShaClaimsCredentials,
  bundle: Bundle,
  bundleId: string
): Promise<KenyaShaClaimsSubmissionResponse> {
  const submissionEndpoint = `${credentials.baseUrl}/v1/shr-med/bundle`;
  const statusTrackingEndpoint = `${credentials.baseUrl}/v1/shr-med/claim-status?claim_id=${encodeURIComponent(bundleId)}`;
  const token = await getKenyaShaClaimsToken(credentials);

  const response = await fetch(submissionEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json, application/fhir+json',
      'Content-Type': 'application/fhir+json',
    },
    body: JSON.stringify(bundle),
  });

  const rawResponse = await response.text();

  if (!response.ok) {
    throw new Error(`Kenya SHA claim submission failed (${response.status}): ${rawResponse}`);
  }

  return {
    submissionEndpoint,
    statusTrackingEndpoint,
    responseStatusCode: response.status,
    rawResponse,
    parsedResponse: tryParseJson(rawResponse),
  };
}

export function normalizeKenyaShaClaimsError(err: unknown): string {
  return `Kenya SHA claim submission failed: ${normalizeErrorString(err)}`;
}
