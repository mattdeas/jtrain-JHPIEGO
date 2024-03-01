import React, { useState } from 'react';
import { OrganisationUnitTree } from '@dhis2/ui';

const MyComponent = () => {
    const [selected, setSelected] = useState([]);

    const handleSelect = ({ id }) => {
        setSelected(id);
    };

    const onChange = ({ selected }) => {
        setSelected(selected);
        
    }
    return (
        <div>
            <OrganisationUnitTree
                roots={['VgrqnQEtyOP']} // replace with your root organisation unit ID
                selected={selected}
                onChange={onChange}
                singleSelection
            />
        </div>
    );
};

export default MyComponent;