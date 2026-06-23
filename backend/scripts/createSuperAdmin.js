const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Ensure keys are present
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('VOTRE_CLE') || !supabaseKey || supabaseKey.includes('VOTRE_CLE')) {
  console.error('❌ ERREUR: Vos clés Supabase dans backend/.env ne sont pas configurées.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node createSuperAdmin.js <nom> <telephone> <mot_de_passe>');
    console.log('Exemple: node createSuperAdmin.js "Admin Global" "00000000" "admin123"');
    process.exit(1);
  }

  const [nom, telephone, password] = args;

  try {
    // Check if the superadmin already exists
    const { data: existingAdmin, error: fetchError } = await supabase
      .from('superadmins')
      .select('id')
      .eq('telephone', telephone)
      .single();

    if (existingAdmin) {
      console.log(`⚠️ Un SuperAdmin avec le numéro ${telephone} existe déjà.`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('superadmins')
      .insert([
        {
          nom: nom,
          telephone: telephone,
          password: hashedPassword
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    console.log('✅ SuperAdmin créé avec succès !');
    console.log('Vous pouvez maintenant vous connecter sur la page de Login en sélectionnant "Accès SuperAdmin Global".');
    console.log(`Téléphone: ${telephone}`);
    console.log(`Mot de passe: ${password}`);

  } catch (error) {
    console.error('❌ Erreur lors de la création du SuperAdmin:', error.message);
  }
}

createSuperAdmin();
