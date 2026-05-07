export interface UserProfile {
  diseases: string[];
  metrics: {
    fastingBloodSugar?: string;
    bloodPressure?: string;
  };
  allergies: string[];
}

export interface FoodItem {
  name: string;
  amount: string;
  riskLevel: 'ok' | 'warn' | 'bad';
  riskReason: string;
}

export interface Suggestion {
  original: string;
  replacement: string;
  benefit: string;
}

export interface Nutrients {
  calories: { value: number; percentage: number };
  sodium: { value: number; percentage: number };
  protein: { value: number; percentage: number };
  carbs: { value: number; percentage: number };
}

export interface MealRecord {
  id: string;
  timestamp: number;
  thumbnailBase64: string;
  score: number;
  scoreLevel: 'excellent' | 'good' | 'caution' | 'poor';
  foods: FoodItem[];
  suggestions: Suggestion[];
  nutrients: Nutrients;
}

const PROFILE_KEY = 'manzhu_profile';
const RECORDS_KEY = 'manzhu_records';

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveMealRecord(record: MealRecord): void {
  if (typeof window === 'undefined') return;
  const records = loadAllRecords();
  records.unshift(record);
  // Keep at most 100 records
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records.slice(0, 100)));
}

export function loadAllRecords(): MealRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(RECORDS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MealRecord[];
  } catch {
    return [];
  }
}

export function loadRecentRecords(days = 7): MealRecord[] {
  const all = loadAllRecords();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return all.filter((r) => r.timestamp >= cutoff);
}

export function compressImageToThumbnail(
  base64: string,
  mimeType: string,
  maxWidth = 200
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL(mimeType, 0.7));
    };
    img.src = `data:${mimeType};base64,${base64}`;
  });
}
