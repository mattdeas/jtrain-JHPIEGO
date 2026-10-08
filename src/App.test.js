import { CustomDataProvider } from '@dhis2/app-runtime'
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

// Smoke test: the app mounts inside a mock DHIS2 data provider without throwing
it('renders without crashing', () => {
    const div = document.createElement('div')
    ReactDOM.render(
        <CustomDataProvider>
            <App />
        </CustomDataProvider>,
        div
    )
    ReactDOM.unmountComponentAtNode(div)
})
