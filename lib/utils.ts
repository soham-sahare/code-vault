import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDifficultyColor(diff: string) {
  switch (diff) {
    case "Easy": return "text-green-400 bg-green-400/10 border-green-400/20";
    case "Medium": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case "Hard": return "text-red-400 bg-red-400/10 border-red-400/20";
    default: return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

export function formatDate(dateString: string) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-GB", { 
      day: '2-digit', 
      month: 'short', 
      year: '2-digit' 
  }).replace(/ /g, '-');
}
