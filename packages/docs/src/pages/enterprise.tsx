// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import Link from '@docusaurus/Link';
import {
  IconCategory2,
  IconChecklist,
  IconCircleCheck,
  IconClipboardData,
  IconCloudLock,
  IconCube,
  IconDashboard,
  IconExchange,
  IconFlask,
  IconLock,
  IconReceipt2,
  IconUsers,
} from '@tabler/icons-react';
import Layout from '@theme/Layout';
import { JSX } from 'react';
import { Card } from '../components/Card';
import { CardContainer } from '../components/CardContainer';
import { Container } from '../components/Container';
import { Feature, FeatureGrid } from '../components/landing/FeatureGrid';
import { Jumbotron } from '../components/landing/Jumbotron';
import { Section } from '../components/landing/Section';
import styles from './about.module.css';

export default function EnterprisePage(): JSX.Element {
  return (
    <Layout title="Afiax Enterprise">
      <Container>
        <Jumbotron>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Enterprise digital health infrastructure</h1>
            <p className={styles.heroText}>
              Afiax Enterprise uses Afiax FHIR as the clinical core, then adds governance, country-pack delivery, and
              integration architecture for ministries, provider networks, payers, labs, pharmacies, and digital health
              programs.
            </p>
            <Link href="/contact" className={styles.getStartedButton}>
              <div>Contact Afiax</div>
              <img src="/img/btn-arrow.svg" alt="Go arrow" width="32" height="32" />
            </Link>
          </div>
          <div className={styles.heroImage}>
            <img
              src="/img/hero/hero-custom-apps-and-portals-square.webp"
              alt="Afiax enterprise platform"
              width="450"
              height="450"
            />
          </div>
        </Jumbotron>
        <Section>
          <FeatureGrid columns={3}>
            <Feature title="Sovereign deployment" icon={<IconLock />}>
              Support country-specific hosting, controlled environments, and enterprise-grade isolation without changing
              the core clinical model.
            </Feature>
            <Feature title="Identity and access" icon={<IconCloudLock />}>
              Apply multi-tenant controls, role-aware access, and partner collaboration patterns across ministries,
              counties, facilities, and implementing organizations.
            </Feature>
            <Feature title="Country-pack governance" icon={<IconChecklist />}>
              Keep country-specific identifiers, terminology, regulatory mappings, and exchange contracts out of the
              shared platform layer.
            </Feature>
            <Feature title="Diagnostics and imaging" icon={<IconFlask />}>
              Coordinate orders, results, attachments, and operational handoffs while keeping the normalized record in
              Afiax FHIR.
            </Feature>
            <Feature title="National exchange" icon={<IconExchange />}>
              Publish to registries, payer systems, national repositories, and partner networks through auditable,
              retry-safe integration flows.
            </Feature>
            <Feature title="Care orchestration" icon={<IconClipboardData />}>
              Use Tasks, Communications, Subscriptions, and Bots to coordinate care events, referrals, approvals, and
              follow-up workflows.
            </Feature>
            <Feature title="Workforce and credentialing" icon={<IconUsers />}>
              Manage practitioners, practitioner roles, organization structure, and verification workflows across large
              delivery networks.
            </Feature>
            <Feature title="Operational analytics" icon={<IconCube />}>
              Feed external analytics stacks while preserving the clinical source of truth and reconciliation trail in
              the Afiax platform.
            </Feature>
            <Feature title="Coverage and revenue" icon={<IconReceipt2 />}>
              Model eligibility, coverage, claims-adjacent events, and reconciliation patterns without collapsing
              finance logic into the clinical record.
            </Feature>
            <Feature title="Enterprise identity resolution" icon={<IconCircleCheck />}>
              Build patient matching, duplicate review, and canonical identifier strategies across facilities and
              partner channels.
            </Feature>
            <Feature title="Service catalog and referrals" icon={<IconCategory2 />}>
              Standardize service menus, referral intake, and network routing across health programs, specialist groups,
              and distributed facilities.
            </Feature>
            <Feature title="Audit and control" icon={<IconDashboard />}>
              Keep correlation IDs, audit events, provenance, and reconciliation tooling in the platform so every
              external exchange can be traced.
            </Feature>
          </FeatureGrid>
        </Section>
        <Jumbotron>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Governed platform architecture</h1>
            <p className={styles.heroText}>
              Afiax should keep Afiax FHIR focused on canonical records, permissions, automation, and auditability.
              ERP, mobile, commerce, AI, and national service integrations should remain external peers that connect
              through disciplined contracts.
            </p>
          </div>
          <div className={styles.heroImage}>
            <img src="/img/blog/ciso-dashboard.jpg" alt="Governed healthcare operations" width="488" height="384" />
          </div>
        </Jumbotron>
        <Jumbotron>
          <div className={styles.heroImage}>
            <img src="/img/infrastructure-jumbotron.svg" alt="Afiax infrastructure model" width="488" height="384" />
          </div>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>A phased delivery model</h1>
            <p className={styles.heroText}>
              Start with the shared canonical core, add one country pack with production-grade connectors, and expand
              into tenant-specific workflows only after the clinical and regulatory spine is stable.
            </p>
          </div>
        </Jumbotron>
        <Section>
          <CardContainer>
            <Card>
              <h3>Architecture</h3>
              <p>
                Read the platform architecture, operating model, and canonical data strategy that sit above the
                upstream Medplum foundation.
              </p>
              <p>
                <Link href="/docs/architecture">Open architecture docs</Link>
              </p>
            </Card>
            <Card>
              <h3>Country packs</h3>
              <p>
                Keep country-specific implementation logic under a dedicated packaging model so Kenya and future markets
                do not distort the shared platform.
              </p>
              <p>
                <Link href="/docs/country-packs">Browse country packs</Link>
              </p>
            </Card>
            <Card>
              <h3>Integration boundaries</h3>
              <p>
                Use a clear ownership model for Afiax FHIR, external systems, and normalization back into the clinical
                core.
              </p>
              <p>
                <Link href="/docs/architecture/integration-boundaries">Review boundaries</Link>
              </p>
            </Card>
          </CardContainer>
        </Section>
        <Jumbotron>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Implementation approach</h1>
            <p className={styles.heroText}>
              The right sequence is usually canonical core first, one country pack second, production connectors third,
              and broader digital services after the clinical and operational backbone is working.
            </p>
            <Link href="/docs/country-packs/kenya" className={styles.getStartedButton}>
              <div>See Kenya Pack</div>
              <img src="/img/btn-arrow.svg" alt="Go arrow" width="32" height="32" />
            </Link>
          </div>
          <div className={styles.heroImage}>
            <img src="/img/blog/workshop.svg" alt="Afiax implementation workshop" width="488" height="384" />
          </div>
        </Jumbotron>
      </Container>
    </Layout>
  );
}
