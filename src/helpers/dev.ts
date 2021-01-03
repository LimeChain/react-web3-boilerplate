export function logMsg(...messages: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...messages); // tslint:disable-line
  }
}
