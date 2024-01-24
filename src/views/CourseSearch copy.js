import { useDataQuery } from '@dhis2/app-runtime'
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui'
import React, { useState } from 'react'
import { Link, BrowserRouter, Switch, Route } from 'react-router-dom'


const itemsPerPage = 10;
//const [currentPage, setCurrentPage] = useState(1);


/**
 * This defined the data that we want to get
 * The `app-runtime` will be explained in a another session after this one,
 * so you don't have to worry about the specifics for now
 */
const qryCourseTypes = {
    // One query object in the whole query
    attributes: {
        // The `attributes` endpoint should be used
        resource: 'trackedEntityTypes',
        params: {
            // Paging is disabled
            paging: false,
            // Only the attribute properties that are required should be loaded
            fields: 'id, displayName',
        },
    },
}

const qryPrograms = {
    // One query object in the whole query
    attributes: {
        // The `attributes` endpoint should be used
        resource: 'programs',
        params: {
            // Paging is disabled
            paging: false,
            // Only the attribute properties that are required should be loaded
            fields: 'id, displayName',
        },
    },
}

const qryConstants = {
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

const query4 = {
    programs: {
        resource: 'programs',
        params: ({ pageSize }) => ({
            order: 'displayName:asc',
            pageSize,
            page: 1
        }),
    },


}


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

export const CourseSearch1 = () => {
    // This is yet another functionality provided by the `@dhis2/app-runtime`
    // For the time being it does not matter what this does exactly
    // * loading will be true while the data is being loaded
    // * error will be an instance of `Error` if something fails
    // * data will be null while the data is being loaded or if something fails
    // * data will be an object once loading is done with the following path
    //   data.attributes.attributes <- That's an array of objects
    const dSysConstants = useDataQuery(qryConstants)

    let staffMemberid, defaultStaffOrgUnit;
    console.log({ dSysConstants })
    // Check if dSysConstants and constants exist
    if (dSysConstants && dSysConstants.data && dSysConstants.data.attributes && dSysConstants.data.attributes.constants) {
        // Find the jtrain-StaffMember and jtrain-DefaultStaffOrgUnit objects
        const courseObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-StaffMember');
        const defaultStaffOrgUnitObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-DefaultStaffOrgUnit');

        console.log(courseObj)
        console.log(defaultStaffOrgUnitObj)
        // Extract the values
        staffMemberid = courseObj ? courseObj.code : null;
        defaultStaffOrgUnit = defaultStaffOrgUnitObj ? defaultStaffOrgUnitObj.code : null;

        console.log('Constants Loaded')// Log the values to the console
        
    }
    //console.log({ dSysConstants });

    //const { loading, error, data } = useDataQuery(qryTrackedEntityTypes)
    //console.log({ loading, error, data });
    console.log({ staffMemberid, defaultStaffOrgUnit });
    const { loading, error, data } = useDataQuery(query, {
        variables: {
            ou: 'VgrqnQEtyOP',
            trackedEntityType: 'W9FNXXgGbm7',
        },
    })
    console.log({ loading, error, data });
    console.log('data output', data);
    //console.log('data instances', data.instances);
    //console.log('data TE instances', data.instances.trackedEntityInstances);
    //console.log('data TE instances Att', data.instances.trackedEntityInstances.attributes);

    // State variable for search term
    const [searchTerm, setSearchTerm] = useState('');

    // Function to handle search term input change
    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
    }

    //https://dhis2.af.jhpiego.org/api/trackedEntityInstances/query.json?ou=x0Zl6eKgC7B&ouMode=SELECTED&&order=created:desc&program=P59PhQsB6tb&pageSize=50&page=1&totalPages=false

    return (
        <div>
            <h1>Search Courses </h1>

            <input type="text" value={searchTerm} onChange={handleSearchTermChange} />

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
          <TableCellHead>Thematic Area</TableCellHead>
          <TableCellHead>Course Name</TableCellHead>
          <TableCellHead>Course Dates</TableCellHead>
          <TableCellHead>Open</TableCellHead>
        </TableRowHead>
      </TableHead>
      <TableBody>
      {data.instances.trackedEntityInstances
    .filter(item => item.attributes.some(attr => attr.displayName === 'Family Name' && attr.value.toLowerCase().includes(searchTerm.toLowerCase())))
    .slice(0, 10)
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
                    <TableCell >
                    <Link to={`/staffview/${trackedEntityInstance}`}>View Details</Link>
                    </TableCell>
                </TableRow>
            );
        }
    )}
                        </TableBody>
                        <Link to="/staffdetail-add">
    <button>Add New Course</button>
</Link>
      
    </Table>
                )
            }
        </div>
    )
}
            
