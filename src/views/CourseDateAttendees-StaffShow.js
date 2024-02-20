import { useDataQuery,useDataMutation } from '@dhis2/app-runtime'
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui'
import React, { useState, useEffect } from 'react'
import { Link} from 'react-router-dom'


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

const itemsPerPage = 10;
//const [currentPage, setCurrentPage] = useState(1);

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

const query = {  
    instances: {
        resource: 'trackedEntityInstances',
        params: ({ ou ,trackedEntityType, tei_id }) => ({
            ou : ou,
            trackedEntityType : trackedEntityType,
            trackedEntityInstance: tei_id,
        }),
    },
}

const qryStaffCourseDetails = {  
    events: {
        resource: 'events',
        params: {
            program: 'Ss21byybIqu',
            ouMode: 'ACCESSIBLE',
            filter: 'tsU3YD7kfYU:eq:y4QZIFjVmey',
        },
    },
}


export const StaffShow = ({tei_id}) => {
    console.log('tei_id:',tei_id)
    const { loading, error, data } = useDataQuery(query, {
        variables: {
            ou: 'VgrqnQEtyOP',
            trackedEntityType: 'W9FNXXgGbm7',
            tei_id: tei_id,
        },
    })

    // const { loadingSCD, errorSCD, dataSCD } = useDataQuery(qryStaffCourseDetails)
    
    

    // useEffect(() => {
    //     if (!loadingSCD && dataSCD && !errorSCD) {
    //         // Perform your action here
    //         console.log('loadingSCD', loadingSCD);
    // console.log('dataSCD0',dataSCD);
    // console.log('errorSCD', errorSCD);
    //     }
    // }, [loadingSCD, dataSCD, errorSCD]);
   
    return (

        <div> 
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
          <TableCellHead>Open</TableCellHead>
        </TableRowHead>
      </TableHead>
      <TableBody>
      {data.instances.trackedEntityInstances
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
                    <TableCell>{attributesObj['Date of Birth']}</TableCell>
                    <TableCell>{attributesObj['Age']}</TableCell>
                    <TableCell >
                    
                    <Link to={`/staffview/${trackedEntityInstance}`}>View</Link>
                    </TableCell>
                    <TableCell>{trackedEntityInstance}</TableCell>
                </TableRow>
            );
        }
    )}
                        </TableBody>
    </Table>
                )
            }
        </div>
    )
}
            
