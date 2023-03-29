export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function splitArray<T>(arr: T[], n: number): T[][] {
  const size = Math.ceil(arr.length / n);
  const result = new Array(n);
  for(let i= 0; i < n; i++){
    result[i] = arr.slice(i * size, (i+1) * size);
  }

  return result;
}