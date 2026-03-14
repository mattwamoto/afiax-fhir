// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { JSX } from 'react';
import { getAppName } from '../utils/app';

export interface LogoProps {
  readonly size: number;
  readonly fill?: string;
}

export function Logo(props: LogoProps): JSX.Element {
  const appName = getAppName();
  const overrideUrl = import.meta.env.MEDPLUM_LOGO_URL;
  if (overrideUrl) {
    return <img src={overrideUrl} alt={`${appName} logo`} style={{ maxHeight: props.size }} />;
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      style={{ width: props.size, height: props.size }}
      aria-hidden="true"
    >
      <title>{appName} Logo</title>
      <circle cx="64" cy="64" r="61" fill="#5d6671" stroke="#d9dfe6" strokeWidth="3.5" />
      <circle cx="64" cy="64" r="44.5" fill="#1da7dd" />
      <path
        fill="none"
        stroke="#ffffff"
        strokeLinejoin="round"
        strokeWidth="7"
        d="M26 77V45h17c4.4 0 8-3.6 8-8V21h24v22c0 4.4 3.6 8 8 8h19v24H83c-4.4 0-8 3.6-8 8v20H51V85c0-4.4-3.6-8-8-8Z"
      />
      <path
        fill="none"
        stroke="#ef2334"
        strokeLinejoin="round"
        strokeWidth="7"
        d="M111 58v24H92c-4.4 0-8 3.6-8 8v21H60V90c0-4.4-3.6-8-8-8H33V58h19c4.4 0 8-3.6 8-8V29h24v21c0 4.4 3.6 8 8 8Z"
      />
    </svg>
  );
}
