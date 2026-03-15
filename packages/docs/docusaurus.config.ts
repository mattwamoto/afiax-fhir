// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'Afiax FHIR',
  tagline: 'FHIR-native clinical core for Afiax Enterprise',
  url: 'https://www.afiax.africa',
  baseUrl: '/',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  onDuplicateRoutes: 'throw',
  favicon: 'img/afiax-mark.svg',
  organizationName: 'mattwamoto',
  projectName: 'afiax-fhir',

  // Set this to true to enable the faster experimental build mode.
  // https://github.com/facebook/docusaurus/issues/10556
  future: {
    v4: true,
    experimental_faster: true,
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/mattwamoto/afiax-fhir/blob/main/packages/docs/',
          async sidebarItemsGenerator({ defaultSidebarItemsGenerator, ...args }) {
            let items = await defaultSidebarItemsGenerator(args);
            items = items.filter((e) => !(e.type === 'doc' && e.id.endsWith('index')));
            return items;
          },
          showLastUpdateTime: true,
        },
        blog: {
          showReadingTime: true,
          blogSidebarCount: 15,
          blogSidebarTitle: 'Recent posts',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/img/afiax-mark.svg',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'manifest',
        href: '/manifest.json',
      },
    },
  ],

  themeConfig: {
    navbar: {
      logo: {
        alt: 'Afiax FHIR',
        src: 'img/logo.svg',
        width: 196,
        height: 44,
      },
      items: [
        {
          type: 'doc',
          docId: 'architecture/index',
          label: 'Architecture',
          position: 'left',
        },
        {
          type: 'doc',
          docId: 'country-packs/index',
          label: 'Country Packs',
          position: 'left',
        },
        {
          type: 'doc',
          docId: 'architecture/enterprise-platform',
          position: 'left',
          label: 'Platform',
        },
        {
          type: 'doc',
          docId: 'home',
          position: 'left',
          label: 'Docs',
        },
        {
          to: 'https://app.afiax.africa/signin',
          label: 'Sign In',
          position: 'right',
          className: 'button button--outline button--primary navbar-btn navbar-btn-outlined',
        },
        {
          to: 'https://www.afiax.africa',
          label: 'Visit Afiax',
          position: 'right',
          className: 'button button--primary navbar-btn navbar-btn-filled',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'Developers',
          items: [
            {
              label: 'Architecture',
              to: '/docs/architecture',
            },
            {
              label: 'Enterprise platform',
              to: '/docs/architecture/enterprise-platform',
            },
            {
              label: 'Canonical model',
              to: '/docs/architecture/canonical-model',
            },
            {
              label: 'Country packs',
              to: '/docs/country-packs',
            },
          ],
        },
        {
          title: 'Platform',
          items: [
            {
              label: 'Kenya reference pack',
              to: '/docs/country-packs/kenya',
            },
            {
              label: 'Country pack SDK',
              to: '/docs/country-packs/sdk',
            },
            {
              label: 'Platform foundation',
              to: '/docs/architecture/platform-foundation',
            },
            {
              label: 'Bots',
              to: '/docs/bots',
            },
            {
              label: 'Self hosting',
              to: '/docs/self-hosting',
            },
          ],
        },
        {
          title: 'Company',
          items: [
            {
              label: 'Website',
              to: 'https://www.afiax.africa',
            },
            {
              label: 'GitHub',
              to: 'https://github.com/mattwamoto/afiax-fhir',
            },
            {
              label: 'Contact',
              to: 'mailto:info@afiax.africa',
            },
            {
              label: 'Contributing',
              to: '/docs/contributing',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Oortcloud Computing. Afiax FHIR is built on Medplum open-source software.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    image: 'img/afiax-mark.svg',
  } satisfies Preset.ThemeConfig,
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
};

export default config;
