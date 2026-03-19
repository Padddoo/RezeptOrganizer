export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  ocrRawText: string | null;
  fileUrl: string | null;
  fileType: string | null;
  lastCookedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categories: CategoryOnRecipe[];
}

export interface CategoryOnRecipe {
  categoryId: string;
  category: Category;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface OcrResult {
  rawText: string;
  title: string;
  ingredients: string[];
}

export interface UploadResponse {
  fileUrl: string;
  fileType: string;
}
