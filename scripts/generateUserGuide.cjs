// ============================================================
// GÉNÉRATEUR DU GUIDE UTILISATEUR PDF — GestioSchool
// ============================================================
// À relancer après chaque nouvelle fonctionnalité visible utilisateur :
//   node scripts/generateUserGuide.cjs
// Sortie : public/guide-utilisateur-gestioschool.pdf
//
// Contenu volontairement limité aux fonctionnalités réellement présentes
// dans le code (voir src/utils/rolePermissions.ts pour les rôles/accès et
// src/App.tsx pour la liste des pages) — ne pas décrire une fonctionnalité
// qui n'existe pas encore dans l'app.
'use strict';

const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

const BRAND = '#F4B400';
const BRAND_DARK = '#B38600';
const INK = '#0E1420';
const MUTED = '#5A6478';
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

let pageNumber = 0;
let currentSectionTitle = '';

function drawFooter(doc) {
  const [r, g, b] = hexToRgb(MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(r, g, b);
  doc.text('GestioSchool — Guide utilisateur', MARGIN, PAGE_H - 10);
  doc.text(String(pageNumber), PAGE_W - MARGIN, PAGE_H - 10, { align: 'right' });
  doc.setDrawColor(230, 230, 230);
  doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
}

function newPage(doc, sectionTitle) {
  doc.addPage();
  pageNumber += 1;
  if (sectionTitle) currentSectionTitle = sectionTitle;
  drawFooter(doc);
  return MARGIN;
}

function ensureSpace(doc, y, needed, sectionTitle) {
  if (y + needed > PAGE_H - 22) {
    return newPage(doc, sectionTitle);
  }
  return y;
}

function drawCover(doc) {
  pageNumber = 1;
  const [br, bg, bb] = hexToRgb(BRAND);
  const [ir, ig, ib] = hexToRgb(INK);

  // Fond sombre pleine page
  doc.setFillColor(13, 17, 23);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Bloc logo
  doc.setFillColor(br, bg, bb);
  doc.roundedRect(PAGE_W / 2 - 14, 60, 28, 28, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(ir, ig, ib);
  doc.text('GS', PAGE_W / 2, 78, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.text('GestioSchool', PAGE_W / 2, 112, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(200, 205, 215);
  doc.text('Guide utilisateur', PAGE_W / 2, 124, { align: 'center' });

  doc.setDrawColor(br, bg, bb);
  doc.setLineWidth(0.6);
  doc.line(PAGE_W / 2 - 20, 132, PAGE_W / 2 + 20, 132);

  doc.setFontSize(10);
  doc.setTextColor(150, 158, 172);
  doc.text('Gestion des élèves, présences, paiements, notes et communication avec les parents', PAGE_W / 2, 145, { align: 'center', maxWidth: 140 });

  const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  doc.setFontSize(9);
  doc.setTextColor(120, 128, 142);
  doc.text(`Édition — ${dateStr}`, PAGE_W / 2, PAGE_H - 20, { align: 'center' });
}

function sectionTitle(doc, y, title, icon) {
  y = ensureSpace(doc, y, 20, title);
  const [br, bg, bb] = hexToRgb(BRAND);
  doc.setFillColor(br, bg, bb);
  doc.roundedRect(MARGIN, y, 8, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(icon || '•', MARGIN + 4, y + 5.6, { align: 'center' });

  const [ir, ig, ib] = hexToRgb(INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(ir, ig, ib);
  doc.text(title, MARGIN + 12, y + 6.5);
  return y + 16;
}

function paragraph(doc, y, text, opts) {
  opts = opts || {};
  const size = opts.size || 10;
  const [mr, mg, mb] = hexToRgb(MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  doc.setTextColor(mr, mg, mb);
  const lines = doc.splitTextToSize(text, CONTENT_W - (opts.indent || 0));
  const lineH = size * 0.5;
  for (const line of lines) {
    y = ensureSpace(doc, y, lineH + 1, currentSectionTitle);
    doc.text(line, MARGIN + (opts.indent || 0), y);
    y += lineH;
  }
  return y + 2;
}

function subheading(doc, y, text) {
  y = ensureSpace(doc, y, 10, currentSectionTitle);
  const [ir, ig, ib] = hexToRgb(INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(ir, ig, ib);
  doc.text(text, MARGIN, y);
  return y + 6.5;
}

function bulletList(doc, y, items) {
  const [br, bg, bb] = hexToRgb(BRAND_DARK);
  const [ir, ig, ib] = hexToRgb(INK);
  for (const item of items) {
    const lines = doc.splitTextToSize(item, CONTENT_W - 8);
    y = ensureSpace(doc, y, lines.length * 5 + 2, currentSectionTitle);
    doc.setFillColor(br, bg, bb);
    doc.circle(MARGIN + 1.3, y - 1.3, 0.9, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(ir, ig, ib);
    doc.text(lines, MARGIN + 6, y);
    y += lines.length * 5 + 2;
  }
  return y + 2;
}

function roleTable(doc, y, rows) {
  y = ensureSpace(doc, y, 12 + rows.length * 8, currentSectionTitle);
  const col1 = 55;
  const [br, bg, bb] = hexToRgb(BRAND);
  doc.setFillColor(br, bg, bb);
  doc.rect(MARGIN, y, CONTENT_W, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 20, 0);
  doc.text('Rôle', MARGIN + 3, y + 5.5);
  doc.text('Accès principal', MARGIN + col1 + 3, y + 5.5);
  y += 8;

  const [mr, mg, mb] = hexToRgb(MUTED);
  const [ir, ig, ib] = hexToRgb(INK);
  rows.forEach(([role, access], i) => {
    const lines = doc.splitTextToSize(access, CONTENT_W - col1 - 6);
    const rowH = Math.max(8, lines.length * 4.6 + 3);
    y = ensureSpace(doc, y, rowH, currentSectionTitle);
    if (i % 2 === 0) {
      doc.setFillColor(248, 249, 251);
      doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(ir, ig, ib);
    doc.text(role, MARGIN + 3, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mr, mg, mb);
    doc.text(lines, MARGIN + col1 + 3, y + 5.5);
    y += rowH;
  });
  doc.setDrawColor(230, 230, 230);
  doc.rect(MARGIN, y - rows.reduce((s, [, a]) => s + Math.max(8, doc.splitTextToSize(a, CONTENT_W - col1 - 6).length * 4.6 + 3), 0) - 8, CONTENT_W, 0);
  return y + 4;
}

// ── Contenu ────────────────────────────────────────────────────

const SECTIONS = [
  {
    icon: '1',
    title: 'Rôles et accès',
    body: [
      "Chaque compte GestioSchool a un rôle qui détermine les pages et actions accessibles. Un même établissement peut avoir plusieurs comptes avec des rôles différents (direction, comptabilité, surveillance, enseignement).",
    ],
    table: [
      ['Directeur / Directeur Général / Admin', 'Accès complet : élèves, paiements, analyses, documents, paramètres, recouvrement, académique, notes, bulletins, historique, import/export, messagerie, annonces'],
      ['Comptable', 'Élèves, paiements, recouvrement, reçus, analyses, import/export, messagerie'],
      ['Proviseur / Censeur', 'Élèves, analyses, gestion académique, saisie des notes, bulletins, messagerie'],
      ['Surveillant', 'Scan des présences/sorties, informations élève, cartes scolaires'],
      ['Parent', 'Tableau de bord parent, historique, reçus, badges, notes, messagerie, annonces'],
      ['Superadmin', 'Gestion globale des établissements (création, suspension, statistiques réseau)'],
    ],
  },
  {
    icon: '2',
    title: 'Élèves & cartes scolaires',
    body: [
      "La page Élèves centralise la fiche de chaque enfant : identité, classe, cycle, statut financier et présence.",
    ],
    bullets: [
      "Ajout d'un élève avec classe, cycle (Primaire/Collège/Lycée), écolage et frais d'inscription",
      "Le statut de paiement (Soldé / Partiel / Non soldé) se met à jour automatiquement",
      "Chaque élève dispose d'une carte scolaire imprimable avec QR code unique",
      "Le verso de la carte est personnalisable (Paramètres > Cartes) pour le règlement intérieur ou vos mentions",
    ],
  },
  {
    icon: '3',
    title: 'Présences par scan QR',
    body: [
      "Le surveillant scanne la carte de l'élève à l'entrée et à la sortie pour enregistrer sa présence en temps réel.",
    ],
    bullets: [
      "Scan d'entrée (ScanPresence) et de sortie (ScanSortie)",
      "Consultation des informations élève au scan (ScanInformation)",
      "Historique de présence consultable par la direction et par le parent",
    ],
  },
  {
    icon: '4',
    title: 'Paiements & recouvrement',
    body: [
      "Deux pistes financières distinctes sont suivies pour chaque élève : l'écolage (scolarité) et les frais d'inscription — elles ne sont jamais mélangées.",
    ],
    bullets: [
      "Enregistrement des versements et calcul automatique du solde restant",
      "Génération de reçus, vérifiables via la page Vérification de reçu",
      "Suivi des impayés et relances via la page Recouvrement",
      "Tarifs par classe personnalisables dans Paramètres, avec option d'application rétroactive aux élèves déjà inscrits",
    ],
  },
  {
    icon: '5',
    title: 'Notes & bulletins',
    body: [
      "Les enseignants saisissent les notes par classe et matière ; GestioSchool calcule les moyennes et prépare les bulletins.",
    ],
    bullets: [
      "Saisie des notes (Saisie des notes) et gestion académique par classe",
      "Calcul automatique des moyennes et génération des bulletins PDF",
      "Statistiques élèves par âge et par sexe, filtrables par cycle/classe et imprimables",
    ],
  },
  {
    icon: '6',
    title: 'Portail Parents',
    body: [
      "Chaque parent dispose d'un espace dédié pour suivre la scolarité de son enfant sans avoir à appeler l'école.",
    ],
    bullets: [
      "Tableau de bord parent avec vue d'ensemble de la scolarité",
      "Consultation des notes, de l'historique de présence et des reçus de paiement",
      "Réception des annonces de l'établissement et messagerie directe avec l'école",
    ],
  },
  {
    icon: '7',
    title: 'Messagerie, annonces & analyses',
    body: [
      "La communication et le pilotage de l'établissement se font depuis les mêmes espaces que la gestion quotidienne.",
    ],
    bullets: [
      "Messagerie directe école ↔ parents",
      "Annonces générales diffusées à tout l'établissement",
      "Tableaux de bord et analyses des indicateurs clés (effectifs, paiements, présence)",
      "Historique complet des activités pour la traçabilité",
    ],
  },
  {
    icon: '8',
    title: 'Import / Export & sécurité des données',
    body: [
      "Les listes d'élèves existantes peuvent être importées en masse, et les données exportées pour vos démarches administratives.",
      "Chaque établissement dispose de son propre espace de données, strictement isolé des autres écoles utilisant GestioSchool, hébergé sur une infrastructure cloud PostgreSQL sécurisée.",
    ],
    bullets: [
      "Import Excel en masse des élèves",
      "Export des données pour rapports et démarches administratives",
      "Isolation stricte des données par établissement",
      "Accès protégé par authentification et rôles",
    ],
  },
];

function buildGuide() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawCover(doc);

  let y = newPage(doc, 'Sommaire');
  y = sectionTitle(doc, y, 'Sommaire', '☰');
  SECTIONS.forEach((s, i) => {
    y = ensureSpace(doc, y, 7, 'Sommaire');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    const [ir, ig, ib] = hexToRgb(INK);
    doc.setTextColor(ir, ig, ib);
    doc.text(`${i + 1}. ${s.title}`, MARGIN, y);
    y += 8;
  });

  SECTIONS.forEach((s) => {
    y = newPage(doc, s.title);
    y = sectionTitle(doc, y, s.title, s.icon);
    for (const p of s.body) y = paragraph(doc, y, p);
    if (s.table) y = roleTable(doc, y, s.table);
    if (s.bullets) y = bulletList(doc, y, s.bullets);
  });

  const outDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'guide-utilisateur-gestioschool.pdf');
  fs.writeFileSync(outPath, Buffer.from(doc.output('arraybuffer')));
  console.log(`✅ Guide utilisateur généré : ${outPath}`);
}

buildGuide();
