export interface RefreshScheduleItem {
  name: string
  refreshTime: number
  label: string
}

export interface RefreshSchedule {
  [key: number]: RefreshScheduleItem
}

const rapidRefresh = { refreshTime: 10 * 1000, label: 'rapid' }
const fastRefresh = { refreshTime: 30 * 1000, label: 'fast' }
const slowRefresh = { refreshTime: 5 * 60 * 1000, label: 'slow' }

const schedule: RefreshSchedule = {
  0: {
    name: 'midnight',
    ...slowRefresh
  },
  1: {
    name: '1am',
    ...slowRefresh
  },
  2: {
    name: '2am',
    ...slowRefresh
  },
  3: {
    name: '3am',
    ...slowRefresh
  },
  4: {
    name: '4am',
    ...slowRefresh
  },
  5: {
    name: '5am',
    ...slowRefresh
  },
  6: {
    name: '6am',
    ...fastRefresh
  },
  7: {
    name: '7am',
    ...rapidRefresh
  },
  8: {
    name: '8am',
    ...fastRefresh
  },
  9: {
    name: '9am',
    ...fastRefresh
  },
  10: {
    name: '10am',
    ...fastRefresh
  },
  11: {
    name: '11am',
    ...slowRefresh
  },
  12: {
    name: 'midday',
    ...slowRefresh
  },
  13: {
    name: '1pm',
    ...slowRefresh
  },
  14: {
    name: '2pm',
    ...slowRefresh
  },
  15: {
    name: '3pm',
    ...slowRefresh
  },
  16: {
    name: '4pm',
    ...slowRefresh
  },
  17: {
    name: '5pm',
    ...slowRefresh
  },
  18: {
    name: '6pm',
    ...slowRefresh
  },
  19: {
    name: '7pm',
    ...fastRefresh
  },
  20: {
    name: '8pm',
    ...fastRefresh
  },
  21: {
    name: '9pm',
    ...rapidRefresh
  },
  22: {
    name: '10pm',
    ...rapidRefresh
  },
  23: {
    name: '11pm',
    ...slowRefresh
  },
  24: {
    name: '12pm',
    ...slowRefresh
  }
}

export default schedule
