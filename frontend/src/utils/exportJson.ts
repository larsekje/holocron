// Trigger a browser download of an in-memory value as a pretty-printed JSON
// file. The app has no backend write path, so client-side download is how
// generated artifacts (e.g. the Classification Review flag export) leave the
// app. Generic on purpose — callers own the shape and the filename.
export function downloadJSON(data: unknown, filename: string): void {
  if (typeof window === 'undefined') return;
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Read a user-picked file as text via a hidden <input type="file">, resolving
// with its contents. Rejects if no file is chosen or the read fails. The
// counterpart to downloadJSON for round-tripping an exported file back in.
export function pickTextFile(accept = 'application/json,.json'): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('pickTextFile is browser-only'));
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error ?? new Error('File read failed'));
      reader.readAsText(file);
    });
    input.click();
  });
}
