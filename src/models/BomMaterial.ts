import { Material } from "./Material";

export interface BomMaterial {
  id: number;
  material: Material;
  quantity: number;
  unitMeasureCode: string;
}
