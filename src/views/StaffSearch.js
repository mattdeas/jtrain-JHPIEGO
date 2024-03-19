import { useDataQuery, useDataEngine } from '@dhis2/app-runtime'
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui'
import React, { useState, useEffect} from 'react'
import { Link, BrowserRouter, Switch, Route } from 'react-router-dom'
import { ResizeObserver } from '@juggle/resize-observer';
import { utilGetConstantValueByName } from '../utils/utils';
import { IconView16 } from '@dhis2/ui'



function debounce(func, wait) {
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

const handleResize = debounce(() => {
}, 200);

window.addEventListener('resize', handleResize);


const query = {
    // "page" variable below can be dinamically passed via refetch (see "handlePageChange" below)
    instances: {
        resource: 'trackedEntityInstances',
        params: ({ ou ,trackedEntityType }) => ({
            ou : ou,
            trackedEntityType : trackedEntityType,
        }),
    },
}

//https://dhis2.af.jhpiego.org/api/trackedEntityInstances?ou=x0Zl6eKgC7B&trackedEntityType=W9FNXXgGbm7

export const StaffSearch = () => {

    const defStaffOrgUnitId = utilGetConstantValueByName('jtrain-DefaultStaffOrgUnit')
    const defStaffType = utilGetConstantValueByName('jtrain-TEI-Type-Staff')

    const { loading, error, data } = useDataQuery(query, {
        variables: {
            ou: defStaffOrgUnitId,
            trackedEntityType: defStaffType,
        },
    })
    // State variable for search term
    const [searchTerm, setSearchTerm] = useState('');

    // Function to handle search term input change
    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
    }

    

    return (
        <div>
            <h1>Search Staff </h1>

            {/* <input type="text" value={searchTerm} onChange={handleSearchTermChange} /> */}
            <input type="text" value={searchTerm} onChange={handleSearchTermChange} placeholder="Family Name" />

<input type="text" onChange={handleSearchTermChange} placeholder="First Name" />

<select >
    <option value="">Select Gender</option>
    <option value="male">Male</option>
    <option value="female">Female</option>
    <option value="other">Other</option>
</select>

<input type="number" onChange={handleSearchTermChange} placeholder="Age" />

            {
                // display that the data is being loaded
                // when loading is true
                loading && 'Loading...'
            }

            {
                // display the error message
                // is an error occurred
                error && error.message
                
            }

            {
                // if there is any data available
                data?.instances?.trackedEntityInstances && (
                    <Table>
      <TableHead>
        <TableRowHead>
          <TableCellHead>Family Name</TableCellHead>
          <TableCellHead>First Name</TableCellHead>
          <TableCellHead>Gender</TableCellHead>
          <TableCellHead>Date of Birth</TableCellHead>
          <TableCellHead>Age</TableCellHead>
          <TableCellHead>View</TableCellHead>
        </TableRowHead>
      </TableHead>
      <TableBody>
      {data.instances.trackedEntityInstances
    .filter(item => item.attributes.some(attr => attr.displayName === 'Family Name' && attr.value.toLowerCase().includes(searchTerm.toLowerCase())))
    .slice(0, 100)
    .map(
        ({ trackedEntityInstance, attributes }) => {
            // Create an object from the attributes array
            const attributesObj = attributes.reduce((obj, item) => {
                obj[item.displayName] = item.value;
                return obj;
            }, {});

            return (
                <TableRow key={trackedEntityInstance}>
                    <TableCell>{attributesObj['Family Name']}</TableCell>
                    <TableCell>{attributesObj['First Name']}</TableCell>
                    <TableCell>{attributesObj['Gender']}</TableCell>
                    <TableCell>{attributesObj['Date of Birth']}</TableCell>
                    <TableCell>{attributesObj['Age']}</TableCell>
                    <TableCell >
                    <Link to={`/staffview/${trackedEntityInstance}`}><IconView16/></Link>
                    </TableCell>
                </TableRow>
            );
        }
    )}
                        </TableBody>
                        <Link to="/staffadd">
    <button>Add New Staff</button>
</Link>
      
    </Table>
                )
            }
        </div>
    )
}
            
