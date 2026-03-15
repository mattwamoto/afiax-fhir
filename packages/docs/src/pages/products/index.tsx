// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import { JSX } from 'react';
import { Container } from '../../components/Container';
import { Jumbotron } from '../../components/landing/Jumbotron';
import styles from '../about.module.css';

export default function ProductsPage(): JSX.Element {
  return (
    <Layout title="Platform Capabilities">
      <Container>
        <Jumbotron>
          <div className={styles.heroContent}>
            <h1>Afiax Platform Capabilities</h1>
            <p className={styles.heroText}>
              Afiax FHIR is the clinical core inside Afiax Enterprise. The product surface is broader than a single
              app or one country integration: it spans clinical operations, interoperability, digital care services,
              analytics, developer tooling, and sovereign deployment models.
            </p>
          </div>
        </Jumbotron>

        <Jumbotron>
          <div className={styles.heroContent}>
            <h2>
              <Link to="/products/integration">Clinical Core and Interoperability Spine</Link>
            </h2>
            <p className={styles.heroText}>
              The Afiax platform starts with a canonical FHIR data model, auditable workflow engine, and internal
              operations layer that make clinical and operational data reusable across products, partners, and markets.
            </p>
            <ul>
              <li>
                <strong>FHIR-native source of truth:</strong> patients, encounters, coverage, tasks, documents,
                communications, consent, audit, and provenance on one shared model.
              </li>
              <li>
                <strong>Country-pack integration layer:</strong> national registries, payer services, exchange
                connectors, and regulatory mappings stay outside the core.
              </li>
              <li>
                <strong>Event-driven orchestration:</strong> Bots, subscriptions, and custom operations support
                retry-safe automation and external exchange.
              </li>
              <li>
                <strong>Partner-ready APIs:</strong> provider apps, patient apps, and partner systems inherit the same
                normalized platform contracts.
              </li>
            </ul>
          </div>
          <div className={styles.heroImage}>
            <img
              src="/img/hero/hero-interop-and-data-platform-square.webp"
              alt="Clinical data and interoperability"
              width="450"
              height="450"
            />
          </div>
        </Jumbotron>

        <Jumbotron>
          <div className={styles.heroContent}>
            <h2>Digital Care and Workflow Services</h2>
            <p className={styles.heroText}>
              Afiax uses the same platform core to power provider workflows, patient engagement, remote-care services,
              and coordinated operations across facilities and programs.
            </p>
            <ul>
              <li>
                <strong>
                  <Link to="/products/questionnaires">Questionnaires and structured data capture</Link>
                </strong>
                : intake, screening, program enrollment, assessments, and operational forms.
              </li>
              <li>
                <strong>
                  <Link to="/products/scheduling">Scheduling and access coordination</Link>
                </strong>
                : in-person, outreach, and virtual-care scheduling workflows across providers and locations.
              </li>
              <li>
                <strong>
                  <Link to="/products/communications">Communications and care coordination</Link>
                </strong>
                : secure messaging, reminders, referrals, and partner notifications.
              </li>
              <li>
                <strong>
                  <Link to="/products/careplans">Care plans and program pathways</Link>
                </strong>
                : longitudinal care coordination for clinics, specialty programs, and public health initiatives.
              </li>
            </ul>
          </div>
          <div className={styles.heroImage}>
            <img
              src="/img/hero/hero-patient-allergies.webp"
              alt="Digital care workflows"
              width="450"
              height="450"
            />
          </div>
        </Jumbotron>

        <Jumbotron>
          <div className={styles.heroContent}>
            <h2>
              <Link to="/products/billing">Revenue Cycle and Payer Operations</Link>
            </h2>
            <p className={styles.heroText}>
              Billing is treated as part of a broader payer and reimbursement capability set. Afiax supports coverage,
              eligibility, claims, reconciliation, and localized payer exchange through country packs rather than
              hard-coding one reimbursement model into the platform.
            </p>
            <ul>
              <li>
                <strong>Coverage and eligibility:</strong> normalize public and private payer checks behind internal
                platform operations.
              </li>
              <li>
                <strong>Country-specific claims:</strong> implement localized submission rules through pack-specific
                mappings and connectors.
              </li>
              <li>
                <strong>Operational traceability:</strong> correlate reimbursement outcomes back to canonical clinical
                and financial records.
              </li>
            </ul>
          </div>
          <div className={styles.heroImage}>
            <img
              src="/img/hero/hero-charts-and-graphs.webp"
              alt="Revenue cycle and analytics"
              width="450"
              height="450"
            />
          </div>
        </Jumbotron>

        <Jumbotron>
          <div className={styles.heroContent}>
            <h2>
              <Link to="/products/bots">Automation and Developer Platform</Link>
            </h2>
            <p className={styles.heroText}>
              Afiax is also a platform for builders. Teams can create internal operations, country-pack connectors,
              tenant workflows, and white-label applications without forking the core.
            </p>
            <ul>
              <li>
                <strong>Bots and operations:</strong> implement workflow logic, external calls, reconciliation, and
                automation.
              </li>
              <li>
                <strong>SDKs and React components:</strong> accelerate provider, patient, and admin application
                development.
              </li>
              <li>
                <strong>Tenant and environment controls:</strong> support dev, UAT, and production rollout per
                organization and market.
              </li>
              <li>
                <strong>Country-pack contracts:</strong> let Kenya and future markets plug into the same platform
                semantics.
              </li>
            </ul>
          </div>
          <div className={styles.heroImage}>
            <img src="/img/hero/hero-homepage.webp" alt="Developer platform" width="394" height="450" />
          </div>
        </Jumbotron>

        <Jumbotron>
          <div className={styles.heroContent}>
            <h2>Deployment, Governance, and Sovereign Operations</h2>
            <p className={styles.heroText}>
              Afiax is designed for African healthcare delivery realities, where data sovereignty, variable
              infrastructure maturity, and multi-organization governance need to be first-class product concerns.
            </p>
            <ul>
              <li>
                <strong>Shared SaaS and dedicated runtime models:</strong> serve customers with different scale and
                isolation requirements.
              </li>
              <li>
                <strong>Managed PaaS patterns:</strong> operate the platform inside customer or country-specific cloud
                footprints when needed.
              </li>
              <li>
                <strong>Audit, provenance, and access control:</strong> make every workflow traceable and governable.
              </li>
              <li>
                <strong>Website and market-facing story:</strong> the broader company vision lives at{' '}
                <a href="https://www.afiax.africa">www.afiax.africa</a>, while these docs describe how the platform is
                built.
              </li>
            </ul>
          </div>
          <div className={styles.heroImage}>
            <img
              src="/img/hero/hero-compliance-and-security-square.webp"
              alt="Security and governance"
              width="450"
              height="450"
            />
          </div>
        </Jumbotron>
      </Container>
    </Layout>
  );
}
