// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { IconCode, IconPlayerPlay, IconSettings, IconStar } from '@tabler/icons-react';
import Layout from '@theme/Layout';
import { JSX } from 'react';
import { Card } from '../components/Card';
import { CardContainer } from '../components/CardContainer';
import { Container } from '../components/Container';
import { Feature, FeatureGrid } from '../components/landing/FeatureGrid';
import { Section } from '../components/landing/Section';
import { SectionHeader } from '../components/landing/SectionHeader';
import styles from './about.module.css';

export default function AboutPage(): JSX.Element {
  return (
    <Layout title="About us">
      <Container>
        <div style={{ textAlign: 'center', minHeight: '400px', padding: '120px 20px' }}>
          <h1 className={styles.heroTitle}>About Afiax Connected Healthcare</h1>
          <p className={styles.heroText}>
            Afiax is building pan-African digital health infrastructure on top of a FHIR-native clinical core.
            <br />
            The platform uses Medplum as a foundation, then adds enterprise architecture, country packs, and delivery
            patterns for real-world health systems.
          </p>
        </div>
        <Section>
          <CardContainer>
            <Card>
              <h3>What Afiax is building</h3>
              <p>
                Afiax is not just a country implementation. It is a broader platform strategy that combines a canonical
                clinical core, country-specific overlays, and tenant-level operational configuration. Kenya is the
                first reference pack, not the definition of the whole platform.
              </p>
            </Card>
          </CardContainer>
          <CardContainer>
            <Card>
              <h3>Clinical core</h3>
              <p>
                Medplum remains the system of record for canonical FHIR resources, access control, audit, provenance,
                subscriptions, Bots, and controlled workflows.
              </p>
            </Card>
            <Card>
              <h3>Country packs</h3>
              <p>
                Country packs carry profiles, terminology, mappings, regulatory rules, and connector contracts without
                hard-coding country logic into the shared platform.
              </p>
            </Card>
            <Card>
              <h3>Connected platform</h3>
              <p>
                Afiax is designed to interoperate with registries, payers, ERP platforms, commerce systems, mobile
                apps, and partner services while preserving a normalized clinical source of truth.
              </p>
            </Card>
          </CardContainer>
        </Section>
        <SectionHeader>
          <h2>Our values</h2>
        </SectionHeader>
        <Section>
          <FeatureGrid columns={2}>
            <Feature title="Build deliberately" icon={<IconPlayerPlay />}>
              Afiax is intended for regulated healthcare operations, so we prefer explicit boundaries, phased delivery,
              and traceable decisions over fast but fragile complexity.
            </Feature>
            <Feature title="Keep the core consistent" icon={<IconSettings />}>
              The shared platform should stay country-neutral wherever possible. Country packs and tenant overlays
              should extend the core, not fragment it.
            </Feature>
            <Feature title="Design for ecosystems" icon={<IconStar />}>
              Ministries, provider networks, labs, payers, pharmacies, and digital services all need to collaborate on
              the same healthcare fabric. Afiax is built for that shared operating environment.
            </Feature>
            <Feature title="Use engineering as leverage" icon={<IconCode />}>
              We use open standards, disciplined APIs, automation, and documentation to make complex health system
              delivery reproducible across countries and implementations.
            </Feature>
          </FeatureGrid>
        </Section>
        <SectionHeader>
          <h2>Operating model</h2>
          <p>
            Afiax uses a layered model so the platform can grow country by country without forcing a rewrite of the
            clinical core.
          </p>
        </SectionHeader>
        <Section>
          <CardContainer>
            <Card>
              <h3>Pan-African core</h3>
              <p>
                Shared FHIR semantics, shared security primitives, and shared platform patterns create the base that
                every country pack and solution can inherit.
              </p>
            </Card>
            <Card>
              <h3>Country packs</h3>
              <p>
                Kenya is the first reference implementation. Additional markets should plug into the same model through
                profiles, mappings, terminology, and connector packages.
              </p>
            </Card>
            <Card>
              <h3>Tenant overlays</h3>
              <p>
                Networks, hospitals, insurers, and digital providers should be able to configure workflows, access,
                and integrations without forking the platform.
              </p>
            </Card>
          </CardContainer>
        </Section>
      </Container>
    </Layout>
  );
}
