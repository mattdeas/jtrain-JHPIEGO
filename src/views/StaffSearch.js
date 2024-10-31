import React, { useState, useEffect } from 'react';
import { useDataQuery, useDataEngine } from '@dhis2/app-runtime';
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui';
import { Link } from 'react-router-dom';
import { IconView16 } from '@dhis2/ui';
import { utilConfigConstantValueByName } from '../utils/utils';

const query = {
    instances: {
        resource: 'trackedEntityInstances',
        params: ({ ou, trackedEntityType, page, pageSize, searchLastName, searchFirstName }) => {
            const filters = [];
            if (searchLastName) {
                filters.push(`wXRW65yTN1d:like:${searchLastName}`);
            }
            if (searchFirstName) {
                filters.push(`Lez2r3d0oxb:like:${searchFirstName}`);
            }
            return {
                ou: ou,
                trackedEntityType: trackedEntityType,
                fields: [
                    'trackedEntityInstance',
                    'attributes[displayName,value]',
                    'orgUnits[id,displayName]',
                ],
                page: page,
                pageSize: pageSize,
                order: 'wXRW65yTN1d:asc,Lez2r3d0oxb:desc', //LastName , FirstName SL
                filter: filters,
            };
        },
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

    //const constants = useFetchAndStoreConstants();

    //if (!constants) {
    //    return <div>Loading...</div>;
    //}

    const defStaffOrgUnitId = utilConfigConstantValueByName('DefaultStaffOrgUnit');
    const defStaffType = utilConfigConstantValueByName('TEITypeStaff');
    const defStaffProgId = utilConfigConstantValueByName('StaffProgram');
    const [page, setPage] = useState(1); // Current page
    const [pageSize, setPageSize] = useState(50); // Items per page
    const [searchLastName, setLastName] = useState('');
    const [searchFirstName, setFirstName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const { loading: orgUnitsLoading, error: orgUnitsError, data: orgUnitsData } = useDataQuery(ORG_UNITS_QUERY);
    const { loading, error, data, refetch } = useDataQuery(query, {
        variables: {
            ou: defStaffOrgUnitId,
            trackedEntityType: defStaffType,
            page: page,
            pageSize: pageSize,
            searchLastName: searchLastName,
            searchFirstName: searchFirstName,
        },
    });

    const handleSearchTermChangeLast = (event) => {
        setLastName(event.target.value);
    };

    const handleSearchTermChangeFirst = (event) => {
        setFirstName(event.target.value);
    };

    const handleSearch = () => {
        setPage(1); // Reset to the first page
        refetch({
            ou: defStaffOrgUnitId,
            trackedEntityType: defStaffType,
            page: 1,
            pageSize: pageSize,
            searchLastName: searchLastName,
            searchFirstName: searchFirstName,
        });
    };

   
    return (
        <div>
            <h1>Search Staff</h1>
            <input type="text" onChange={handleSearchTermChangeLast} placeholder="Last Name" onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }} />
            <input type="text" onChange={handleSearchTermChangeFirst} placeholder="First Name"  onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }}/>
            <button onClick={handleSearch}>Search</button>
            <style>
                {`
                .table-container {
                    max-height: 378px; /* Adjust the height as needed */
                    overflow-y: auto;
                }
    
                .sticky-header th {
                    position: sticky;
                    top: 0;
                    background: white; /* Adjust the background color as needed */
                    z-index: 1;
                }
    
                .flex-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
    
                .left-div {
                    flex: 1;
                }
    
                .right-div {
                    flex: 1;
                    text-align: right;
                }
                `}
            </style>
            {loading && 'Loading...'}
            {error && error.message}
            {data?.instances?.trackedEntityInstances && (
                <div>

                <div className="table-container">
                
                    <Table>
                        <TableHead  className="sticky-header">
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
                                {data.instances.trackedEntityInstances.slice(0, 50).map(({ trackedEntityInstance, attributes }) => {
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
                                                    if (!orgUnitsData || !orgUnitsData.orgUnits || !orgUnitsData.orgUnits.organisationUnits) {
                                                        return ''; // Return empty string if orgUnitsData is not available
                                                    }
                                                    const orgUnit = orgUnitsData.orgUnits.organisationUnits.find(orgUnit => orgUnit.id === id.split('/').pop());
                                                    return orgUnit ? orgUnit.displayName : id.split('/').pop();
                                                })
                                                .join(' - ')
                                            : ''}
                                            </TableCell>
                                            <TableCell>{attributesObj['PIN']}</TableCell>
                                            <TableCell>
                                                <Link to={`/staffview/${trackedEntityInstance}`}><IconView16 /></Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    <br />
                    <Link to="/staffadd">
                        <button>Add New Staff</button>
                    </Link>
                </div>
            )}
        </div>
    );
};