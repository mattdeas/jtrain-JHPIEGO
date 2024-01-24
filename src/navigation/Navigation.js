import { useNavigate, useMatch } from 'react-router-dom';
import { Menu, MenuItem } from '@dhis2/ui';
import PropTypes from 'prop-types';
import React from 'react';

const NavigationItem = ({ label, path }) => {
    const navigate = useNavigate();
    const match = useMatch(path);
    const isActive = match?.isExact;

    


};

NavigationItem.propTypes = {
    label: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
};

export const Home = () => (
    <div>
        <h1>Home</h1>

        <p>UI Library: Tasks</p>
    </div>
);

export const Navigation = () => (
    <Menu>
        <NavigationItem label="Home" path="/" />

        <NavigationItem
            // Menu item for the meta data page
            label="Attributes"
            path="/attributes"
        />

        <NavigationItem
            // Menu item for the Form page
            label="Form"
            path="/form"
        />

        <NavigationItem
            // Menu item for the Staff page
            label="Staff"
            path="/staff"
            
        />
    </Menu>
);