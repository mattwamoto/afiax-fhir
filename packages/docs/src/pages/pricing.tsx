import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import { IconChecklist, IconCloudLock, IconExchange, IconSettings } from '@tabler/icons-react';
import { JSX } from 'react';
import { Card } from '../components/Card';
import { CardContainer } from '../components/CardContainer';
import { Container } from '../components/Container';
import { Feature, FeatureGrid } from '../components/landing/FeatureGrid';
import { Jumbotron } from '../components/landing/Jumbotron';
import { Section } from '../components/landing/Section';
import styles from './pricing.module.css';

export default function PricingPage(): JSX.Element {
  return (
    <Layout title="Pricing">
      <Container>
        <div className={styles.pricing}>
          <h1>Pricing and engagement</h1>
          <p style={{ maxWidth: 720, margin: '20px auto' }}>
            Afiax pricing depends on the shape of the implementation. The platform combines a Medplum-based clinical
            core, country-pack delivery, integration work, and optional managed operations, so the right commercial
            model depends on what you are actually deploying.
          </p>
          <p style={{ maxWidth: 720, margin: '20px auto' }}>
            For commercial discussions, contact <Link href="mailto:info@afiax.africa">info@afiax.africa</Link> or
            visit <Link href="https://www.afiax.africa">www.afiax.africa</Link>.
          </p>
        </div>

        <Jumbotron>
          <div>
            <h2>How Afiax is typically scoped</h2>
            <p>
              Most Afiax work is priced as a platform engagement rather than a generic self-service plan. Scope usually
              starts with the clinical core, then adds the first country pack, production connectors, and tenant- or
              program-specific rollout requirements.
            </p>
            <p>
              <Link href="/contact">Talk to Afiax</Link>
            </p>
          </div>
          <div>
            <img src="/img/infrastructure-jumbotron.svg" alt="Afiax pricing and engagement model" width="488" height="384" />
          </div>
        </Jumbotron>

        <Section>
          <CardContainer>
            <Card>
              <h3>Platform foundation</h3>
              <p>
                Covers the Medplum-based clinical core, canonical data model, access control, auditability, and
                administrative tooling needed to stand up the shared platform.
              </p>
            </Card>
            <Card>
              <h3>Country-pack delivery</h3>
              <p>
                Covers country-specific profiles, terminology, mappings, connector contracts, and documentation. Kenya
                is the first reference pack in this model.
              </p>
            </Card>
            <Card>
              <h3>Managed operations</h3>
              <p>
                Covers hosting model, observability, support expectations, release management, and operational
                governance for production deployments.
              </p>
            </Card>
          </CardContainer>
        </Section>

        <Section>
          <FeatureGrid columns={2}>
            <Feature title="Deployment model" icon={<IconCloudLock />}>
              Sovereign hosting, managed cloud, or self-hosted enterprise environments materially change scope and
              support requirements.
            </Feature>
            <Feature title="Integration breadth" icon={<IconExchange />}>
              The number and complexity of payer, registry, ERP, diagnostics, and partner integrations are major
              pricing drivers.
            </Feature>
            <Feature title="Workflow complexity" icon={<IconSettings />}>
              Country-pack rollout, approvals, automation, referrals, and multi-tenant configuration all affect the
              level of implementation work required.
            </Feature>
            <Feature title="Assurance and support" icon={<IconChecklist />}>
              Audit needs, reconciliation tooling, delivery timelines, and support SLAs should be agreed explicitly as
              part of the engagement.
            </Feature>
          </FeatureGrid>
        </Section>

        <Section>
          <CardContainer>
            <Card>
              <h3>Best fit for early deployments</h3>
              <p>
                Start with one country, one high-value operational spine, and a small set of production-grade
                integrations. That approach proves the platform before expanding into broader enterprise services.
              </p>
            </Card>
            <Card>
              <h3>Best fit for enterprise rollouts</h3>
              <p>
                Larger health systems, insurers, ministries, and regional delivery networks generally need a phased
                program covering platform setup, country-pack implementation, rollout support, and long-term
                operations.
              </p>
            </Card>
            <Card>
              <h3>Best next step</h3>
              <p>
                Share the target country, deployment model, integration list, and operational goals. That is enough to
                turn the architecture into a realistic commercial scope.
              </p>
            </Card>
          </CardContainer>
        </Section>
      </Container>
    </Layout>
  );
}
