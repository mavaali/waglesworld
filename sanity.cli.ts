import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '3xigt9u7',
    dataset: 'production'
  },
  deployment: {
    appId: 'fued39n2b5fsob7vtcubv87t',
    autoUpdates: true,
  }
})
