import React from 'react'
import { Navigate  } from 'react-router-dom'

/**
 * When this component is rendered,
 * then the app redirects to the home page
 */
export const NoMatch = () => <Navigate  to="/" />
