/**
 * Shared helpers.
 *
 * Two kinds of cached configuration live in sessionStorage:
 *  - 'config'    : the jTrain app settings (UIDs for programs, stages, data elements, etc.)
 *                  loaded by App.js from the dataStore. Read with utilConfigConstantValueByName.
 *  - 'constants' : DHIS2 system constants (legacy approach, before the dataStore config).
 *                  Codes are stored as "<Name>-<value>"; the helpers strip the "<Name>-" prefix.
 */

// DHIS2 system constants - used by useFetchAndStoreConstants
const constantsQuery = {
    constants: {
        resource: "constants",
        params: {
            fields: ['id', 'name', 'code']
        }
    }
};

import { useState, useEffect } from 'react';
import { useDataEngine } from '@dhis2/app-runtime';

// Hook: returns DHIS2 constants, fetching and caching them in sessionStorage on first use
export const useFetchAndStoreConstants = () => {
    const engine = useDataEngine();
    const [constants, setConstants] = useState(null);

    useEffect(() => {
        const fetchConstants = async () => {
            const sessionStorageConstants = sessionStorage.getItem('constants');
            if (!sessionStorageConstants) {
                try {
                    // Assuming constantsQuery is available in the scope
                    const { constants } = await engine.query(constantsQuery);
                    sessionStorage.setItem('constants', JSON.stringify(constants));
                    setConstants(constants);
                } catch (error) {
                    console.error('Error fetching constants:', error);
                    // Handle error appropriately
                }
            } else {
                setConstants(JSON.parse(sessionStorageConstants));
            }
        };

        fetchConstants();
    }, [engine]);

    return constants;
};

// Look up an app setting (e.g. 'CourseProgram') from the cached dataStore config.
// Returns null if config hasn't loaded yet or the key is missing - call during render, not at module load.
export const utilConfigConstantValueByName = (name) => {
    const config = JSON.parse(sessionStorage.getItem('config'));
    if (!config) return null;
    return config[name] || null;
};

// Legacy: value of a DHIS2 constant by name (code with the "<Name>-" prefix removed); logs if constants aren't cached
export const utilGetConstantValueByName = (name) => {
    const sessionStorageConstants = sessionStorage.getItem('constants');
    if (!sessionStorageConstants) {
        console.error('Constants not found in sessionStorage. Ensure constants are fetched and stored before calling this function.');
        return null;
    }
    const constants = JSON.parse(sessionStorageConstants);
    if (Array.isArray(constants)) {
        const item = constants.find(d => d.name === name);
        if (item) {
            const codeWithoutName = item.code.replace(name + '-', '');
            return codeWithoutName;
        }
    }
    return null;
};

// Legacy: same as utilGetConstantValueByName, without the missing-cache check
export const utilgetCodeByName = (name) => {
    const sessionStorageConstants = sessionStorage.getItem('constants');
    const constants = JSON.parse(sessionStorageConstants);
    if (Array.isArray(constants)) {
        const item = constants.find(d => d.name === name);
        if (item) {
            const codeWithoutName = item.code.replace(name + '-', '');
            return codeWithoutName;
        }
    }
    return null;
};

// Legacy: expects the cache in the { constants: [...] } shape and matches on displayName
export const utilGetConstantValueByNameSession = (name) => {
    console.log('constantvalues - ', sessionStorage.getItem('constants'))
    const sysConstants = JSON.parse(sessionStorage.getItem('constants'));
    
    if(sysConstants == null)
        return null
    else{
        console.log('constantvalues - ', sysConstants)
        const constant = sysConstants.constants.find(constant => constant.displayName === name);
        
        if (constant) {
            return constant.code.substring(name.length + 1);
        }
    }
    return null;
}

// Returns a wrapper that only calls func once calls have stopped for `wait` ms
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Reusable queries for all DHIS2 constants (unpaged)
export const utilConstantsQuery2 = {
    constants: {
      resource: 'constants',
      params: {
        fields: ['displayName', 'code', 'value'],
        paging: false,
      },
    },
  };


export const utilConstantsQuery = {
    // One query object in the whole query
    attributes: {
        // The `attributes` endpoint should be used
        resource: 'constants',
        params: {
            // Paging is disabled
            paging: false,
            // Only the attribute properties that are required should be loaded
            fields: 'id, displayName, code, value',
        },
    },
}
