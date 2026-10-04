export type Tier = "easy" | "medium" | "hard";

export interface QuickAddEntry {
  ref: string;
  count: number;
}

export interface SetPieceDraft {
  name: string;
  tier: Tier;
  scene: string;
  battlefield: string;
  tactics: string;
  suggested_adversaries: string;
  quick_add: QuickAddEntry[];
  skill_uses: string;
  dice_menu: string;
  gm_notes: string;
}

export interface SetPiece extends SetPieceDraft {
  id: string;
  source: "library" | "user";
}

export const emptyDraft = (): SetPieceDraft => ({
  name: "",
  tier: "medium",
  scene: "",
  battlefield: "",
  tactics: "",
  suggested_adversaries: "",
  quick_add: [],
  skill_uses: "",
  dice_menu: "",
  gm_notes: "",
});

export const toDraft = (piece: SetPiece): SetPieceDraft => ({
  name: piece.name,
  tier: piece.tier,
  scene: piece.scene,
  battlefield: piece.battlefield,
  tactics: piece.tactics,
  suggested_adversaries: piece.suggested_adversaries,
  quick_add: piece.quick_add.map(e => ({ ...e })),
  skill_uses: piece.skill_uses,
  dice_menu: piece.dice_menu,
  gm_notes: piece.gm_notes,
});

const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE)
  || "http://localhost:8080";

const url = (path: string) => `${API_BASE}${path}`;

export const fetchSetPieces = async (): Promise<SetPiece[]> => {
  const res = await fetch(url("/set-pieces/"));
  if (!res.ok) throw new Error(`list failed: ${res.status}`);
  return res.json();
};

export const createSetPiece = async (draft: SetPieceDraft): Promise<SetPiece> => {
  const res = await fetch(url("/set-pieces/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new Error(`create failed: ${res.status}`);
  return res.json();
};

export const updateSetPiece = async (id: string, draft: SetPieceDraft): Promise<SetPiece> => {
  const res = await fetch(url(`/set-pieces/${encodeURIComponent(id)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new Error(`update failed: ${res.status}`);
  return res.json();
};

export const deleteSetPiece = async (id: string): Promise<void> => {
  const res = await fetch(url(`/set-pieces/${encodeURIComponent(id)}`), {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) throw new Error(`delete failed: ${res.status}`);
};
