// Example groups:
// app-to-app-connected-web-dev/Github
// app-to-app-connected-web-prod/GFXSuite

const authorizedAppSources = [
  'app-to-app-connected-web-dev',
  'app-to-app-connected-web-prod'
]

const authorizedAppScopes = [
  'Github',
  'GFXSuite'
]

export function isAuthorizedAppGroup (group: string): boolean {
  const [source, scope] = group.split('/')
  return authorizedAppSources.includes(source) && authorizedAppScopes.includes(scope)
}

export function isAuthorizedApp (groups: string[]): boolean {
  return groups.some(isAuthorizedAppGroup)
}
