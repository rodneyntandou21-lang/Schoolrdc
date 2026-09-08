// ============================================================
// LANDING — Page vitrine publique (pré-connexion)
// ============================================================
import React from 'react';
import {
  GraduationCap, QrCode, Wallet, FileText, Smartphone, BarChart3,
  MessageCircle, ShieldCheck, Building2, ArrowRight, CheckCircle2,
  Sheet, History, Menu, X,
} from 'lucide-react';

interface LandingProps {
  onLogin: () => void;
  onRegister: () => void;
}

const CONTACT_EMAIL = 'rodneyntandou21@gmail.com';
const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Demande de démo GestioSchool')}`;

const FEATURES: { icon: React.ElementType; title: string; description: string; points: string[] }[] = [
  {
    icon: QrCode,
    title: 'Cartes scolaires & présences par QR code',
    description: "Chaque élève reçoit une carte avec QR code unique. Le scan à l'entrée ou à la sortie met à jour la présence en temps réel.",
    points: ['Cartes scolaires personnalisées', "Scan d'entrée et de sortie", 'Historique de présence consultable'],
  },
  {
    icon: Wallet,
    title: 'Paiements & recouvrement',
    description: "Enregistrez les versements de scolarité, générez les reçus et suivez les impayés depuis un même écran.",
    points: ['Suivi des paiements par élève', 'Reçus vérifiables', 'Relances de recouvrement ciblées'],
  },
  {
    icon: FileText,
    title: 'Notes & bulletins',
    description: "Saisissez les notes par classe et matière, GestioSchool calcule les moyennes et prépare les bulletins.",
    points: ['Saisie des notes par enseignant', 'Gestion académique par classe', 'Bulletins prêts à imprimer'],
  },
  {
    icon: Smartphone,
    title: 'Portail Parents',
    description: "Les parents suivent la scolarité de leur enfant depuis leur téléphone : notes, présences, reçus, annonces.",
    points: ['Tableau de bord dédié aux parents', 'Consultation des notes et reçus', 'Badges et suivi de présence'],
  },
  {
    icon: MessageCircle,
    title: 'Messagerie & annonces',
    description: "Communiquez directement avec les parents par message ou par annonce diffusée à toute l'école.",
    points: ['Messagerie école ↔ parents', "Annonces générales de l'établissement"],
  },
  {
    icon: BarChart3,
    title: 'Analyses & tableaux de bord',
    description: "Visualisez les indicateurs clés de votre établissement (effectifs, paiements, présence) en un coup d'œil.",
    points: ['Tableaux de bord en temps réel', "Historique complet des activités"],
  },
  {
    icon: Sheet,
    title: 'Import / Export Excel',
    description: "Importez vos listes d'élèves existantes ou exportez vos données pour vos démarches administratives.",
    points: ['Import Excel en masse', 'Export des données pour vos rapports'],
  },
  {
    icon: History,
    title: 'Historique & traçabilité',
    description: "Chaque action importante reste consultable : qui a fait quoi, et quand.",
    points: ['Journal des activités', 'Vérification des reçus'],
  },
];

const NavLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
    {children}
  </a>
);

export const Landing: React.FC<LandingProps> = ({ onLogin, onRegister }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-amber-500 focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
      >
        Aller au contenu
      </a>

      {/* ── NAV ── */}
      <header className="gradient-hero sticky top-0 z-40 border-b border-white/5">
        <nav aria-label="Navigation principale" className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="font-black text-white tracking-tight text-lg">GestioSchool</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <NavLink href="#fonctionnalites">Fonctionnalités</NavLink>
            <NavLink href="#securite">Sécurité</NavLink>
            <NavLink href="#parents">Espace Parents</NavLink>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button onClick={onLogin} className="btn btn-ghost" style={{ color: '#fff' }}>Se connecter</button>
            <a href={CONTACT_HREF} className="btn btn-primary">Demander une démo</a>
          </div>

          <button
            className="lg:hidden text-white p-2"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="lg:hidden px-5 pb-5 flex flex-col gap-4 border-t border-white/5 pt-4">
            <NavLink href="#fonctionnalites">Fonctionnalités</NavLink>
            <NavLink href="#securite">Sécurité</NavLink>
            <NavLink href="#parents">Espace Parents</NavLink>
            <div className="flex flex-col gap-2 mt-2">
              <button onClick={onLogin} className="btn btn-secondary w-full">Se connecter</button>
              <a href={CONTACT_HREF} className="btn btn-primary w-full">Demander une démo</a>
            </div>
          </div>
        )}
      </header>

      <main id="contenu">
        {/* ── HERO ── */}
        <section className="gradient-hero text-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
            <span className="badge badge-yellow mb-6 inline-flex">Gestion scolaire tout-en-un</span>
            <h1 className="text-display text-white max-w-3xl mx-auto">
              Pilotez votre établissement depuis un seul écran
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Élèves, présences par QR code, paiements, notes, bulletins et communication avec les parents :
              GestioSchool centralise le quotidien de votre école, accessible depuis n'importe quel appareil.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href={CONTACT_HREF} className="btn btn-primary btn-xl">
                Demander une démo <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <button onClick={onLogin} className="btn btn-secondary btn-xl" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.15)' }}>
                J'ai déjà un compte
              </button>
            </div>
          </div>
        </section>

        {/* ── FONCTIONNALITÉS ── */}
        <section id="fonctionnalites" aria-labelledby="fonctionnalites-titre" className="py-20 sm:py-28" style={{ background: 'var(--bg)' }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-label" style={{ color: 'var(--brand)' }}>Fonctionnalités</span>
              <h2 id="fonctionnalites-titre" className="text-title mt-2" style={{ color: 'var(--txt-primary)' }}>
                Tout ce qu'il faut pour gérer votre école
              </h2>
              <p className="mt-3 text-sm" style={{ color: 'var(--txt-secondary)' }}>
                Un seul outil pour la direction, les enseignants, le personnel de surveillance et les parents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
              {FEATURES.map(({ icon: Icon, title, description, points }) => (
                <div key={title} className="card card-body h-full flex flex-col">
                  <div className="kpi-icon mb-4" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-heading" style={{ color: 'var(--txt-primary)' }}>{title}</h3>
                  <p className="text-sm mt-2 flex-1" style={{ color: 'var(--txt-secondary)' }}>{description}</p>
                  <ul className="mt-4 space-y-1.5">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-xs font-medium" style={{ color: 'var(--txt-secondary)' }}>
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SÉCURITÉ ── */}
        <section id="securite" aria-labelledby="securite-titre" className="py-20 sm:py-28 gradient-hero">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-label" style={{ color: 'var(--brand)' }}>Sécurité & isolation des données</span>
              <h2 id="securite-titre" className="text-title text-white mt-2">Vos données, uniquement pour votre école</h2>
              <p className="mt-4 text-slate-300 text-sm leading-relaxed">
                GestioSchool est une plateforme multi-établissements : chaque école dispose de ses propres données,
                strictement isolées des autres, hébergées sur une infrastructure cloud PostgreSQL sécurisée.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Isolation stricte des données par établissement',
                  'Accès protégé par authentification et rôles (direction, enseignant, surveillant, parent)',
                  "Hébergement cloud — accessible depuis n'importe où, sans serveur local à maintenir",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-slate-200">
                    <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card card-body" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="kpi-icon" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                  <Building2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Multi-établissements</p>
                  <p className="text-xs text-slate-400">Un espace superadmin pour gérer plusieurs écoles</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Vous gérez un réseau d'écoles ? Le tableau de bord superadmin permet de créer et suivre chaque
                établissement séparément, chacun avec son propre espace de données.
              </p>
            </div>
          </div>
        </section>

        {/* ── PARENTS ── */}
        <section id="parents" aria-labelledby="parents-titre" className="py-20 sm:py-28" style={{ background: 'var(--bg)' }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center">
            <span className="text-label" style={{ color: 'var(--brand)' }}>Espace Parents</span>
            <h2 id="parents-titre" className="text-title mt-2" style={{ color: 'var(--txt-primary)' }}>
              Des parents informés, sans avoir à appeler l'école
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm" style={{ color: 'var(--txt-secondary)' }}>
              Depuis leur téléphone, les parents consultent les notes, l'historique de présence, les reçus de
              paiement et reçoivent les annonces de l'établissement.
            </p>
            <div className="mt-10 flex justify-center">
              <button onClick={onRegister} className="btn btn-primary btn-lg">
                Créer mon compte parent <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 text-xs" style={{ color: 'var(--txt-muted)' }}>
              Réservé aux parents d'un établissement déjà inscrit sur GestioSchool.
            </p>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="py-16" style={{ background: 'var(--surface-2)' }}>
          <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
            <h2 className="text-title" style={{ color: 'var(--txt-primary)' }}>
              Prêt à moderniser la gestion de votre établissement ?
            </h2>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href={CONTACT_HREF} className="btn btn-primary btn-xl">Demander une démo</a>
              <button onClick={onLogin} className="btn btn-secondary btn-xl">Se connecter</button>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0D1117] text-slate-400 py-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-white text-sm">GestioSchool</span>
          </div>
          <a
            href="/guide-utilisateur-gestioschool.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors underline underline-offset-2"
          >
            Guide utilisateur (PDF)
          </a>
          <p className="text-xs text-center">© {new Date().getFullYear()} GestioSchool. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};
