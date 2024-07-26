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

export const utilGetConstantValueByName = (name) => {
    const sessionStorageConstants = sessionStorage.getItem('constants');
    if(sessionStorageConstants == null)
    {
        sessionStorageConstants = getConsta
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
