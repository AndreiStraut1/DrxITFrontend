export interface Product {
  id: number;
  name: string;
  description: string;
  estimated_height: number;
  estimated_weight: number;
  estimated_width: number;
  currentStage?: string;
}