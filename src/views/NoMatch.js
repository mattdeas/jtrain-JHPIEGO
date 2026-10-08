import React from 'react'
import { Navigate  } from 'react-router-dom'

/**
 * When this component is rendered,
 * then the app redirects to the home page
 * (Not currently wired up as a catch-all route in App.js)
 */
export const NoMatch = () => <Navigate  to="/" />
