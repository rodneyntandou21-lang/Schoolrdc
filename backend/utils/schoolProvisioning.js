// ============================================================
// PROVISIONING ÉCOLE — Logique partagée (SuperAdmin + auto-inscription publique)
// ============================================================
const bcrypt = require('bcryptjs');
const { supabase } = require('./supabase');

/**
 * Crée une école, son jeu de tables dédié, et son premier compte directeur.
 * Utilisé à la fois par le SuperAdmin (création manuelle) et par
 * l'auto-inscription publique depuis la page de connexion.
 *
 * @param {object} data - Données validées (name, slug, address, phone, email, admin_nom, admin_telephone, admin_password, accepted_terms, accepted_privacy_policy, marketing_consent)
 * @param {object} opts - { trialDays: number, initialStatus: 'pending' | 'approved', approvedBy?: string }
 *   'pending'  : auto-inscription publique — en attente de validation SuperAdmin, l'essai ne démarre pas.
 *   'approved' : création directe par le SuperAdmin — approuvée d'office, l'essai démarre immédiatement.
 */
async function provisionSchool(data, { trialDays, initialStatus, approvedBy }) {
    const cleanSlug = data.slug;

    const { data: existing } = await supabase
        .from('schools')
        .select('id')
        .eq('slug', cleanSlug)
        .single();

    if (existing) {
        const err = new Error(`Le code "${cleanSlug}" est déjà utilisé par un autre établissement.`);
        err.status = 409;
        throw err;
    }

    const consentedAt = new Date().toISOString();

    // 1. Créer l'école (Mass assignment protection)
    const schoolPayload = {
        name: data.name.trim(),
        slug: cleanSlug,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        status: initialStatus,
        trial_ends_at: initialStatus === 'pending'
            ? null
            : new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
        approved_at: initialStatus === 'approved' ? new Date().toISOString() : null,
        approved_by: initialStatus === 'approved' ? (approvedBy || null) : null,
        director_nom: data.admin_nom ? data.admin_nom.trim() : null,
        director_telephone: data.admin_telephone ? data.admin_telephone.trim() : null,
        accepted_terms: data.accepted_terms,
        accepted_privacy_policy: data.accepted_privacy_policy,
        marketing_consent: data.marketing_consent,
        consented_at: consentedAt,
        signup_ip_hash: data.signup_ip_hash || null
    };

    const { data: school, error: schoolErr } = await supabase
        .from('schools')
        .insert(schoolPayload)
        .select()
        .single();

    if (schoolErr) throw schoolErr;

    // 2. Créer le jeu de tables dédié via RPC
    const { error: rpcErr } = await supabase.rpc('create_school_tables', { school_slug: cleanSlug });
    if (rpcErr) throw rpcErr;

    // Laisser le temps au cache de schéma PostgREST de se recharger
    await new Promise(r => setTimeout(r, 1000));

    // 3. Créer le compte Directeur dans la nouvelle table de l'école
    const hashed = await bcrypt.hash(data.admin_password, 10);

    const adminPayload = {
        nom: data.admin_nom.trim(),
        telephone: data.admin_telephone.trim(),
        password: hashed,
        role: 'directeur',
        accepted_terms: data.accepted_terms,
        accepted_privacy_policy: data.accepted_privacy_policy,
        marketing_consent: data.marketing_consent,
        consented_at: consentedAt,
        signup_ip_hash: data.signup_ip_hash || null
    };

    const { data: adminUser, error: adminErr } = await supabase
        .from(`profiles_${cleanSlug}`)
        .insert(adminPayload)
        .select()
        .single();

    if (adminErr) throw adminErr;

    return { school, adminUser };
}

module.exports = { provisionSchool };
