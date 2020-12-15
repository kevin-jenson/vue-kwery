export function sleep(seconds, result) {
  return new Promise(resolve => setTimeout(resolve, seconds, result));
}

export function nightmare(seconds, result) {
  return new Promise((_resolve, reject) => setTimeout(reject, seconds, result));
}
