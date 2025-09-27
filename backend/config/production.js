// Production configuration for SMUCT Drive Backend
// This file contains production-ready settings

const isProduction = process.env.NODE_ENV === 'production'

// Production logging configuration
const logger = {
  log: (message, ...args) => {
    if (!isProduction) {
      console.log(message, ...args)
    }
  },
  error: (message, ...args) => {
    console.error(message, ...args)
  },
  warn: (message, ...args) => {
    if (!isProduction) {
      console.warn(message, ...args)
    }
  }
}

module.exports = {
  isProduction,
  logger
}
