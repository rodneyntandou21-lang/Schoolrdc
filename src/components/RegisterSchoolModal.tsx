// ============================================================
// MODAL — Auto-inscription d'un établissement (Directeur)
// ============================================================
import React, { useState } from 'react';
import { Building2, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useStore } from '../store/useStore';

interface RegisterSchoolModalProps {
  onClose: () => void;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export const RegisterSchoolModal: React.FC<RegisterSchoolModalProps> = ({ onClose }) => {
  const login = useStore((s) => s.login);

  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const [adminNom, setAdminNom] = useState('');
  const [adminTelephone, setAdminTelephone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptedTerms || !acceptedPrivacy) {
      setError("Vous devez accepter les conditions d'utilisation et la politique de confidentialité.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register-school`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          acronym,
          slug,
          address,
          phone,
          admin_nom: adminNom,
          admin_telephone: adminTelephone,
          admin_password: adminPassword,
          accepted_terms: acceptedTerms,
          accepted_privacy_policy: acceptedPrivacy,
          marketing_consent: marketingConsent,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erreur lors de l'inscription.");

      setSuccess(true);
      // Connexion automatique du directeur sur son nouvel établissement
      await login(adminTelephone, adminPassword, slug);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 px-6 py-5 flex items-start gap-3 shrink-0">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-black text-lg tracking-tight">Inscrire mon établissement</h2>
            <p className="text-amber-50 text-xs font-bold mt-0.5">30 jours d'essai gratuit • Sans engagement</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shrink-0 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <p className="text-orange-600 font-black text-xs uppercase tracking-widest mb-3">1. Information de l'établissement</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet de l'établissement *</label>
                <input
                  type="text" required placeholder="ex: Complexe Scolaire Sainte Marie"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={name} onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Acronyme / Sigle (ex: CSMA) *</label>
                <input
                  type="text" required placeholder="CSMA"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={acronym} onChange={(e) => setAcronym(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Code / Identifiant URL (Slug) *</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-400">
                  <span className="pl-4 pr-1 text-slate-400 text-sm font-bold select-none">/</span>
                  <input
                    type="text" required placeholder="sainte-marie"
                    className="flex-1 py-3 pr-4 bg-transparent text-sm focus:outline-none"
                    value={slug}
                    onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse physique</label>
                <input
                  type="text" placeholder="ex: Brazzaville"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={address} onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone de l'école</label>
                <input
                  type="tel" placeholder="+228 90000000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-orange-600 font-black text-xs uppercase tracking-widest mb-3">2. Identifiants du Directeur (Administration)</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet du Directeur *</label>
                <input
                  type="text" required placeholder="M. Jean Dupont"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={adminNom} onChange={(e) => setAdminNom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone du Directeur *</label>
                <input
                  type="tel" required placeholder="+228 90000000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={adminTelephone} onChange={(e) => setAdminTelephone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} required minLength={6} placeholder="Au moins 6 caractères"
                    className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-left w-full space-y-1.5 border-t border-slate-100 pt-3">
            <p className="text-[10px] font-bold text-slate-700">Confidentialité & Données</p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 accent-amber-500 rounded scale-90" required />
              <span className="text-[10px] text-slate-500 leading-tight">
                J'accepte les <span className="font-bold text-slate-700">CGU</span> de la plateforme pour mon établissement. <span className="text-rose-500">*</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="mt-0.5 accent-amber-500 rounded scale-90" required />
              <span className="text-[10px] text-slate-500 leading-tight">
                J'accepte la <span className="font-bold text-slate-700">politique de confidentialité</span> et le traitement des données de mon établissement. <span className="text-rose-500">*</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} className="mt-0.5 accent-amber-500 rounded scale-90" />
              <span className="text-[10px] text-slate-500 leading-tight">
                J'accepte de recevoir des actus et conseils. <span className="text-slate-400">(Optionnel)</span>
              </span>
            </label>
          </div>

          {error && <div className="text-rose-500 text-xs font-bold text-center">{error}</div>}
          {success && <div className="text-emerald-600 text-xs font-bold text-center">Établissement créé avec succès !</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Création en cours...' : "Lancer mon essai gratuit"}
          </button>
        </form>
      </div>
    </div>
  );
};
