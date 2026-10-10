import { prisma } from '../config/database.js';

// ============================================
// MILL SETTINGS (key-value store)
// ============================================

export const getAllSettings = async () => {
  const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
  // Convert array to key-value object for convenience
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
};

export const getSetting = async (key) => {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) throw new Error(`Setting '${key}' not found`);
  return setting;
};

export const upsertSetting = async (key, value) => {
  return await prisma.setting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
};

export const upsertManySettings = async (settingsObj) => {
  const ops = Object.entries(settingsObj).map(([key, value]) =>
    prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  );
  return await prisma.$transaction(ops);
};

export const deleteSetting = async (key) => {
  await prisma.setting.delete({ where: { key } });
};

// ============================================
// MILL INFO (grouped settings)
// ============================================

export const getMillInfo = async () => {
  const all = await getAllSettings();
  return {
    millName:      all['mill.name']      ?? 'Everest Textile Mills',
    millAddress:   all['mill.address']   ?? '',
    millGstin:     all['mill.gstin']     ?? '',
    invoicePrefix: all['mill.invoicePrefix'] ?? 'EVR',
    millPhone:     all['mill.phone']     ?? '',
    millEmail:     all['mill.email']     ?? '',
    millLogo:      all['mill.logo']      ?? '',
    currency:      all['mill.currency']  ?? 'INR',
    timezone:      all['mill.timezone']  ?? 'Asia/Kolkata',
  };
};

export const updateMillInfo = async (data) => {
  const map = {
    millName:      'mill.name',
    millAddress:   'mill.address',
    millGstin:     'mill.gstin',
    invoicePrefix: 'mill.invoicePrefix',
    millPhone:     'mill.phone',
    millEmail:     'mill.email',
    millLogo:      'mill.logo',
    currency:      'mill.currency',
    timezone:      'mill.timezone',
  };
  const settingsObj = {};
  for (const [field, key] of Object.entries(map)) {
    if (data[field] !== undefined) settingsObj[key] = data[field];
  }
  await upsertManySettings(settingsObj);
  return getMillInfo();
};

// ============================================
// MASTER DATA CONFIG (defect types, stages, etc.)
// ============================================

const DEFAULT_DEFECT_TYPES = [
  'HOLE', 'COLOUR_MISMATCH', 'UNEVEN_WEAVE', 'STAIN', 'BROKEN_THREAD',
  'LOOSE_THREAD', 'SHRINKAGE', 'OTHER',
];

const DEFAULT_PRODUCTION_STAGES = ['SPINNING', 'WEAVING', 'DYEING', 'FINISHING'];

export const getDefectTypes = async () => {
  const setting = await prisma.setting.findUnique({ where: { key: 'master.defectTypes' } });
  if (!setting) return DEFAULT_DEFECT_TYPES;
  try { return JSON.parse(setting.value); } catch { return DEFAULT_DEFECT_TYPES; }
};

export const updateDefectTypes = async (types) => {
  if (!Array.isArray(types) || types.length === 0) throw new Error('defectTypes must be a non-empty array');
  return upsertSetting('master.defectTypes', JSON.stringify(types));
};

export const getProductionStages = async () => {
  const setting = await prisma.setting.findUnique({ where: { key: 'master.productionStages' } });
  if (!setting) return DEFAULT_PRODUCTION_STAGES;
  try { return JSON.parse(setting.value); } catch { return DEFAULT_PRODUCTION_STAGES; }
};

export const getReorderDefaults = async () => {
  const setting = await prisma.setting.findUnique({ where: { key: 'master.reorderDefaults' } });
  const defaults = { defaultReorderLevel: 100, defaultLeadTimeDays: 7 };
  if (!setting) return defaults;
  try { return { ...defaults, ...JSON.parse(setting.value) }; } catch { return defaults; }
};

export const updateReorderDefaults = async (data) => {
  return upsertSetting('master.reorderDefaults', JSON.stringify(data));
};
