import type { Metadata } from 'next';
import { Navbar } from '@/components/marketing/Navbar';
import { Hero } from '@/components/marketing/Hero';
import { Services } from '@/components/marketing/Services';
import { Pricing } from '@/components/marketing/Pricing';
import { Portfolio } from '@/components/marketing/Portfolio';
import { About } from '@/components/marketing/About';
import { FAQ } from '@/components/marketing/FAQ';
import { CTASection } from '@/components/marketing/CTASection';
import { Footer } from '@/components/marketing/Footer';

const TITLES: Record<string, string> = {
  en: 'AZU Digital Studio',
  es: 'AZU Digital Studio',
  pt: 'AZU Digital Studio',
};

const DESCRIPTIONS: Record<string, string> = {
  en: 'Social media management, video editing and web development for entrepreneurs — in English, Spanish & Portuguese.',
  es: 'Gestión de redes sociales, edición de video y desarrollo web para emprendedores — en inglés, español y portugués.',
  pt: 'Gestão de redes sociais, edição de vídeo e desenvolvimento web para empreendedores — em inglês, espanhol e português.',
};

const OG_LOCALES: Record<string, string> = { en: 'en_US', es: 'es_ES', pt: 'pt_BR' };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const description = DESCRIPTIONS[locale] ?? DESCRIPTIONS.en;
  return {
    title: {
      absolute: 'AZU Digital Studio',
    },
    description,
    openGraph: {
      title: 'AZU Digital Studio',
      description,
      locale: OG_LOCALES[locale] ?? 'en_US',
      alternateLocale: Object.values(OG_LOCALES).filter((l) => l !== OG_LOCALES[locale]),
    },
    alternates: {
      canonical: `/${locale}`,
      languages: { en: '/en', es: '/es', pt: '/pt' },
    },
  };
}

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Pricing />
        <Portfolio />
        <About />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
