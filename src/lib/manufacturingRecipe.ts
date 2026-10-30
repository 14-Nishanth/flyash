import { DEFAULT_MANUFACTURING_RECIPE, ManufacturingRecipe } from '../types';

/**
 * Resolve the shared recipe first, then a legacy browser-saved recipe, then the safe default.
 * This preserves an existing local recipe until the first admin/manager syncs it to Supabase.
 */
export function getManufacturingRecipe(cloudRecipe?: ManufacturingRecipe): ManufacturingRecipe {
  let source: any = cloudRecipe;
  if (!source && typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('flyash-profit-margin-recipe-v1');
      if (stored) source = JSON.parse(stored);
    } catch {
      source = undefined;
    }
  }
  if (!source || !Array.isArray(source.materials)) return DEFAULT_MANUFACTURING_RECIPE;

  const defaultRecipe = DEFAULT_MANUFACTURING_RECIPE;
  const incomingMaterials = source.materials.filter((item: any) => item && typeof item.name === 'string');
  const materials = incomingMaterials.length
    ? incomingMaterials.map((item: any, index: number) => {
        const fallback = defaultRecipe.materials.find((material) => material.id === item.id) ||
          defaultRecipe.materials.find((material) => material.name.toLowerCase() === item.name.toLowerCase());
        return {
          id: String(item.id || fallback?.id || `material-${index + 1}`),
          name: item.name,
          purchasePrice: Number(item.purchasePrice) || 0,
          purchaseQuantity: Number(item.purchaseQuantity) || 1,
          purchaseUnitKg: Number(item.purchaseUnitKg) || fallback?.purchaseUnitKg || 1,
          kgPerBatch: Number(item.kgPerBatch) || 0,
        };
      })
    : defaultRecipe.materials;

  return {
    bricksPerBatch: Math.max(1, Number(source.bricksPerBatch) || defaultRecipe.bricksPerBatch),
    sellingPricePerBrick: Number(source.sellingPricePerBrick) || defaultRecipe.sellingPricePerBrick,
    laborPerBatch: Number(source.laborPerBatch) || 0,
    powerFuelPerBatch: Number(source.powerFuelPerBatch) || 0,
    materials,
  };
}
