export const getConstantValueByName = (name) => {
    const sysConstants = JSON.parse(sessionStorage.getItem('constants'));
    const constant = sysConstants.find(constant => constant.name === name);
    if (constant) {
        return constant.code.substring(name.length + 1);
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