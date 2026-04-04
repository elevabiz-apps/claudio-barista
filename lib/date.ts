const TZ = "America/Argentina/Buenos_Aires";

export function getLocalDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function getLocalDateDisplay(): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}
