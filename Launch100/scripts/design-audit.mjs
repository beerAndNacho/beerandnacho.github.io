import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { TEMPLATES } from '../assets/templates.js';
import { DESIGN_PACKS, PACK_IDS, designPackFor } from '../assets/design-packs.js';
import { RENDERERS, renderPreview, previewStructure } from '../assets/preview-renderers.js';

if (TEMPLATES.length !== 10) throw new Error(`Expected 10 templates, got ${TEMPLATES.length}`);
if (PACK_IDS.length !== 10) throw new Error(`Expected 10 design packs, got ${PACK_IDS.length}`);
if (Object.keys(RENDERERS).length !== 10) throw new Error(`Expected 10 renderers, got ${Object.keys(RENDERERS).length}`);

const requiredByTemplate = {
  'salt-bakery': ['bakery-mast', 'bread-shelf', 'bakery-story', 'bakery-visit'],
  'noon-barber': ['barber-ticker', 'barber-poster', 'price-board', 'style-strip', 'barber-book'],
  'table7-restaurant': ['dining-intro', 'course-chapters', 'chef-note', 'pairing', 'reservation'],
  'dal-hanok-stay': ['courtyard', 'room-grid', 'hanok-day', 'neighborhood', 'hanok-book'],
  'compile-bootcamp': ['academy-shell', 'terminal-card', 'metrics-row', 'track-grid', 'curriculum', 'project-board'],
  'harbor-law': ['law-dossier', 'trust-row', 'practice-grid', 'response-process', 'counsel', 'law-contact'],
  'void-architecture': ['arch-index', 'project-masonry', 'manifesto', 'blueprint', 'arch-contact'],
  'mint-clinic': ['care-visual', 'appointment-card', 'treatment-grid', 'care-journey', 'doctor-section', 'clinic-book'],
  'endpoint-api': ['terminal', 'metrics', 'feature-bento', 'code-block', 'pricing-status', 'faq'],
  'desktop-cv': ['os-bar', 'profile-window', 'windows-grid', 'skills-terminal', 'career-list', 'contact-command']
};

const structures = new Set();
const hashes = new Set();
const reports = [];

for (const template of TEMPLATES) {
  const pack = designPackFor(template.id);
  const state = {
    templateId: template.id,
    ...structuredClone(template.d),
    services: template.d.services.map(([name, description, price]) => ({ name, description, price })),
    primary: template.p[0],
    secondary: template.p[1],
    background: template.p[2],
    ink: template.p[3],
    font: pack.defaultFont,
    imageMood: pack.traits[0]
  };
  const html = renderPreview(state, template);
  const structure = previewStructure(template.id);
  const hash = createHash('sha256').update(html).digest('hex');

  if (!DESIGN_PACKS[template.id]) throw new Error(`Missing design pack ${template.id}`);
  if (!RENDERERS[template.id]) throw new Error(`Missing renderer ${template.id}`);
  if (pack.sections.length < 4 || pack.traits.length < 4) throw new Error(`Shallow pack metadata ${template.id}`);
  if (!html.includes(`data-pack="${template.id}"`)) throw new Error(`Missing pack marker ${template.id}`);
  if (!html.includes(`data-template="${template.id}"`)) throw new Error(`Missing template marker ${template.id}`);
  if (!html.includes(`data-structure="${structure}"`)) throw new Error(`Missing structure marker ${template.id}`);
  if (!html.includes(template.d.businessName) || !html.includes(template.d.tagline)) throw new Error(`Dynamic business content missing ${template.id}`);
  for (const token of requiredByTemplate[template.id]) {
    if (!html.includes(token)) throw new Error(`${template.id} missing unique component ${token}`);
  }
  if (structures.has(structure)) throw new Error(`Duplicate structure signature ${structure}`);
  if (hashes.has(hash)) throw new Error(`Duplicate rendered HTML ${template.id}`);
  structures.add(structure);
  hashes.add(hash);

  const servicePositions = state.services.map((service) => html.indexOf(service.name));
  if (servicePositions.some((position) => position < 0)) throw new Error(`Service content missing ${template.id}`);

  reports.push({
    id: template.id,
    pack: pack.KoreanLabel,
    signature: structure,
    sections: pack.sections,
    traits: pack.traits,
    htmlBytes: Buffer.byteLength(html),
    sha256: hash
  });
}

const report = {
  version: '2.0.0',
  templateCount: TEMPLATES.length,
  rendererCount: Object.keys(RENDERERS).length,
  uniqueStructures: structures.size,
  uniqueHtmlDocuments: hashes.size,
  templates: reports,
  failures: []
};
writeFileSync('design-audit-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(`Launch100 design audit passed: ${report.templateCount} templates, ${report.uniqueStructures} structures and ${report.uniqueHtmlDocuments} unique documents.`);
