// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import Link from '@docusaurus/Link';
import {
  IconBuildingHospital,
  IconDatabaseHeart,
  IconHierarchy3,
  IconMap2,
  IconNetwork,
  IconReceipt,
  IconRoute,
  IconRosetteDiscountCheck,
  IconShieldLock,
  IconStethoscope,
  IconTopologyStar3,
} from '@tabler/icons-react';
import Layout from '@theme/Layout';
import type { JSX } from 'react';
import { useEffect } from 'react';
import { Card } from '../Card';
import { Feature, FeatureGrid } from './FeatureGrid';
import styles from './LandingPage.module.css';
import { Section } from './Section';
import { SectionHeader } from './SectionHeader';

export function LandingPage(): JSX.Element {
  useEffect(() => {
    const navbar = document.querySelector<HTMLElement>('.navbar');
    if (!navbar) {
      return;
    }

    function onScroll(): void {
      if (window.scrollY === 0) {
        navbar.classList.remove('onScroll');
      } else {
        navbar.classList.add('onScroll');
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="page">
      <Layout>
        <div className={styles.landingContent}>
          <div className={styles.heroSection}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Build the pan-African healthcare platform without hard-coding one market into the core.</h1>
              <p className={styles.heroText}>
                Afiax FHIR is the FHIR-native clinical core for Afiax Enterprise, the broader pan-African digital
                healthcare platform.
                <br />
                The platform combines clinical interoperability, digital service layers, and modular country packs so
                national requirements stay local while the broader platform remains reusable.
              </p>
              <div className={styles.heroButtons}>
                <Link to="/docs/architecture" className={styles.purpleButton}>
                  Explore the Architecture
                </Link>
                <Link to="/docs/country-packs" className={styles.ctaWhiteButton}>
                  View Country Packs
                </Link>
              </div>
            </div>
            <div className={styles.heroImageContainer}>
              <Card>
                <h3>Afiax platform scope</h3>
                <p>
                  <strong>Core:</strong> Afiax FHIR services, policies, subscriptions, Bots, and internal operations.
                </p>
                <p>
                  <strong>Digital services:</strong> provider workflows, patient engagement, analytics, telemedicine,
                  and partner APIs built on the same core.
                </p>
                <p>
                  <strong>Localization:</strong> country packs and tenant overlays carry national rules, deployment
                  choices, and customer-specific workflow constraints.
                </p>
              </Card>
            </div>
          </div>
          <SectionHeader>
            <h2>Architected for sovereign, federated healthcare delivery</h2>
            <p>
              Afiax is designed so clinical data, digital services, and national interoperability can evolve together
              without forcing country-specific logic into the core platform.
            </p>
          </SectionHeader>
          <Section>
            <FeatureGrid columns={3} variant="ecosystem">
              <Feature title="FHIR-native clinical core" icon={<IconDatabaseHeart />}>
                Clinical source-of-truth data lives in canonical FHIR resources, not in national submission payloads.
              </Feature>
              <Feature title="Country packs" icon={<IconMap2 />}>
                National registries, terminology, payer workflows, and exchange connectors are packaged as modular
                overlays.
              </Feature>
              <Feature title="Digital service layers" icon={<IconStethoscope />}>
                Provider workflows, patient engagement, telemedicine, and partner-facing services can share the same
                canonical platform.
              </Feature>
              <Feature title="Sovereign deployment" icon={<IconShieldLock />}>
                Identifiable clinical data can remain in-country while non-sovereign tooling is isolated by policy.
              </Feature>
              <Feature title="Workflow orchestration" icon={<IconRoute />}>
                Bots and FHIR operations coordinate auditable automation without pushing national API logic into the UI.
              </Feature>
              <Feature title="Tenant isolation" icon={<IconHierarchy3 />}>
                Each customer can inherit the shared platform while keeping tenant-specific workflow, secrets, and
                policies separate.
              </Feature>
            </FeatureGrid>
          </Section>
          <SectionHeader>
            <h2>The broader Afiax platform reaches beyond one country pack</h2>
            <p>
              The business and technical platform includes clinical systems, remote care, analytics, and developer
              infrastructure, with country packs localizing that platform for each market.
            </p>
          </SectionHeader>
          <Section>
            <FeatureGrid columns={3} variant="complexity">
              <Feature title="Clinical interoperability spine" icon={<IconRoute />}>
                Build identity, encounters, referrals, documents, and coverage workflows on top of a shared data model.
              </Feature>
              <Feature title="Telemedicine and digital access" icon={<IconNetwork />}>
                Support virtual care, patient engagement, and remote-care experiences without fragmenting the data layer.
              </Feature>
              <Feature title="Analytics and AI" icon={<IconTopologyStar3 />}>
                Add dashboards, predictive services, and operational insight on top of normalized clinical data.
              </Feature>
              <Feature title="Developer platform" icon={<IconRosetteDiscountCheck />}>
                Expose APIs, Bots, and reusable contracts so partners and internal teams can extend the platform safely.
              </Feature>
              <Feature title="SaaS, PaaS, and sovereign delivery" icon={<IconReceipt />}>
                Operate the same platform as shared SaaS, dedicated runtimes, or managed in-country infrastructure.
              </Feature>
              <Feature title="Federated growth path" icon={<IconBuildingHospital />}>
                Scale across providers, counties, payers, and future markets without forking the architecture.
              </Feature>
            </FeatureGrid>
          </Section>
          <SectionHeader>
            <h2>Kenya is the first country pack, not the platform boundary</h2>
            <p>
              Kenya is the first reference implementation used to validate the country-pack SDK and localization model.
            </p>
          </SectionHeader>
          <Section>
            <FeatureGrid columns={3}>
              <Feature title="Country-pack SDK" icon={<IconMap2 />}>
                Profiles, terminology, mappings, connectors, Bots, and compliance artifacts define the localization contract.
              </Feature>
              <Feature title="Kenya reference pack" icon={<IconRoute />}>
                Kenya implements registries, eligibility, SHR publishing, and claims behind generic internal operations.
              </Feature>
              <Feature title="Expansion path" icon={<IconNetwork />}>
                Future markets should inherit the same core model, SDK contracts, and tenant architecture instead of
                redefining the platform.
              </Feature>
            </FeatureGrid>
          </Section>
        </div>
        <div className={styles.ctaBanner}>
          <div className={`${styles.landingContent} ${styles.ctaBannerInner}`}>
            <h2>Start with the platform architecture, then localize through country packs</h2>
            <p className={styles.ctaBannerDescription}>
              Use the architecture docs to define Afiax FHIR and its role in Afiax Enterprise, then open the
              country-pack section when you are ready to localize Kenya or the next market.
            </p>
            <div className={styles.heroButtons}>
              <Link to="/docs/architecture" className={styles.ctaWhiteButton}>
                Read the Architecture
              </Link>
              <Link to="/docs/country-packs" className={styles.purpleButton}>
                Open Country Packs
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
}
