// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import { JSX } from 'react';
import { Container } from '../../components/Container';
import { Jumbotron } from '../../components/landing/Jumbotron';
import styles from '../about.module.css';

export default function SolutionsPage(): JSX.Element {
  return (
    <Layout title="Solution Patterns">
      <Container>
        <Jumbotron>
          <div className={styles.heroContent}>
            <h1>Afiax Solution Patterns</h1>
            <p className={styles.heroText}>
              Afiax is not a single point product. It is a platform for delivering healthcare solutions across provider
              networks, patient-facing services, interoperability programs, payer workflows, and regulated
              multi-tenant environments. Kenya is the first country-pack implementation, but the solution model is
              broader than Kenya alone.
            </p>
          </div>
        </Jumbotron>

        <Jumbotron>
          <div className={styles.heroContent}>
            <h2>
              <Link to="/solutions/custom-ehr">Provider and Clinical Operations Platforms</Link>
            </h2>
            <p className={styles.heroText}>
              Build provider-facing systems for clinics, hospitals, specialty programs, and distributed networks using
              the canonical Afiax core. This includes charting, order workflows, task management, documents, referrals,
              and operational dashboards.
            </p>
          </div>
          <div className={styles.heroImage}>
            <img
              src="/img/hero/hero-custom-apps-and-portals-square.webp"
              alt="Provider and clinical applications"
              width="450"
              height="450"
            />
          </div>
        </Jumbotron>

        <Jumbotron>
          <div className={styles.heroContent}>
            <h2>
              <Link to="/solutions/patient-portal">Patient Experience and Digital Front Door</Link>
            </h2>
            <p className={styles.heroText}>
              Build white-label patient experiences for registration, appointments, messaging, records access, remote
              care, and program participation. These experiences can sit alongside telemedicine and outreach models on
              the same platform foundation.
            </p>
          </div>
          <div className={styles.heroImage}>
            <img
              src="/img/hero/hero-patient-allergies.webp"
              alt="Patient-facing digital services"
              width="450"
              height="450"
            />
          </div>
        </Jumbotron>

        <Jumbotron>
          <div className={styles.heroContent}>
            <h2>
              <Link to="/solutions/provider-portal">Referral, Partner, and Network Coordination</Link>
            </h2>
            <p className={styles.heroText}>
              Support referring clinicians, diagnostic partners, payers, and other network participants with secure
              portals and APIs. These solutions are useful in specialty care, diagnostics, care coordination, and
              distributed service delivery models.
            </p>
          </div>
          <div className={styles.heroImage}>
            <img
              src="/img/hero/hero-specialty-clinic-square.webp"
              alt="Partner and referral workflows"
              width="450"
              height="450"
            />
          </div>
        </Jumbotron>

        <Jumbotron>
          <div className={styles.heroContent}>
            <h2>
              <Link to="/solutions/interoperability">Interoperability, Country Exchange, and National Programs</Link>
            </h2>
            <p className={styles.heroText}>
              Use Afiax as the interoperability operating layer for registries, payer services, public health exchange,
              HL7/FHIR connectivity, and country-specific workflows packaged through country packs.
            </p>
            <ul className={styles.heroText}>
              <li>
                <Link style={{ fontWeight: 'bold' }} to="/solutions/agent">
                  Afiax Agent
                </Link>
                : secure bridge for HL7, DICOM, and other local-network integrations
              </li>
              <li>Afiax Bots: auditable automation for external APIs, messaging, and reconciliation</li>
              <li>Country packs: market-specific registries, eligibility, exchange, and claims logic</li>
            </ul>
          </div>
          <div className={styles.heroImage}>
            <img
              src="/img/hero/hero-empi-square.webp"
              alt="Interoperability and exchange"
              width="450"
              height="450"
            />
          </div>
        </Jumbotron>

        <Jumbotron>
          <div className={styles.heroContent}>
            <h2>
              <Link to="/solutions/compliance-security/tenanting-access">Sovereign Multi-Tenant Delivery</Link>
            </h2>
            <p className={styles.heroText}>
              Afiax is designed for customers that need controlled isolation across organizations, countries, and
              environments. Shared SaaS, dedicated runtime, managed PaaS, and sovereign deployments all sit within the
              broader product strategy.
            </p>
          </div>
          <div className={styles.heroImage}>
            <img
              src="/img/hero/hero-compliance-and-security-square.webp"
              alt="Multi-tenant and sovereign deployment"
              width="450"
              height="450"
            />
          </div>
        </Jumbotron>
      </Container>
    </Layout>
  );
}
