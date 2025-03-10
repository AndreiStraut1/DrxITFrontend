import { BomMaterial } from "./BomMaterial";

export interface Bom {
  id: number;
  name?: string;
  bomMaterials: BomMaterial[];
}
