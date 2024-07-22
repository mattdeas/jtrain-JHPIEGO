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
    instances: {
        resource: 'trackedEntityInstances',
        params: ({ ou, trackedEntityType, page, pageSize }) => ({
            ou: ou,
            trackedEntityType: trackedEntityType,
            fields: [
                'trackedEntityInstance',
                'attributes[displayName,value]',
                'orgUnits[id,displayName]',
            ],
            page: page,
            pageSize: pageSize,
        }),
    },
};

const ORG_UNITS_QUERY = {
    orgUnits: {
        resource: 'organisationUnits',
        params: {
            paging: false,
        },
    },
};


export const StaffSearch = () => {

    const defStaffOrgUnitId = utilGetConstantValueByName('jtrain-DefaultStaffOrgUnit')
    const defStaffType = utilGetConstantValueByName('jtrain-TEI-Type-Staff')
    const [page, setPage] = useState(1); // Current page
    const [pageSize, setPageSize] = useState(10); // Items per page

    const [totalItems, setTotalItems] = useState(0);
const [totalPages, setTotalPages] = useState(0);


    const { loading: orgUnitsLoading, error: orgUnitsError, data: orgUnitsData } = useDataQuery(ORG_UNITS_QUERY);
    const { loading, error, data } = useDataQuery(query, {
        variables: {
            ou: defStaffOrgUnitId,
            trackedEntityType: defStaffType,
            page: page,
            pageSize: pageSize,
        },
    });

    console.log('data is ', data)
    console.log('orgUnitsData is ', orgUnitsData)
    // State variable for search term




    
    const [searchTerm, setSearchTerm] = useState('');

    // Function to handle search term input change
    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
    }

    const handleSearchTermChangeFirst = (event) => {
        setSearchTerm(event.target.value);
    }

    const engine = useDataEngine();
    

    // Pagination controls
    const paginationControls = (
        <div>
            <button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
            <span>Page {page}</span>
            <button onClick={() => setPage(page + 1)}>Next</button>
        </div>
    );

    return (
        <div>
            <h1>Search Staff </h1>

            {/* <input type="text" value={searchTerm} onChange={handleSearchTermChange} /> */}
            {/* <input type="text" value={searchTerm} onChange={handleSearchTermChange} placeholder="Last Name" />

<input type="text" onChange={handleSearchTermChangeFirst} placeholder="First Name" /> */}

{/* <select >
    <option value="">Select Gender</option>
    <option value="male">Male</option>
    <option value="female">Female</option>
    <option value="other">Other</option>
</select> */}

{/* <input type="number" onChange={handleSearchTermChange} placeholder="Age" /> */}

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
          <TableCellHead>Last Name</TableCellHead>
          <TableCellHead>First Name</TableCellHead>
          <TableCellHead>Designation</TableCellHead>
          <TableCellHead>Mobile #</TableCellHead>
          <TableCellHead>Location</TableCellHead>
          <TableCellHead>PIN</TableCellHead>
          <TableCellHead>View</TableCellHead>
        </TableRowHead>
      </TableHead>
      <TableBody>
      {data.instances.trackedEntityInstances
    .filter(item => item.attributes && item.attributes.some(attr => attr.displayName === 'Last Name' && attr.value.toLowerCase().includes(searchTerm.toLowerCase())))
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
                    <TableCell>{attributesObj['Last Name']}</TableCell>
                    <TableCell>{attributesObj['First Name']}</TableCell>
                    <TableCell>{attributesObj['Designation']}</TableCell>
                    <TableCell>{attributesObj['Mobile #']}</TableCell>
                    <TableCell>
                        {attributesObj['Location'] 
                            ? attributesObj['Location']
                                .split('/')
                                .slice(2)
                                .map(id => {
                                    const orgUnit = orgUnitsData.orgUnits.organisationUnits.find(orgUnit => orgUnit.id === id);
                                    return orgUnit ? orgUnit.displayName : id;
                                })
                                .join(' - ')
                            : ''}
                    </TableCell>
                    <TableCell>{attributesObj['PIN']}</TableCell>
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
            
