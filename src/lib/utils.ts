import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Candidate, JobBrief } from "../services/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Filtre les candidats selon le brief actif.
 * @param candidates Liste complète des candidats
 * @param brief Brief actif (ou null)
 * @returns Liste des candidats liés à ce brief
 */
export function filterCandidatesByBrief(
  candidates: Candidate[],
  brief: JobBrief | null
): Candidate[] {
  return brief
    ? candidates.filter((c) => c.brief_id === brief.id)
    : candidates;
}
