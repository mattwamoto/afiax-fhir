// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { MedplumKnativeConfig } from '../../config/types';
import { getConfig } from '../../config/loader';
import { resolveBotRuntimeUrl } from '../external/execute';

/**
 * Returns the Knative configuration from the Medplum configuration.
 * Throws an error if Knative is not enabled in the configuration.
 */
export function getKnativeConfig(): MedplumKnativeConfig {
  const config = getConfig().knative;
  if (!config) {
    throw new Error('Knative bots are not enabled');
  }
  return config;
}

export function getKnativeFunctionUrl(id: string): string {
  const config = getKnativeConfig();
  return resolveBotRuntimeUrl(config.invocationUrl, id);
}

export function getKnativeAuthHeaders(): Record<string, string> | undefined {
  const { authHeader, authToken } = getKnativeConfig();
  if (!authHeader || !authToken) {
    return undefined;
  }
  return { [authHeader]: authToken };
}
