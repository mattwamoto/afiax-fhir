// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import Link from '@docusaurus/Link';
import { IconCode, IconExchange, IconFlask, IconHeartRateMonitor } from '@tabler/icons-react';
import Layout from '@theme/Layout';
import type { JSX } from 'react';
import { Card } from '../components/Card';
import { CardContainer } from '../components/CardContainer';
import { Container } from '../components/Container';
import { Feature, FeatureGrid } from '../components/landing/FeatureGrid';
import { Jumbotron } from '../components/landing/Jumbotron';
import { Section } from '../components/landing/Section';
import { SectionHeader } from '../components/landing/SectionHeader';
import styles from './about.module.css';

export default function CaseStudiesPage(): JSX.Element {
  return (
    <Layout title="Case Studies">
      <Container>
        <Jumbotron>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Implementation Patterns</h1>
            <p className={styles.heroText}>
              Afiax Enterprise uses Afiax FHIR as the clinical core for a broader pan-African platform. These
              reference patterns describe the kinds of solutions the platform is intended to support.
            </p>
            <img src="/img/hero/hero-custom-apps-and-portals.webp" alt="Custom Apps and Portals" />
          </div>
        </Jumbotron>
        <SectionHeader>
          <h2>Reference patterns</h2>
        </SectionHeader>
        <Section>
          <FeatureGrid columns={2}>
            <Feature title="Digital services and AI" icon={<IconCode />}>
              Afiax should expose clean clinical and operational APIs so AI services, patient engagement tools, and
              workforce applications can interact with the platform without owning the source record.
            </Feature>
            <Feature title="Provider and specialty workflows" icon={<IconHeartRateMonitor />}>
              Provider portals, custom EHR workflows, scheduling, documentation, referrals, and care coordination
              should be delivered on top of the shared Afiax FHIR core.
            </Feature>
            <Feature title="Diagnostics and devices" icon={<IconFlask />}>
              Laboratories, imaging partners, and device ecosystems should integrate through normalized workflows that
              keep orders, results, attachments, and audit events consistent.
            </Feature>
            <Feature title="Country and national interoperability" icon={<IconExchange />}>
              Country packs, Bots, and custom operations allow Afiax to publish regulated outputs to registries,
              payers, and national platforms without turning those external payloads into the primary clinical model.
            </Feature>
          </FeatureGrid>
        </Section>
        <Jumbotron>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Kenya as the first reference pack</h1>
            <p className={styles.heroText}>
              Kenya should prove the packaging model: canonical core first, country-specific exchange logic second, and
              tenant-specific rollout third. That makes the next country an extension problem instead of a rewrite.
            </p>
          </div>
          <div className={styles.heroImage}>
            <img src="/img/hero/hero-custom-apps-and-portals-square.webp" alt="Kenya reference pack" />
          </div>
        </Jumbotron>
        <Section>
          <CardContainer>
            <Card>
              <h3>Provider operations</h3>
              <p>
                Custom EHR workflows, provider portals, and care coordination should all use the same canonical
                resource model.
              </p>
              <p>
                <Link href="/solutions/custom-ehr">Explore provider workflows</Link>
              </p>
            </Card>
            <Card>
              <h3>Diagnostics</h3>
              <p>
                Diagnostics workflows should integrate analyzers, partner labs, and reference systems through a governed
                interoperability layer.
              </p>
              <p>
                <Link href="/solutions/lab">Explore diagnostics pattern</Link>
              </p>
            </Card>
            <Card>
              <h3>Country packs</h3>
              <p>
                National logic should live under dedicated packaging and documentation rather than being spread across
                the entire product story.
              </p>
              <p>
                <Link href="/docs/country-packs/kenya">Explore the Kenya pack</Link>
              </p>
            </Card>
          </CardContainer>
        </Section>
        <Section>
          <CardContainer>
            <Card>
              <h3>Patient-facing services</h3>
              <p>
                Patient portals and digital front doors should reuse the same identity, consent, and longitudinal
                record patterns as provider-facing workflows.
              </p>
              <p>
                <Link href="/solutions/patient-portal">Explore patient-facing services</Link>
              </p>
            </Card>
            <Card>
              <h3>Interoperability spine</h3>
              <p>
                External systems should connect through subscriptions, Bots, custom operations, and normalized return
                paths into the clinical core.
              </p>
              <p>
                <Link href="/solutions/interoperability">Explore interoperability</Link>
              </p>
            </Card>
            <Card>
              <h3>Architecture guardrails</h3>
              <p>
                The platform should keep clinical state in Afiax FHIR and let ERP, mobile, AI, and national systems
                remain integration peers.
              </p>
              <p>
                <Link href="/docs/architecture/integration-boundaries">Review the guardrails</Link>
              </p>
            </Card>
          </CardContainer>
        </Section>
      </Container>
    </Layout>
  );
}
