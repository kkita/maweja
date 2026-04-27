const logoPath = "/maweja-icon.png";
import { useEffect, useRef } from "react";
import { palette, tints } from "../design-system/tokens";

const APP_URL = window.location.origin;
const M = palette.mockup;
const T = tints;

function PhoneMockup({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative mx-auto" style={{ width: "240px" }}>
      <div
        className="relative rounded-[2.5rem] overflow-hidden shadow-2xl"
        style={{
          width: "240px",
          height: "500px",
          background: M.phoneBezel,
          border: `8px solid ${M.phoneFrame}`,
          boxShadow: `0 0 0 2px ${M.phoneEdge}, 0 30px 80px ${T.black(0.8)}, inset 0 0 20px ${T.white(0.03)}`,
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
          style={{
            width: "80px",
            height: "22px",
            background: M.phoneBezel,
            borderRadius: "0 0 14px 14px",
          }}
        />
        <iframe
          src={src}
          title={title}
          className="w-full h-full border-0"
          style={{ borderRadius: "2rem", pointerEvents: "none" }}
        />
      </div>
      <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-4 font-medium tracking-wide">{title}</p>
    </div>
  );
}

function LaptopMockup({ src }: { src: string }) {
  return (
    <div className="relative mx-auto" style={{ width: "600px" }}>
      <div
        className="relative rounded-t-xl overflow-hidden"
        style={{
          width: "600px",
          height: "375px",
          background: M.laptopScreen,
          border: `10px solid ${M.laptopBezel}`,
          borderBottom: "none",
          borderRadius: "16px 16px 0 0",
          boxShadow: `0 -20px 60px ${T.black(0.5)}`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3"
          style={{ height: "28px", background: M.laptopBezel }}
        >
          <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-80" />
          <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
        </div>
        <iframe
          src={src}
          title="Admin"
          className="w-full border-0"
          style={{ height: "calc(100% - 28px)", marginTop: "28px", pointerEvents: "none" }}
        />
      </div>
      <div
        style={{
          width: "640px",
          height: "14px",
          background: M.laptopBezel,
          borderRadius: "0 0 8px 8px",
          margin: "0 auto",
        }}
      />
      <div
        style={{
          width: "700px",
          height: "8px",
          background: M.laptopBase,
          borderRadius: "0 0 16px 16px",
          margin: "0 auto",
        }}
      />
    </div>
  );
}

function FeatureBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: T.brand(0.08), border: `1px solid ${T.brand(0.2)}` }}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-gray-200 text-sm font-medium">{text}</span>
    </div>
  );
}

function SectionDivider({ number, label }: { number: string; label: string }) {
  return (
    <div
      className="w-full flex items-center gap-6 py-16 px-12"
      style={{ background: `linear-gradient(90deg, ${T.brand(0.15)} 0%, transparent 100%)` }}
    >
      <span className="font-black text-red-600" style={{ fontSize: "5vw", lineHeight: 1 }}>{number}</span>
      <div className="w-px h-16 bg-red-700 opacity-40" />
      <span className="text-white font-bold tracking-wider uppercase text-2xl">{label}</span>
    </div>
  );
}

export default function PresentationPage() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "MAWEJA — Présentation Officielle";
  }, []);

  return (
    <div
      ref={scrollRef}
      className="min-h-screen overflow-y-auto"
      style={{
        background: M.pageBg1,
        color: M.textOn,
        fontFamily: "'Inter', sans-serif",
        scrollBehavior: "smooth",
      }}
    >
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ minHeight: "100vh", padding: "6vh 4vw" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              `radial-gradient(ellipse 70% 60% at 50% 0%, ${T.brand(0.18)} 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 80%, ${T.brand(0.08)} 0%, transparent 70%)`,
          }}
        />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: `linear-gradient(${T.brand(0.3)} 1px, transparent 1px), linear-gradient(90deg, ${T.brand(0.3)} 1px, transparent 1px)`, backgroundSize: "60px 60px" }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <img
            src={logoPath}
            alt="MAWEJA Logo"
            className="object-contain drop-shadow-2xl"
            style={{ width: "clamp(120px, 14vw, 200px)", height: "auto" }}
          />

          <div>
            <h1
              className="font-black tracking-tighter leading-none"
              style={{ fontSize: "clamp(4rem, 10vw, 9rem)", color: M.textOn }}
            >
              MAWEJA
            </h1>
            <p
              className="font-light tracking-[0.4em] uppercase mt-2"
              style={{ fontSize: "clamp(0.8rem, 1.5vw, 1.2rem)", color: T.brand(0.9) }}
            >
              L'Écosystème de Livraison & Services de Kinshasa
            </p>
          </div>

          <div
            className="flex items-center gap-4 mt-4 flex-wrap justify-center"
          >
            {["App Client", "App Agent", "Admin Dashboard"].map((app, i) => (
              <div
                key={i}
                className="px-5 py-2 rounded-full text-sm font-semibold tracking-wide"
                style={{
                  background: i === 0 ? T.brand(0.15) : i === 1 ? T.black(0.6) : T.brand(0.25),
                  border: `1px solid ${i === 1 ? T.white(0.15) : T.brand(0.4)}`,
                  color: i === 1 ? T.white(0.7) : M.textOn,
                }}
              >
                {app}
              </div>
            ))}
          </div>

          <p
            className="max-w-xl leading-relaxed"
            style={{ color: T.white(0.55), fontSize: "clamp(0.9rem, 1.4vw, 1.1rem)" }}
          >
            Une plateforme production-grade complète — commandes de repas, services à domicile,
            gestion d'agents et tableau de bord analytique en temps réel.
          </p>

          <div
            className="flex gap-8 mt-4 flex-wrap justify-center"
          >
            {[
              { n: "3", label: "Applications" },
              { n: "10+", label: "Restaurants" },
              { n: "100+", label: "Plats" },
              { n: "2", label: "Catégories de services" },
            ].map(({ n, label }) => (
              <div key={label} className="text-center">
                <div className="font-black text-red-500" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>{n}</div>
                <div className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <span className="text-xs tracking-widest uppercase text-gray-500 dark:text-gray-400">Défiler</span>
          <div className="w-px h-12 bg-gradient-to-b from-red-600 to-transparent" />
        </div>
      </section>

      {/* ─── OVERVIEW ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-8 text-center" style={{ background: M.pageBg2 }}>
        <h2
          className="font-black mb-4 tracking-tight"
          style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
        >
          Un écosystème complet
        </h2>
        <p className="text-gray-400 dark:text-gray-500 max-w-2xl mx-auto mb-16" style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)" }}>
          Trois interfaces distinctes, un seul backend robuste. Tout est interconnecté en temps réel.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              icon: "📱",
              title: "App Client",
              color: palette.chart.primary,
              desc: "Commander des repas et services depuis son mobile en quelques secondes.",
              features: ["Restaurants & menus", "Services à domicile", "Suivi en temps réel", "Paiement & promos"],
            },
            {
              icon: "🛵",
              title: "App Agent",
              color: M.laptopScreen,
              border: M.phoneEdge,
              desc: "Interface optimisée pour les agents — accepter, naviguer, livrer.",
              features: ["Tableau de bord online/offline", "Gestion des livraisons", "Revenus & historique", "Chat intégré"],
            },
            {
              icon: "⚙️",
              title: "Admin Dashboard",
              color: M.brandDeep,
              desc: "Contrôle total sur la plateforme — commandes, drivers, analytics.",
              features: ["Gestion des commandes", "Gestion des agents", "Analytics & rapports", "Marketing & promos"],
            },
          ].map(({ icon, title, color, border, desc, features }) => (
            <div
              key={title}
              className="rounded-2xl p-8 flex flex-col gap-4 text-left"
              style={{
                background: `${color}22`,
                border: `1px solid ${border || color}44`,
              }}
            >
              <div className="text-4xl">{icon}</div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed">{desc}</p>
              <ul className="flex flex-col gap-2 mt-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─── APP CLIENT ───────────────────────────────────────────────────── */}
      <SectionDivider number="01" label="Application Client" />

      <section className="py-16 px-8" style={{ background: M.pageBg1 }}>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 flex flex-col gap-8">
            <div>
              <span className="text-red-500 text-xs font-bold tracking-widest uppercase">App Client</span>
              <h2
                className="font-black mt-2 tracking-tight leading-none"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
              >
                Commandez en
                <br />
                <span className="text-red-500">3 secondes</span>
              </h2>
              <p className="text-gray-400 dark:text-gray-500 mt-4 leading-relaxed" style={{ fontSize: "clamp(0.85rem, 1.3vw, 1rem)" }}>
                Interface mobile-first optimisée pour les habitants de Kinshasa.
                Multilingue (Français / Anglais), géolocalisation intégrée.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FeatureBadge icon="🏠" text="Page d'accueil avec restaurants" />
              <FeatureBadge icon="🛒" text="Panier intelligent" />
              <FeatureBadge icon="💳" text="Paiement Cash ou Mobile Money" />
              <FeatureBadge icon="🎁" text="Codes promo (MAWEJA10, MAWEJA20...)" />
              <FeatureBadge icon="📍" text="Suivi commande en temps réel" />
              <FeatureBadge icon="💇" text="Services Coiffure & Beauté" />
              <FeatureBadge icon="🌐" text="Bilingue FR / EN" />
              <FeatureBadge icon="🔔" text="Notifications push" />
              <FeatureBadge icon="💰" text="Portefeuille numérique" />
              <FeatureBadge icon="💬" text="Chat avec le support" />
            </div>
          </div>

          <div className="flex gap-6 flex-wrap justify-center">
            <PhoneMockup src={`${APP_URL}/`} title="Accueil" />
            <PhoneMockup src={`${APP_URL}/services`} title="Services" />
          </div>
        </div>
      </section>

      {/* ─── APP DRIVER ───────────────────────────────────────────────────── */}
      <SectionDivider number="02" label="Application Agent" />

      <section className="py-16 px-8" style={{ background: M.pageBg2 }}>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row-reverse gap-16 items-center">
          <div className="flex-1 flex flex-col gap-8">
            <div>
              <span className="text-gray-400 dark:text-gray-500 text-xs font-bold tracking-widest uppercase">App Agent</span>
              <h2
                className="font-black mt-2 tracking-tight leading-none"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
              >
                Maximisez vos
                <br />
                <span style={{ color: M.textMuted }}>revenus</span>
              </h2>
              <p className="text-gray-400 dark:text-gray-500 mt-4 leading-relaxed" style={{ fontSize: "clamp(0.85rem, 1.3vw, 1rem)" }}>
                Interface conçue pour les agents Maweja. Simple, rapide et efficace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FeatureBadge icon="🟢" text="Mode en ligne / hors ligne" />
              <FeatureBadge icon="📦" text="Gestion des commandes" />
              <FeatureBadge icon="💵" text="Suivi des revenus journaliers" />
              <FeatureBadge icon="📊" text="Historique des livraisons" />
              <FeatureBadge icon="🗺️" text="Navigation intégrée" />
              <FeatureBadge icon="⭐" text="Système de notation" />
              <FeatureBadge icon="💬" text="Chat avec les clients" />
              <FeatureBadge icon="📋" text="Détails des commandes" />
            </div>
          </div>

          <div className="flex gap-6 flex-wrap justify-center">
            <PhoneMockup src={`${APP_URL}/driver/login`} title="Login Agent" />
            <PhoneMockup src={`${APP_URL}/driver/dashboard`} title="Dashboard" />
          </div>
        </div>
      </section>

      {/* ─── ADMIN ────────────────────────────────────────────────────────── */}
      <SectionDivider number="03" label="Admin Dashboard" />

      <section className="py-16 px-8" style={{ background: M.pageBg1 }}>
        <div className="max-w-6xl mx-auto flex flex-col gap-12 items-center">
          <div className="text-center max-w-3xl">
            <span className="text-red-500 text-xs font-bold tracking-widest uppercase">Admin Dashboard</span>
            <h2
              className="font-black mt-2 tracking-tight leading-none"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              Contrôle total de la
              <br />
              <span className="text-red-500">plateforme</span>
            </h2>
            <p className="text-gray-400 dark:text-gray-500 mt-4 leading-relaxed" style={{ fontSize: "clamp(0.85rem, 1.3vw, 1rem)" }}>
              Dashboard analytique complet avec gestion en temps réel de toute l'opération MAWEJA.
            </p>
          </div>

          <div className="w-full overflow-hidden">
            <LaptopMockup src={`${APP_URL}/admin/login`} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full max-w-4xl">
            <FeatureBadge icon="📊" text="Analytics en temps réel" />
            <FeatureBadge icon="🍔" text="Gestion restaurants" />
            <FeatureBadge icon="🛵" text="Gestion des agents" />
            <FeatureBadge icon="✅" text="Vérification documents" />
            <FeatureBadge icon="📋" text="Gestion commandes" />
            <FeatureBadge icon="💅" text="Gestion services" />
            <FeatureBadge icon="🎯" text="Marketing & promos" />
            <FeatureBadge icon="💸" text="Module Finances" />
            <FeatureBadge icon="🔔" text="Notifications push" />
            <FeatureBadge icon="💬" text="Chat & support" />
            <FeatureBadge icon="📢" text="Publicités" />
            <FeatureBadge icon="⚙️" text="Paramètres système" />
          </div>
        </div>
      </section>

      {/* ─── STACK TECHNIQUE ─────────────────────────────────────────────── */}
      <section className="py-20 px-8" style={{ background: M.pageBg2 }}>
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-red-500 text-xs font-bold tracking-widest uppercase">Stack Technique</span>
          <h2
            className="font-black mt-2 mb-12 tracking-tight"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Construit pour la production
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { cat: "Frontend", items: ["React 18", "TypeScript", "TailwindCSS", "Wouter"] },
              { cat: "Backend", items: ["Node.js", "Express", "PostgreSQL", "Drizzle ORM"] },
              { cat: "Temps Réel", items: ["WebSockets", "TanStack Query", "React Query", "Cache intelligente"] },
              { cat: "Sécurité", items: ["Sessions chiffrées", "Auth multi-rôles", "Cookies sécurisés", "Validation Zod"] },
            ].map(({ cat, items }) => (
              <div
                key={cat}
                className="rounded-2xl p-6 text-left"
                style={{ background: T.brand(0.06), border: `1px solid ${T.brand(0.15)}` }}
              >
                <h4 className="text-red-400 font-bold text-sm uppercase tracking-widest mb-4">{cat}</h4>
                <ul className="flex flex-col gap-2">
                  {items.map((i) => (
                    <li key={i} className="text-gray-300 text-sm flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-red-600 flex-shrink-0" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CODES PROMO & FONCTIONNALITÉS CLÉS ─────────────────────────── */}
      <section className="py-20 px-8" style={{ background: M.pageBg3 }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-red-500 text-xs font-bold tracking-widest uppercase">Codes Promo</span>
              <h2
                className="font-black mt-2 mb-8 tracking-tight"
                style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)" }}
              >
                Fidélisation intégrée
              </h2>
              <div className="flex flex-col gap-4">
                {[
                  { code: "MAWEJA10", desc: "Réduction de 10% sur la commande", color: palette.chart.primary },
                  { code: "MAWEJA20", desc: "Réduction de 20% sur la commande", color: palette.chart.primary },
                  { code: "LIVRAISON", desc: "Livraison gratuite offerte",       color: M.successCode },
                  { code: "BIENVENUE", desc: "$2000 de réduction à l'inscription", color: M.warningCode },
                ].map(({ code, desc, color }) => (
                  <div
                    key={code}
                    className="flex items-center gap-4 rounded-xl p-4"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                  >
                    <code
                      className="font-mono font-black text-sm px-3 py-1.5 rounded-lg"
                      style={{ background: `${color}25`, color, letterSpacing: "0.1em" }}
                    >
                      {code}
                    </code>
                    <span className="text-gray-300 text-sm">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-red-500 text-xs font-bold tracking-widest uppercase">Paiements</span>
              <h2
                className="font-black mt-2 mb-8 tracking-tight"
                style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)" }}
              >
                Méthodes de paiement
              </h2>
              <div className="flex flex-col gap-4">
                {[
                  { icon: "💵", name: "Cash à la livraison", desc: "Payez en espèces à la réception" },
                  { icon: "📱", name: "Mobile Money", desc: "M-Pesa, Airtel Money" },
                  { icon: "🏦", name: "Virement bancaire", desc: "Transfert depuis votre banque" },
                  { icon: "💳", name: "Carte bancaire", desc: "Visa, Mastercard acceptés" },
                ].map(({ icon, name, desc }) => (
                  <div
                    key={name}
                    className="flex items-center gap-4 rounded-xl p-4"
                    style={{ background: T.white(0.04), border: `1px solid ${T.white(0.08)}` }}
                  >
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">{name}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-8" style={{ background: M.pageBg2 }}>
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-red-500 text-xs font-bold tracking-widest uppercase">Services à domicile</span>
          <h2
            className="font-black mt-2 mb-12 tracking-tight"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Plus qu'un service de livraison
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { icon: "💇", name: "Coiffure", sub: "10 prestations disponibles" },
              { icon: "💅", name: "Pedicure & Manicure", sub: "10 prestations disponibles" },
              { icon: "🚗", name: "Transport", sub: "Sur demande" },
              { icon: "🏨", name: "Hôtellerie", sub: "Réservations" },
              { icon: "🧹", name: "Nettoyage", sub: "Domicile & bureau" },
              { icon: "🎉", name: "Événementiel", sub: "Organisation d'événements" },
              { icon: "🔧", name: "Réparation", sub: "Électronique & plomberie" },
              { icon: "📦", name: "Coursier", sub: "Livraisons express" },
            ].map(({ icon, name, sub }) => (
              <div
                key={name}
                className="rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
                style={{ background: T.brand(0.06), border: `1px solid ${T.brand(0.12)}` }}
              >
                <span className="text-3xl">{icon}</span>
                <p className="text-white font-semibold text-sm">{name}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SIGNATURE ────────────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center justify-center text-center overflow-hidden py-24 px-8"
        style={{ background: M.pageBg3 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              `radial-gradient(ellipse 60% 50% at 50% 100%, ${T.brand(0.12)} 0%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <img
            src={logoPath}
            alt="MAWEJA"
            className="object-contain opacity-80"
            style={{ width: "clamp(60px, 8vw, 100px)" }}
          />

          <h2
            className="font-black tracking-tighter"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: M.textOn }}
          >
            MAWEJA
          </h2>

          <div
            className="w-24 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${palette.chart.primary}, transparent)` }}
          />

          <p className="text-gray-400 dark:text-gray-500 max-w-lg" style={{ fontSize: "clamp(0.85rem, 1.3vw, 1rem)" }}>
            La plateforme de référence pour la livraison de repas et services à domicile à Kinshasa, République Démocratique du Congo.
          </p>

          <div
            className="mt-6 flex flex-col items-center gap-2 rounded-2xl px-10 py-6"
            style={{ background: T.brand(0.08), border: `1px solid ${T.brand(0.25)}` }}
          >
            <p className="text-white font-black" style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)" }}>
              Khevin Andrew Kita
            </p>
            <p className="text-red-400 font-semibold tracking-widest text-sm uppercase">Développeur</p>
            <p className="text-gray-400 dark:text-gray-500 font-mono text-sm mt-1">0802540138</p>
          </div>

          <p
            className="text-gray-700 dark:text-gray-200 text-xs tracking-widest uppercase mt-8"
          >
            © 2026 MAWEJA · Ed Corporation · Made with ❤️ in Kinshasa
          </p>
        </div>
      </section>
    </div>
  );
}
