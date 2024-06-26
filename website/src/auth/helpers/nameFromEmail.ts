export function nameFromEmail (email: string): string {
  try {
    return email.split('@')[0]
      .split('.')
      .map(word => word[0]
        .toUpperCase() + word.slice(1))
      .join(' ')
  } catch (ex) {
    return email
  }
}
