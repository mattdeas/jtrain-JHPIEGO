export const utilGetConstantValueByName = (name) => {
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
